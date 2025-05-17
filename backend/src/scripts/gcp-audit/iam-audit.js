const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
// iam-audit.js
// Scaffold for GCP IAM Audit
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  const findings = [];
  const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
  const errors = [];
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const crm = google.cloudresourcemanager('v1');
    const iam = google.iam('v1');
    // List IAM policy bindings for the project
    const policyResp = await crm.projects.getIamPolicy({
      resource: projectId,
      auth: authClient
    });
    const iamPolicies = policyResp.data.bindings || [];
    // Detect overly permissive roles
    for (const binding of iamPolicies) {
      findings.push({
        check: 'IAM Policy Binding',
        role: binding.role,
        members: binding.members,
        overlyPermissive: binding.role === 'roles/owner' || binding.role === 'roles/editor',
        passed: !(binding.role === 'roles/owner' || binding.role === 'roles/editor'),
        details: binding
      });
      summary.totalChecks++;
      if (binding.role === 'roles/owner' || binding.role === 'roles/editor') summary.failed++;
      else summary.passed++;
    }
    // List all service accounts
    const saResp = await iam.projects.serviceAccounts.list({
      name: `projects/${projectId}`,
      auth: authClient
    });
    const serviceAccounts = saResp.data.accounts || [];
    // Check for service account key usage
    for (const sa of serviceAccounts) {
      const keysResp = await iam.projects.serviceAccounts.keys.list({
        name: sa.name,
        auth: authClient
      });
      const userManagedKeys = (keysResp.data.keys || []).filter(k => k.keyType === 'USER_MANAGED');
      findings.push({
        check: 'Service Account Key',
        serviceAccount: sa.email,
        userManagedKeys: userManagedKeys.map(k => k.name),
        passed: userManagedKeys.length === 0,
        details: sa
      });
      summary.totalChecks++;
      if (userManagedKeys.length > 0) summary.failed++;
      else summary.passed++;
    }
    await writeAuditResults('iam-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (err) {
    errors.push({ check: 'IAM Audit', error: err.message });
    await writeAuditResults('iam-audit', findings, summary, errors, projectId);
    throw err;
  }
}

module.exports = { run };
