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

    for (const project of projects) {
      // 1. Check project labels
      try {
        const labels = project.labels || {};
        if (Object.keys(labels).length === 0) {
          findings.push({
            check: 'Missing Project Labels',
            project: projectId,
            result: 'No labels set on project',
            passed: false,
            recommendation: 'Add labels for cost allocation and management'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Project Labels',
            project: projectId,
            result: `Labels: ${JSON.stringify(labels)}`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;
      } catch (err) {
        errors.push({ check: 'Project Labels', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }

      // 2. Check resource labels (buckets, VMs, SQL)
      try {
        // Storage Buckets
        const bucketsResp = await google.storage('v1').buckets.list({ project: projectId, auth: authClient });
        const buckets = bucketsResp.data.items || [];
        for (const bucket of buckets) {
          if (!bucket.labels || Object.keys(bucket.labels).length === 0) {
            findings.push({
              check: 'Missing Bucket Labels',
              project: projectId,
              resource: bucket.name,
              result: 'No labels set on bucket',
              passed: false,
              recommendation: 'Add labels for cost allocation and management'
            });
            summary.failed++;
          } else {
            findings.push({
              check: 'Bucket Labels',
              project: projectId,
              resource: bucket.name,
              result: `Labels: ${JSON.stringify(bucket.labels)}`,
              passed: true
            });
            summary.passed++;
          }
          summary.totalChecks++;
        }
        // Compute VMs
        const compute = google.compute('v1');
        const vmsResp = await compute.instances.aggregatedList({ project: projectId, auth: authClient });
        const vms = Object.values(vmsResp.data.items || {}).flatMap(z => z.instances || []);
        for (const vm of vms) {
          if (!vm.labels || Object.keys(vm.labels).length === 0) {
            findings.push({
              check: 'Missing VM Labels',
              project: projectId,
              resource: vm.name,
              result: 'No labels set on VM',
              passed: false,
              recommendation: 'Add labels for cost allocation and management'
            });
            summary.failed++;
          } else {
            findings.push({
              check: 'VM Labels',
              project: projectId,
              resource: vm.name,
              result: `Labels: ${JSON.stringify(vm.labels)}`,
              passed: true
            });
            summary.passed++;
          }
          summary.totalChecks++;
        }
        // Cloud SQL
        const sqlResp = await google.sqladmin('v1beta4').instances.list({ project: projectId, auth: authClient });
        const sqls = sqlResp.data.items || [];
        for (const sql of sqls) {
          if (!sql.settings.userLabels || Object.keys(sql.settings.userLabels).length === 0) {
            findings.push({
              check: 'Missing SQL Labels',
              project: projectId,
              resource: sql.name,
              result: 'No labels set on SQL instance',
              passed: false,
              recommendation: 'Add labels for cost allocation and management'
            });
            summary.failed++;
          } else {
            findings.push({
              check: 'SQL Labels',
              project: projectId,
              resource: sql.name,
              result: `Labels: ${JSON.stringify(sql.settings.userLabels)}`,
              passed: true
            });
            summary.passed++;
          }
          summary.totalChecks++;
        }
      } catch (err) {
        errors.push({ check: 'Resource Labels', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }

      // 3. Inconsistent naming (simple check: label keys should be lowercase, no spaces)
      try {
        const allLabels = [];
        // Project labels
        if (project.labels) allLabels.push(...Object.keys(project.labels));
        // Bucket labels
        const bucketsResp = await google.storage('v1').buckets.list({ project: projectId, auth: authClient });
        const buckets = bucketsResp.data.items || [];
        for (const bucket of buckets) {
          if (bucket.labels) allLabels.push(...Object.keys(bucket.labels));
        }
        // VM labels
        const compute = google.compute('v1');
        const vmsResp = await compute.instances.aggregatedList({ project: projectId, auth: authClient });
        const vms = Object.values(vmsResp.data.items || {}).flatMap(z => z.instances || []);
        for (const vm of vms) {
          if (vm.labels) allLabels.push(...Object.keys(vm.labels));
        }
        // SQL labels
        const sqlResp = await google.sqladmin('v1beta4').instances.list({ project: projectId, auth: authClient });
        const sqls = sqlResp.data.items || [];
        for (const sql of sqls) {
          if (sql.settings.userLabels) allLabels.push(...Object.keys(sql.settings.userLabels));
        }
        // Check for inconsistent keys
        for (const key of allLabels) {
          if (key !== key.toLowerCase() || key.includes(' ')) {
            findings.push({
              check: 'Inconsistent Label Key',
              project: projectId,
              labelKey: key,
              result: 'Label key is not lowercase or contains spaces',
              passed: false,
              recommendation: 'Use lowercase, underscore-separated label keys'
            });
            summary.failed++;
            summary.totalChecks++;
          }
        }
      } catch (err) {
        errors.push({ check: 'Label Key Consistency', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }
    }

    // Write results
    await writeAuditResults('label-consistency-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (error) {
    console.error('Error running label consistency audit:', error);
    throw error;
  }
}

module.exports = { run }; 