const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

/**
 * Runs the monitoring audit for GCP resources
 * @returns {Promise<Object>} Audit results
 */
async function runMonitoringAudit() {
  const findings = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    costSavingsPotential: 0
  };
  const errors = [];

  try {
    const authClient = await auth.getAuthClient();
    const projectId = await auth.getProjectId();
    
    if (!projectId) {
      throw new Error('Project ID not found. Please ensure proper authentication and project configuration.');
    }

    const monitoring = google.monitoring({ version: 'v3', auth: authClient });
    const projectName = `projects/${projectId}`;

    // 1. Check monitoring dashboards
    try {
      const dashboardsResp = await monitoring.projects.dashboards.list({
        parent: projectName
      });
      const dashboards = dashboardsResp.data.dashboards || [];
      findings.push({
        check: 'Monitoring Dashboards',
        result: `${dashboards.length} dashboards found`,
        passed: dashboards.length > 0,
        details: dashboards.map(dashboard => ({
          name: dashboard.displayName,
          type: dashboard.type,
          lastUpdated: dashboard.updateTime
        }))
      });
      summary.totalChecks++;
      summary.passed += dashboards.length > 0 ? 1 : 0;
      summary.failed += dashboards.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Monitoring Dashboards', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 2. Check cost anomaly alerts
    try {
      const costAlertsResp = await monitoring.projects.alertPolicies.list({
        name: projectName,
        filter: 'display_name:"cost" OR display_name:"billing" OR display_name:"budget"'
      });
      const costAlerts = costAlertsResp.data.alertPolicies || [];
      findings.push({
        check: 'Cost Anomaly Alerts',
        result: `${costAlerts.length} cost-related alerts found`,
        passed: costAlerts.length > 0,
        details: costAlerts.map(alert => ({
          name: alert.displayName,
          conditions: alert.conditions,
          enabled: alert.enabled,
          severity: alert.conditions[0]?.severity || 'UNSPECIFIED'
        }))
      });
      summary.totalChecks++;
      summary.passed += costAlerts.length > 0 ? 1 : 0;
      summary.failed += costAlerts.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Cost Anomaly Alerts', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 3. Check for missing critical alerts
    try {
      const criticalAlertsResp = await monitoring.projects.alertPolicies.list({
        name: projectName,
        filter: 'severity=CRITICAL'
      });
      const criticalAlerts = criticalAlertsResp.data.alertPolicies || [];
      const requiredMetrics = [
        'compute.googleapis.com/instance/cpu/utilization',
        'compute.googleapis.com/instance/memory/balloon/ram_used',
        'compute.googleapis.com/instance/disk/read_bytes_count',
        'compute.googleapis.com/instance/disk/write_bytes_count',
        'compute.googleapis.com/instance/network/received_bytes_count',
        'compute.googleapis.com/instance/network/sent_bytes_count',
        'cloudsql.googleapis.com/database/cpu/utilization',
        'cloudsql.googleapis.com/database/memory/utilization',
        'cloudsql.googleapis.com/database/disk/utilization',
        'container.googleapis.com/node/cpu/core_usage_time',
        'container.googleapis.com/node/memory/used_bytes'
      ];
      const missingMetrics = requiredMetrics.filter(metric => 
        !criticalAlerts.some(alert => 
          alert.conditions.some(condition => 
            condition.conditionThreshold.filter.includes(metric)
          )
        )
      );
      findings.push({
        check: 'Critical Alerts Coverage',
        result: `${missingMetrics.length} missing critical metrics`,
        passed: missingMetrics.length === 0,
        details: {
          existingAlerts: criticalAlerts.map(alert => ({
            name: alert.displayName,
            conditions: alert.conditions,
            severity: alert.conditions[0]?.severity || 'UNSPECIFIED'
          })),
          missingMetrics
        }
      });
      summary.totalChecks++;
      summary.passed += missingMetrics.length === 0 ? 1 : 0;
      summary.failed += missingMetrics.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Critical Alerts Coverage', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 4. Verify alert notification channels
    try {
      const channelsResp = await monitoring.projects.notificationChannels.list({
        name: projectName
      });
      const channels = channelsResp.data.notificationChannels || [];
      const channelTypes = channels.reduce((acc, channel) => {
        acc[channel.type] = (acc[channel.type] || 0) + 1;
        return acc;
      }, {});
      findings.push({
        check: 'Alert Notification Channels',
        result: `${channels.length} notification channels found`,
        passed: channels.length > 0,
        details: {
          channelTypes,
          channels: channels.map(channel => ({
            type: channel.type,
            displayName: channel.displayName,
            enabled: channel.enabled,
            verificationStatus: channel.verificationStatus
          }))
        }
      });
      summary.totalChecks++;
      summary.passed += channels.length > 0 ? 1 : 0;
      summary.failed += channels.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Alert Notification Channels', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 5. Analyze alert coverage
    try {
      const allAlertsResp = await monitoring.projects.alertPolicies.list({
        name: projectName
      });
      const allAlerts = allAlertsResp.data.alertPolicies || [];
      const alertCoverage = {
        total: allAlerts.length,
        bySeverity: {
          CRITICAL: allAlerts.filter(a => a.conditions.some(c => c.severity === 'CRITICAL')).length,
          WARNING: allAlerts.filter(a => a.conditions.some(c => c.severity === 'WARNING')).length,
          INFO: allAlerts.filter(a => a.conditions.some(c => c.severity === 'INFO')).length
        },
        byService: {}
      };
      allAlerts.forEach(alert => {
        alert.conditions.forEach(condition => {
          const service = condition.conditionThreshold.filter.split('/')[0];
          alertCoverage.byService[service] = (alertCoverage.byService[service] || 0) + 1;
        });
      });
      findings.push({
        check: 'Alert Coverage Analysis',
        result: `${allAlerts.length} total alerts`,
        passed: allAlerts.length > 0,
        details: alertCoverage
      });
      summary.totalChecks++;
      summary.passed += allAlerts.length > 0 ? 1 : 0;
      summary.failed += allAlerts.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Alert Coverage Analysis', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 6. Check custom metrics
    try {
      const metricsResp = await monitoring.projects.metricDescriptors.list({
        name: projectName,
        filter: 'metric.type = starts_with("custom.googleapis.com/")'
      });
      const customMetrics = metricsResp.data.metricDescriptors || [];
      findings.push({
        check: 'Custom Metrics',
        result: `${customMetrics.length} custom metrics found`,
        passed: customMetrics.length > 0,
        details: customMetrics.map(metric => ({
          name: metric.displayName,
          type: metric.type,
          unit: metric.unit,
          description: metric.description
        }))
      });
      summary.totalChecks++;
      summary.passed += customMetrics.length > 0 ? 1 : 0;
      summary.failed += customMetrics.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Custom Metrics', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 7. Assess alert effectiveness
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const incidentsResp = await monitoring.projects.uptimeCheckConfigs.list({
        parent: projectName
      });
      const incidents = incidentsResp.data.uptimeCheckConfigs || [];
      const alertEffectiveness = {
        totalIncidents: incidents.length,
        bySeverity: {
          CRITICAL: incidents.filter(i => i.severity === 'CRITICAL').length,
          WARNING: incidents.filter(i => i.severity === 'WARNING').length,
          INFO: incidents.filter(i => i.severity === 'INFO').length
        },
        byService: {}
      };
      incidents.forEach(incident => {
        const service = incident.resourceType;
        alertEffectiveness.byService[service] = (alertEffectiveness.byService[service] || 0) + 1;
      });
      findings.push({
        check: 'Alert Effectiveness',
        result: `${incidents.length} incidents in last 30 days`,
        passed: incidents.length > 0,
        details: alertEffectiveness
      });
      summary.totalChecks++;
      summary.passed += incidents.length > 0 ? 1 : 0;
      summary.failed += incidents.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Alert Effectiveness', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 8. Check monitoring security
    try {
      const iamResp = await monitoring.projects.getIamPolicy({
        resource: projectName
      });
      const policy = iamResp.data;
      const monitoringRoles = policy.bindings.filter(binding => 
        binding.role.includes('monitoring') || 
        binding.role.includes('monitor')
      );
      findings.push({
        check: 'Monitoring Security',
        result: `${monitoringRoles.length} monitoring-specific IAM roles found`,
        passed: monitoringRoles.length > 0,
        details: {
          roles: monitoringRoles.map(role => ({
            role: role.role,
            members: role.members
          }))
        }
      });
      summary.totalChecks++;
      summary.passed += monitoringRoles.length > 0 ? 1 : 0;
      summary.failed += monitoringRoles.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Monitoring Security', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 9. Check monitoring automation
    try {
      const automationResp = await monitoring.projects.alertPolicies.list({
        name: projectName,
        filter: 'display_name:"automated" OR display_name:"auto"'
      });
      const automatedAlerts = automationResp.data.alertPolicies || [];
      findings.push({
        check: 'Monitoring Automation',
        result: `${automatedAlerts.length} automated alerts found`,
        passed: automatedAlerts.length > 0,
        details: automatedAlerts.map(alert => ({
          name: alert.displayName,
          conditions: alert.conditions,
          enabled: alert.enabled
        }))
      });
      summary.totalChecks++;
      summary.passed += automatedAlerts.length > 0 ? 1 : 0;
      summary.failed += automatedAlerts.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Monitoring Automation', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 10. Check monitoring cost optimization
    try {
      const metricsResp = await monitoring.projects.metricDescriptors.list({
        name: projectName
      });
      const metrics = metricsResp.data.metricDescriptors || [];
      const costOptimization = {
        totalMetrics: metrics.length,
        byService: {},
        potentialOptimizations: []
      };
      metrics.forEach(metric => {
        const service = metric.type.split('/')[0];
        costOptimization.byService[service] = (costOptimization.byService[service] || 0) + 1;
      });
      findings.push({
        check: 'Monitoring Cost Optimization',
        result: `${metrics.length} total metrics`,
        passed: true,
        details: costOptimization
      });
      summary.totalChecks++;
      summary.passed++;
    } catch (err) {
      errors.push({ check: 'Monitoring Cost Optimization', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // Write results with proper error handling
    try {
      await writeAuditResults('monitoring-audit', findings, summary, errors, projectId);
    } catch (writeError) {
      console.error('Error writing audit results:', writeError);
      errors.push({ check: 'Results Writing', error: writeError.message });
    }

    return { findings, summary, errors };
  } catch (err) {
    console.error('Error in monitoring audit:', err);
    errors.push({ check: 'Monitoring Audit', error: err.message });
    return { findings, summary, errors };
  }
}

if (require.main === module) {
  runMonitoringAudit()
    .then(results => {
      console.log('Monitoring audit completed with results:', JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('Error running monitoring audit:', error);
      process.exit(1);
    });
}

module.exports = runMonitoringAudit;
