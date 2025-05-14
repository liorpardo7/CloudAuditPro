const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
// iam-audit.js
// Scaffold for GCP IAM Audit
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

async function runIamAudit() {
  try {
    const authClient = await auth.getAuthClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const crm = google.cloudresourcemanager('v1');
    const iam = google.iam('v1');

    const results = {
      timestamp: new Date().toISOString(),
      iamPolicies: [],
      serviceAccounts: [],
      keyFindings: [],
      recommendations: []
    };

    // List IAM policy bindings for the project
    const policyResp = await crm.projects.getIamPolicy({
      resource: projectId,
      auth: authClient
    });
    results.iamPolicies = policyResp.data.bindings || [];

    // Detect overly permissive roles
    for (const binding of results.iamPolicies) {
      if (binding.role === 'roles/owner' || binding.role === 'roles/editor') {
        results.recommendations.push({
          issue: 'Overly permissive role assignment',
          recommendation: 'Avoid assigning Owner/Editor roles. Use least privilege.',
          severity: 'high',
          role: binding.role,
          members: binding.members
        });
      }
      if (binding.members.some(m => m.startsWith('user:') || m.startsWith('serviceAccount:'))) {
        if (binding.role.startsWith('roles/iam.serviceAccountTokenCreator')) {
          results.recommendations.push({
            issue: 'ServiceAccountTokenCreator assigned',
            recommendation: 'Restrict ServiceAccountTokenCreator to only trusted identities.',
            severity: 'medium',
            role: binding.role,
            members: binding.members
          });
        }
      }
    }

    // List all service accounts
    const saResp = await iam.projects.serviceAccounts.list({
      name: `projects/${projectId}`,
      auth: authClient
    });
    results.serviceAccounts = saResp.data.accounts || [];

    // Check for service account key usage
    for (const sa of results.serviceAccounts) {
      const keysResp = await iam.projects.serviceAccounts.keys.list({
        name: sa.name,
        auth: authClient
      });
      const userManagedKeys = (keysResp.data.keys || []).filter(k => k.keyType === 'USER_MANAGED');
      if (userManagedKeys.length > 0) {
        results.keyFindings.push({
          serviceAccount: sa.email,
          userManagedKeys: userManagedKeys.map(k => k.name)
        });
        results.recommendations.push({
          issue: 'Service account has user-managed keys',
          recommendation: 'Rotate and remove user-managed keys where possible. Use Workload Identity.',
          severity: 'high',
          serviceAccount: sa.email
        });
      }
    }

    // (Optional) User/service account activity could be checked via Cloud Audit Logs (not implemented here)

    fs.writeFileSync(path.join(__dirname, 'iam-audit-results.json'), JSON.stringify(results, null, 2));
    console.log('IAM audit completed. Results saved to iam-audit-results.json');
  } catch (error) {
    console.error('Error during IAM audit:', error);
  }
}

runIamAudit();

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("iam-audit", findings, summary, errors);
