import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { updateJobStatus } from '../store';
import { spawn } from 'child_process';

const prisma = new PrismaClient();

// Map category audit script names to their JS file and results file
const CATEGORY_TO_FILES: Record<string, { script: string; resultFile: string }> = {
  'compute-audit': {
    script: 'compute-audit.js',
    resultFile: 'compute-audit-results.json'
  },
  'storage-audit': {
    script: 'storage-audit.js',
    resultFile: 'storage-audit-results.json'
  },
  'networking-audit': {
    script: 'networking-audit.js',
    resultFile: 'networking-audit-results.json'
  },
  'security-audit': {
    script: 'security-audit.js',
    resultFile: 'security-audit-results.json'
  },
  'cost-audit': {
    script: 'cost-audit.js',
    resultFile: 'cost-audit-results.json'
  },
  'data-protection-audit': {
    script: 'data-protection-audit.js',
    resultFile: 'data-protection-audit-results.json'
  },
  'storage-lifecycle-audit': {
    script: 'storage-lifecycle-audit.js',
    resultFile: 'storage-lifecycle-audit-results.json'
  },
  'monitoring-audit': {
    script: 'monitoring-audit.js',
    resultFile: 'monitoring-audit-results.json'
  },
  'resource-utilization-audit': {
    script: 'resource-utilization-audit.js',
    resultFile: 'resource-utilization-audit-results.json'
  },
  'cost-allocation-audit': {
    script: 'cost-allocation-audit.js',
    resultFile: 'cost-allocation-audit-results.json'
  },
  'billing-audit': {
    script: 'billing-audit.js',
    resultFile: 'billing-audit-results.json'
  },
  'billing-advanced-audit': {
    script: 'billing-advanced-audit.js',
    resultFile: 'billing-advanced-audit-results.json'
  },
  'discount-audit': {
    script: 'discount-audit.js',
    resultFile: 'discount-audit-results.json'
  },
  'budget-audit': {
    script: 'budget-audit.js',
    resultFile: 'budget-audit-results.json'
  },
  'bigquery-audit': {
    script: 'bigquery-audit.js',
    resultFile: 'bigquery-audit-results.json'
  },
  'compliance-audit': {
    script: 'compliance-audit.js',
    resultFile: 'compliance-audit-results.json'
  },
  'devops-audit': {
    script: 'devops-audit.js',
    resultFile: 'devops-audit-results.json'
  },
  'permissions-audit': {
    script: 'permissions-audit.js',
    resultFile: 'permissions-audit-results.json'
  },
  'api-audit': {
    script: 'api-audit.js',
    resultFile: 'api-audit-results.json'
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const category = params.slug[0];
    
    // Get script info
    const scriptInfo = CATEGORY_TO_FILES[category];

    if (!scriptInfo) {
      return NextResponse.json(
        { error: `Audit category '${category}' not found. Available categories: ${Object.keys(CATEGORY_TO_FILES).join(', ')}` },
        { status: 404 }
      );
    }

    // First, check if result file already exists
    const scriptDir = path.join(process.cwd(), 'backend/src/scripts/gcp-audit');
    const resultFilePath = path.join(scriptDir, scriptInfo.resultFile);
    
    if (fs.existsSync(resultFilePath)) {
      try {
        // Read the existing result file
        const resultData = fs.readFileSync(resultFilePath, 'utf-8');
        const parsedData = JSON.parse(resultData);
        
        // Check if the results are recent (less than 1 hour old)
        const timestamp = parsedData.timestamp ? new Date(parsedData.timestamp) : null;
        const isRecent = timestamp && (Date.now() - timestamp.getTime() < 60 * 60 * 1000);
        
        if (isRecent) {
          // Return existing results if they're recent
          return NextResponse.json({
            id: category,
            name: `GCP Audit - ${parsedData.projectId || 'unknown project'}`,
            status: 'completed',
            startedAt: timestamp?.toISOString() || new Date().toISOString(),
            completedAt: new Date().toISOString(),
            resourcesScanned: parsedData.resourcesScanned || 0,
            findingsCount: parsedData.findingsCount || { total: 0 },
            findings: parsedData.findings || [],
            services: parsedData.services || [],
            results: parsedData
          });
        }
      } catch (error) {
        console.error(`Error reading existing result file: ${error}`);
        // Continue to run a new audit
      }
    }
    
    // Create a job ID for this audit
    const projectId = request.nextUrl.searchParams.get('projectId') || 'default-project';
    const categoryKey = category.replace('-audit', '');
    const jobId = `job_${projectId}_${categoryKey}_${Date.now()}`;
    
    // Initialize job status
    updateJobStatus(jobId, { 
      status: 'running', 
      started: Date.now(),
      currentStep: `Starting ${category}...`,
      progress: 0,
      projectId
    });
    
    // Check for GCP credentials
    const credentialFiles = fs.readdirSync(scriptDir).filter(file => 
      file.endsWith('.json') && !file.endsWith('-results.json') && !file.includes('audit-')
    );
    
    if (credentialFiles.length === 0) {
      updateJobStatus(jobId, {
        status: 'error',
        error: 'No GCP credential files found. Please add a service account key file to the backend/src/scripts/gcp-audit directory.'
      });
      return NextResponse.json({ 
        jobId,
        error: 'No GCP credential files found'
      }, { status: 400 });
    }

    // Set the credential file as an environment variable
    const credentialFile = credentialFiles[0];
    const credentialPath = path.join(scriptDir, credentialFile);
    
    // Create a properly typed environment object
    const scriptEnv: NodeJS.ProcessEnv = {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      GCP_PROJECT_ID: projectId,
      NODE_ENV: 'production'
    };

    console.log(`Running audit: ${scriptInfo.script} for project ${projectId} with credentials ${credentialFile}`);

    // Spawn the audit script with proper TypeScript types
    const proc = spawn('node', [scriptInfo.script], {
      cwd: scriptDir,
      env: scriptEnv,
      stdio: 'pipe',
      detached: true
    });

    // Capture output for debugging
    let stdoutData = '';
    let stderrData = '';

    proc.stdout?.on('data', (data: Buffer) => {
      const dataStr = data.toString();
      stdoutData += dataStr;
      
      // Try to parse progress data if available
      try {
        const progressMatch = dataStr.match(/Progress: (\d+)%\s+(.+)/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1], 10);
          const currentStep = progressMatch[2];
          updateJobStatus(jobId, { progress, currentStep });
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const dataStr = data.toString();
      stderrData += dataStr;
      console.error(`Audit stderr: ${dataStr}`);
    });

    proc.on('exit', (code: number | null) => {
      console.log(`Audit completed with code ${code}`);
      if (code === 0) {
        updateJobStatus(jobId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Audit completed successfully',
          stdout: stdoutData,
          completed: Date.now()
        });
      } else {
        updateJobStatus(jobId, {
          status: 'error',
          error: `Script exited with code ${code}: ${stderrData}`,
          stdout: stdoutData,
          stderr: stderrData
        });
      }
    });

    proc.unref();
    
    // Return the job ID - client should poll status endpoint
    return NextResponse.json({ 
      jobId,
      message: `${category} started. Poll /api/audits/status?id=${jobId} for results.`,
      status: 'running'
    });
    
  } catch (error) {
    console.error(`API error: ${error}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 