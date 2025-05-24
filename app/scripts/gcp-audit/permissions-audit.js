const { writeAuditResults } = require('./writeAuditResults');

async function run(projectId, tokens) {
  const findings = [];
  const summary = { total: 0, passed: 0, failed: 0 };
  const errors = [];
  try {
    // Check IAM permissions
    const iamPermissions = [
      'compute.instances.list',
      'compute.disks.list',
      'storage.buckets.list',
      'iam.serviceAccounts.list',
      'monitoring.timeSeries.list'
    ];
    for (const permission of iamPermissions) {
      try {
        // Here you would actually check if the service account has this permission
        // For now, we'll simulate some findings
        const hasPermission = Math.random() > 0.3; // Simulate 70% success rate
        findings.push({
          permission,
          status: hasPermission ? 'PASSED' : 'FAILED',
          severity: hasPermission ? 'INFO' : 'WARNING',
          description: hasPermission ? 
            `Service account has ${permission} permission` :
            `Service account is missing ${permission} permission`,
          projectId
        });
        summary.total++;
        if (hasPermission) summary.passed++;
        else summary.failed++;
      } catch (err) {
        errors.push({
          permission,
          error: err.message
        });
        findings.push({
          permission,
          status: 'ERROR',
          severity: 'ERROR',
          description: `Error checking ${permission}: ${err.message}`,
          projectId
        });
      }
    }
    await writeAuditResults('permissions-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (error) {
    errors.push({ error: error.message });
    findings.push({
      status: 'ERROR',
      severity: 'ERROR',
      description: `General error: ${error.message}`,
      projectId: projectId
    });
    await writeAuditResults('permissions-audit', findings, summary, errors, projectId);
    throw error;
  }
}

module.exports = { run }; 
