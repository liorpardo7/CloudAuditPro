import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const execAsync = promisify(exec);

// Map of script names to their file paths and result file paths
const SCRIPT_MAP: Record<string, { script: string; resultFile: string }> = {
  'gcp-iam-service-accounts': {
    script: 'gcp_iam_service_accounts.py',
    resultFile: 'gcp_iam_service_accounts.json'
  },
  'gcp-iam-roles': {
    script: 'gcp_iam_roles.py',
    resultFile: 'gcp_iam_roles.json'
  },
  'gcp-iam-policies': {
    script: 'gcp_iam_policies.py',
    resultFile: 'gcp_iam_policies.json'
  },
  'gcp-iam-permissions': {
    script: 'gcp_iam_permissions.py',
    resultFile: 'gcp_iam_permissions.json'
  },
  'gcp-iam-service-account-keys': {
    script: 'gcp_iam_service_account_keys.py',
    resultFile: 'gcp_iam_service_account_keys.json'
  },
  'gcp-iam-workload-identity': {
    script: 'gcp_iam_workload_identity.py',
    resultFile: 'gcp_iam_workload_identity.json'
  },
  'gcp-iam-organization-policies': {
    script: 'gcp_iam_organization_policies.py',
    resultFile: 'gcp_iam_organization_policies.json'
  },
  'gcp-iam-conditional-iam': {
    script: 'gcp_iam_conditional_iam.py',
    resultFile: 'gcp_iam_conditional_iam.json'
  },
  'gcp-iam-privilege-escalation': {
    script: 'gcp_iam_privilege_escalation.py',
    resultFile: 'gcp_iam_privilege_escalation.json'
  },
  'gcp-iam-role-recommendations': {
    script: 'gcp_iam_role_recommendations.py',
    resultFile: 'gcp_iam_role_recommendations.json'
  },
  'gcp-iam-service-account-impersonation': {
    script: 'gcp_iam_service_account_impersonation.py',
    resultFile: 'gcp_iam_service_account_impersonation.json'
  },
  'gcp-iam-credential-configuration': {
    script: 'gcp_iam_credential_configuration.py',
    resultFile: 'gcp_iam_credential_configuration.json'
  },
  'gcp-iam-credential-access': {
    script: 'gcp_iam_credential_access.py',
    resultFile: 'gcp_iam_credential_access.json'
  },
  'gcp-iam-credential-rotation': {
    script: 'gcp_iam_credential_rotation.py',
    resultFile: 'gcp_iam_credential_rotation.json'
  },
  'gcp-iam-credential-storage': {
    script: 'gcp_iam_credential_storage.py',
    resultFile: 'gcp_iam_credential_storage.json'
  },
  'gcp-iam-credential-encryption': {
    script: 'gcp_iam_credential_encryption.py',
    resultFile: 'gcp_iam_credential_encryption.json'
  },
  'gcp-iam-credential-monitoring': {
    script: 'gcp_iam_credential_monitoring.py',
    resultFile: 'gcp_iam_credential_monitoring.json'
  },
  'gcp-iam-credential-remediation': {
    script: 'gcp_iam_credential_remediation.py',
    resultFile: 'gcp_iam_credential_remediation.json'
  },
  'gcp-iam-credential-compliance': {
    script: 'gcp_iam_credential_compliance.py',
    resultFile: 'gcp_iam_credential_compliance.json'
  },
  'gcp-iam-credential-audit': {
    script: 'gcp_iam_credential_audit.py',
    resultFile: 'gcp_iam_credential_audit.json'
  }
};

const RESULTS_DIR = path.join(process.cwd(), 'gcp-audit', 'results');

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const scriptName = params.slug[0];
    const scriptInfo = SCRIPT_MAP[scriptName];

    if (!scriptInfo) {
      return NextResponse.json(
        { error: `Script ${scriptName} not found` },
        { status: 404 }
      );
    }

    // Ensure results directory exists
    await fs.mkdir(RESULTS_DIR, { recursive: true });

    // Delete old result file if it exists
    const resultFilePath = path.join(RESULTS_DIR, scriptInfo.resultFile);
    try {
      await fs.unlink(resultFilePath);
    } catch (error) {
      // Ignore error if file doesn't exist
    }

    // Run the script
    const scriptPath = path.join(process.cwd(), 'gcp-audit', scriptInfo.script);
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    if (stderr) {
      console.error(`Script error: ${stderr}`);
      return NextResponse.json(
        { error: `Script execution failed: ${stderr}` },
        { status: 500 }
      );
    }

    // Read the new result file
    try {
      const resultData = await fs.readFile(resultFilePath, 'utf-8');
      return NextResponse.json(JSON.parse(resultData));
    } catch (error) {
      console.error(`Error reading result file: ${error}`);
      return NextResponse.json(
        { error: 'Failed to read result file' },
        { status: 500 }
      );
    }
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