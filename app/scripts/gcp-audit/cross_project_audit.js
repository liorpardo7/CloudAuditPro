// @audit-status: VERIFIED
// @last-tested: 2024-03-19
// @test-results: Script runs successfully, generates valid results file with proper structure
const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');

async function run(projectId, tokens) {
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const crm = google.cloudresourcemanager('v1');
    const billing = google.cloudbilling('v1');
    const findings = [];
    const errors = [];
    const summary = {
      totalChecks: 0,
      passed: 0,
      failed: 0
    };

    // List all projects
    const projectsResp = await crm.projects.list({ auth: authClient });
    const projects = (projectsResp.data.projects || []).filter(p => p.lifecycleState === 'ACTIVE');
    console.log(`Found ${projects.length} active projects`);

    // Analyze each project
    for (const project of projects) {
      const projectId = project.projectId;
      // 1. Waste Detection: Check for projects with no resources
      try {
        const compute = google.compute('v1');
        const bucketsResp = await google.storage('v1').buckets.list({ project: projectId, auth: authClient });
        const vmsResp = await compute.instances.aggregatedList({ project: projectId, auth: authClient });
        const sqlResp = await google.sqladmin('v1beta4').instances.list({ project: projectId, auth: authClient });
        const buckets = bucketsResp.data.items || [];
        const vms = Object.values(vmsResp.data.items || {}).flatMap(z => z.instances || []);
        const sqls = sqlResp.data.items || [];
        if (buckets.length === 0 && vms.length === 0 && sqls.length === 0) {
          findings.push({
            check: 'Project Waste',
            project: projectId,
            result: 'No major resources found',
            passed: false,
            recommendation: 'Consider deleting or archiving this project'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Project Waste',
            project: projectId,
            result: 'Resources found',
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;
      } catch (err) {
        errors.push({ check: 'Project Waste', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }

      // 2. Resource Distribution: Count resource types
      try {
        const compute = google.compute('v1');
        const bucketsResp = await google.storage('v1').buckets.list({ project: projectId, auth: authClient });
        const vmsResp = await compute.instances.aggregatedList({ project: projectId, auth: authClient });
        const sqlResp = await google.sqladmin('v1beta4').instances.list({ project: projectId, auth: authClient });
        const buckets = bucketsResp.data.items || [];
        const vms = Object.values(vmsResp.data.items || {}).flatMap(z => z.instances || []);
        const sqls = sqlResp.data.items || [];
        findings.push({
          check: 'Resource Distribution',
          project: projectId,
          result: `Buckets: ${buckets.length}, VMs: ${vms.length}, SQL: ${sqls.length}`,
          passed: true,
          details: { buckets: buckets.length, vms: vms.length, sql: sqls.length }
        });
        summary.passed++;
        summary.totalChecks++;
      } catch (err) {
        errors.push({ check: 'Resource Distribution', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }

      // 3. Cost Allocation: Check billing account linkage
      try {
        const billingResp = await billing.projects.getBillingInfo({ name: `projects/${projectId}`, auth: authClient });
        if (!billingResp.data.billingAccountName) {
          findings.push({
            check: 'Cost Allocation',
            project: projectId,
            result: 'No billing account linked',
            passed: false,
            recommendation: 'Link a billing account to this project'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Cost Allocation',
            project: projectId,
            result: `Billing account: ${billingResp.data.billingAccountName}`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;
      } catch (err) {
        errors.push({ check: 'Cost Allocation', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }
    }

    // Write results
    await writeAuditResults('cross-project-audit', findings, summary, errors, 'all-projects');
    return { findings, summary, errors };
  } catch (error) {
    console.error('Error running cross-project audit:', error);
    throw error;
  }
}

module.exports = { run }; 