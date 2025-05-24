const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');

const sqladmin = google.sqladmin('v1beta4');
const monitoring = google.monitoring('v3');

async function run(projectId, tokens) {
  const findings = [];
  const errors = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    notApplicable: 0
  };
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    // List all Cloud SQL instances
    const instancesResponse = await sqladmin.instances.list({
      auth: authClient,
      project: projectId
    });
    const instances = instancesResponse.data.items || [];
    console.log(`Found ${instances.length} Cloud SQL instances`);

    // Audit each instance
    for (const instance of instances) {
      const instanceName = instance.name;
      
      // Check instance configuration
      try {
        // Check backup configuration
        if (!instance.settings.backupConfiguration || !instance.settings.backupConfiguration.enabled) {
          findings.push({
            check: 'Backup Configuration',
            resource: instanceName,
            result: 'Backups not configured',
            passed: false,
            recommendation: 'Enable automated backups for data protection'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Backup Configuration',
            resource: instanceName,
            result: 'Backups configured',
            passed: true,
            details: instance.settings.backupConfiguration
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check maintenance window
        if (!instance.settings.maintenanceWindow) {
          findings.push({
            check: 'Maintenance Window',
            resource: instanceName,
            result: 'No maintenance window configured',
            passed: false,
            recommendation: 'Configure maintenance window for predictable updates'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Maintenance Window',
            resource: instanceName,
            result: 'Maintenance window configured',
            passed: true,
            details: instance.settings.maintenanceWindow
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check high availability
        if (instance.settings.availabilityType !== 'REGIONAL') {
          findings.push({
            check: 'High Availability',
            resource: instanceName,
            result: 'Not configured for high availability',
            passed: false,
            recommendation: 'Consider enabling high availability for critical workloads'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'High Availability',
            resource: instanceName,
            result: 'High availability enabled',
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check SSL configuration
        if (!instance.settings.ipConfiguration.requireSsl) {
          findings.push({
            check: 'SSL Configuration',
            resource: instanceName,
            result: 'SSL not required',
            passed: false,
            recommendation: 'Enable SSL requirement for secure connections'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'SSL Configuration',
            resource: instanceName,
            result: 'SSL required',
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check authorized networks
        const authorizedNetworks = instance.settings.ipConfiguration.authorizedNetworks || [];
        if (authorizedNetworks.length === 0) {
          findings.push({
            check: 'Authorized Networks',
            resource: instanceName,
            result: 'No authorized networks configured',
            passed: false,
            recommendation: 'Configure authorized networks for secure access'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Authorized Networks',
            resource: instanceName,
            result: `${authorizedNetworks.length} authorized networks configured`,
            passed: true,
            details: authorizedNetworks
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Get performance metrics
        const metrics = await getInstanceMetrics(authClient, projectId, instanceName);
        
        // Check CPU utilization
        if (metrics.cpuUtilization > 80) {
          findings.push({
            check: 'CPU Utilization',
            resource: instanceName,
            result: `High CPU utilization: ${metrics.cpuUtilization}%`,
            passed: false,
            recommendation: 'Consider scaling up CPU resources'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'CPU Utilization',
            resource: instanceName,
            result: `CPU utilization: ${metrics.cpuUtilization}%`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check memory utilization
        if (metrics.memoryUtilization > 80) {
          findings.push({
            check: 'Memory Utilization',
            resource: instanceName,
            result: `High memory utilization: ${metrics.memoryUtilization}%`,
            passed: false,
            recommendation: 'Consider scaling up memory resources'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Memory Utilization',
            resource: instanceName,
            result: `Memory utilization: ${metrics.memoryUtilization}%`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check disk utilization
        if (metrics.diskUtilization > 80) {
          findings.push({
            check: 'Disk Utilization',
            resource: instanceName,
            result: `High disk utilization: ${metrics.diskUtilization}%`,
            passed: false,
            recommendation: 'Consider increasing disk size'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Disk Utilization',
            resource: instanceName,
            result: `Disk utilization: ${metrics.diskUtilization}%`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check connection count
        if (metrics.connections > 1000) {
          findings.push({
            check: 'Connection Count',
            resource: instanceName,
            result: `High connection count: ${metrics.connections}`,
            passed: false,
            recommendation: 'Consider connection pooling or scaling up'
          });
          summary.failed++;
        } else {
          findings.push({
            check: 'Connection Count',
            resource: instanceName,
            result: `Connection count: ${metrics.connections}`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

      } catch (err) {
        errors.push({ check: 'Instance Configuration', resource: instanceName, error: err.message });
        summary.failed++;
        summary.totalChecks++;
      }
    }
    await writeAuditResults('cloudsql-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (error) {
    errors.push({ error: error.message });
    await writeAuditResults('cloudsql-audit', findings, summary, errors, projectId);
    throw error;
  }
}

async function getInstanceMetrics(authClient, projectId, instanceName) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [cpuResponse, memoryResponse, diskResponse, connectionsResponse] = await Promise.all([
    monitoring.projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type="cloudsql.googleapis.com/database/cpu/utilization" AND resource.labels.database_id="${instanceName}"`,
      'interval.startTime': oneHourAgo.toISOString(),
      'interval.endTime': now.toISOString()
    }),
    monitoring.projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type="cloudsql.googleapis.com/database/memory/utilization" AND resource.labels.database_id="${instanceName}"`,
      'interval.startTime': oneHourAgo.toISOString(),
      'interval.endTime': now.toISOString()
    }),
    monitoring.projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type="cloudsql.googleapis.com/database/disk/utilization" AND resource.labels.database_id="${instanceName}"`,
      'interval.startTime': oneHourAgo.toISOString(),
      'interval.endTime': now.toISOString()
    }),
    monitoring.projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type="cloudsql.googleapis.com/database/connections" AND resource.labels.database_id="${instanceName}"`,
      'interval.startTime': oneHourAgo.toISOString(),
      'interval.endTime': now.toISOString()
    })
  ]);

  return {
    cpuUtilization: getAverageMetricValue(cpuResponse.data.timeSeries),
    memoryUtilization: getAverageMetricValue(memoryResponse.data.timeSeries),
    diskUtilization: getAverageMetricValue(diskResponse.data.timeSeries),
    connections: getAverageMetricValue(connectionsResponse.data.timeSeries)
  };
}

function getAverageMetricValue(timeSeries) {
  if (!timeSeries || timeSeries.length === 0) return 0;
  
  const values = timeSeries[0].points.map(point => point.value.doubleValue || 0);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

module.exports = { run }; 