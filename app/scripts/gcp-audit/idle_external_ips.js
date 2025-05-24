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
      const projectId = project.projectId;
      try {
        const compute = google.compute('v1');
        const addressesResp = await compute.addresses.aggregatedList({ project: projectId, auth: authClient });
        const addresses = Object.values(addressesResp.data.items || {}).flatMap(z => z.addresses || []);
        for (const address of addresses) {
          if (address.status === 'RESERVED' && !address.users) {
            findings.push({
              check: 'Unused Static IP',
              project: projectId,
              address: address.address,
              region: address.region ? address.region.split('/').pop() : 'global',
              result: 'Static IP is reserved but not in use',
              passed: false,
              recommendation: 'Release unused static IP to avoid charges',
              costImpact: '$2.92/month (typical GCP charge)'
            });
            summary.failed++;
          } else if (address.status === 'IN_USE') {
            findings.push({
              check: 'Static IP In Use',
              project: projectId,
              address: address.address,
              region: address.region ? address.region.split('/').pop() : 'global',
              result: 'Static IP is in use',
              passed: true
            });
            summary.passed++;
          }
          summary.totalChecks++;
        }
      } catch (err) {
        errors.push({ check: 'Static IPs', project: projectId, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }
    }

    // Write results
    await writeAuditResults('idle-external-ips-audit', findings, summary, errors, 'all-projects');
    return { findings, summary, errors };
  } catch (error) {
    console.error('Error running idle external IPs audit:', error);
    throw error;
  }
}

module.exports = { run }; 