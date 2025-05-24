/**
 * Script to run all GCP audits and update the database AuditItem status
 */

const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const gcpClient = require('../../shared-scripts/gcp-audit/gcpClient');

const prisma = new PrismaClient();

// Map category audit names to their JS file and results file
const CATEGORY_TO_FILES = {
  'compute': {
    script: 'compute-audit.js',
    resultFile: 'compute-audit-results.json'
  },
  'storage': {
    script: 'storage-audit.js',
    resultFile: 'storage-audit-results.json'
  },
  'networking': {
    script: 'networking-audit.js',
    resultFile: 'networking-audit-results.json'
  },
  'security': {
    script: 'security-audit.js',
    resultFile: 'security-audit-results.json'
  },
  'cost': {
    script: 'cost-audit.js',
    resultFile: 'cost-audit-results.json'
  },
  'data-protection': {
    script: 'data-protection-audit.js',
    resultFile: 'data-protection-audit-results.json'
  },
  'storage-lifecycle': {
    script: 'storage-lifecycle-audit.js',
    resultFile: 'storage-lifecycle-audit-results.json'
  },
  'monitoring': {
    script: 'monitoring-audit.js',
    resultFile: 'monitoring-audit-results.json'
  },
  'resource-utilization': {
    script: 'resource-utilization-audit.js',
    resultFile: 'resource-utilization-audit-results.json'
  },
  'cost-allocation': {
    script: 'cost-allocation-audit.js',
    resultFile: 'cost-allocation-audit-results.json'
  },
  'billing': {
    script: 'billing-audit.js',
    resultFile: 'billing-audit-results.json'
  },
  'discount': {
    script: 'discount-audit.js',
    resultFile: 'discount-audit-results.json'
  },
  'budget': {
    script: 'budget-audit.js',
    resultFile: 'budget-audit-results.json'
  },
  'bigquery': {
    script: 'bigquery-audit.js',
    resultFile: 'bigquery-audit-results.json'
  },
  'compliance': {
    script: 'compliance-audit.js',
    resultFile: 'compliance-audit-results.json'
  },
  'devops': {
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

/**
 * Run a specific audit script and return the results
 */
async function runAudit(category, projectId = 'default-project') {
  return new Promise((resolve, reject) => {
    try {
      const auditInfo = CATEGORY_TO_FILES[category];
      if (!auditInfo) {
        return reject(new Error(`Invalid category: ${category}`));
      }

      // Use the correct path to the audit scripts
      const scriptDir = path.join(process.cwd(), 'src/scripts/gcp-audit');
      
      // Check for GCP credentials
      const credentialFiles = fs.readdirSync(scriptDir).filter(file => 
        file.endsWith('.json') && !file.endsWith('-results.json') && !file.includes('audit-')
      );
      
      if (credentialFiles.length === 0) {
        return reject(new Error('No GCP credential files found. Please add a service account key file.'));
      }
      
      // Set the credential file as an environment variable
      const credentialFile = credentialFiles[0];
      const credentialPath = path.join(scriptDir, credentialFile);
      
      console.log(`Running ${category} audit: ${auditInfo.script} for project ${projectId}`);
      
      // Create environment variables for the script
      const scriptEnv = {
        ...process.env,
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
        GCP_PROJECT_ID: projectId,
        NODE_ENV: 'production'
      };
      
      // Spawn the audit script
      const proc = spawn('node', [auditInfo.script], {
        cwd: scriptDir,
        env: scriptEnv,
        stdio: 'pipe'
      });
      
      let stdoutData = '';
      let stderrData = '';
      
      proc.stdout.on('data', (data) => {
        stdoutData += data.toString();
        // Log progress
        process.stdout.write('.');
      });
      
      proc.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`${category} stderr: ${data.toString()}`);
      });
      
      proc.on('exit', (code) => {
        console.log(`\n${category} audit completed with code ${code}`);
        
        if (code === 0) {
          // Read the results file
          const resultFilePath = path.join(scriptDir, auditInfo.resultFile);
          
          if (fs.existsSync(resultFilePath)) {
            try {
              const resultData = fs.readFileSync(resultFilePath, 'utf-8');
              const results = JSON.parse(resultData);
              resolve({
                success: true,
                category,
                results,
                timestamp: new Date()
              });
            } catch (err) {
              reject(new Error(`Error reading results file: ${err.message}`));
            }
          } else {
            reject(new Error(`Results file not found: ${auditInfo.resultFile}`));
          }
        } else {
          reject(new Error(`Script exited with error code ${code}. Stderr: ${stderrData}`));
        }
      });
      
      proc.on('error', (err) => {
        reject(new Error(`Failed to start audit process: ${err.message}`));
      });
      
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Update AuditItem in database based on audit results
 */
async function updateAuditItemStatus(category, results) {
  try {
    // Get all audit items for this category
    const categoryRecord = await prisma.auditCategory.findFirst({
      where: {
        name: { contains: category, mode: 'insensitive' }
      },
      include: {
        items: true
      }
    });

    if (!categoryRecord) {
      console.log(`No audit category found for: ${category}`);
      return;
    }

    console.log(`Found ${categoryRecord.items.length} audit items for category ${category}`);

    // Determine status based on findings
    const hasFindings = results.findings && results.findings.length > 0;
    
    // Map the findings to specific audit items if possible
    // This is a simplified version - in a real system you'd need more detailed mapping
    for (const item of categoryRecord.items) {
      // Default status if we can't determine more specifically
      let newStatus = hasFindings ? 'failing' : 'passing';
      
      // Try to find a matching finding for this specific item
      if (results.findings) {
        const matchingFinding = results.findings.find(f => 
          f.title.toLowerCase().includes(item.name.toLowerCase()) ||
          (f.description && f.description.toLowerCase().includes(item.name.toLowerCase()))
        );
        
        if (matchingFinding) {
          newStatus = 'failing';
        }
      }
      
      // Update the audit item
      await prisma.auditItem.update({
        where: { id: item.id },
        data: {
          status: newStatus,
          lastRun: new Date(),
          lastResult: JSON.stringify({
            status: newStatus, 
            timestamp: new Date(),
            source: `${category} audit`
          })
        }
      });
      
      console.log(`Updated audit item '${item.name}' status to '${newStatus}'`);
    }
  } catch (err) {
    console.error(`Error updating audit items for ${category}:`, err);
  }
}

/**
 * Main function to run all audits and update the database
 */
async function runAllAuditsAndUpdateDb() {
  const projectId = process.env.GCP_PROJECT_ID || 'default-project';
  
  console.log('Starting audit run for all categories...');
  console.log(`Project ID: ${projectId}`);
  
  for (const category of Object.keys(CATEGORY_TO_FILES)) {
    try {
      console.log(`\n=== Running ${category} audit ===`);
      
      const auditResult = await runAudit(category, projectId);
      
      if (auditResult.success) {
        console.log(`Updating database with ${category} audit results...`);
        await updateAuditItemStatus(category, auditResult.results);
      }
    } catch (err) {
      console.error(`Error running ${category} audit:`, err);
    }
  }
  
  console.log('\nCompleted all audits!');
}

// Run the main function and handle any uncaught errors
runAllAuditsAndUpdateDb()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 