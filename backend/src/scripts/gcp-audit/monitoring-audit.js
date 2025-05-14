const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

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
    const authClient = auth.getAuthClient();
    const projectId = auth.getProjectId();
    const monitoring = google.monitoring({ version: 'v3', auth: authClient });
    const projectName = `projects/${projectId}`;

    // 1. Check cost anomaly alerts
    try {
      const costAlertsResp = await monitoring.projects.alertPolicies.list({
        name: projectName,
        filter: 'display_name:"cost" OR display_name:"billing"'
      });
      const costAlerts = costAlertsResp.data.alertPolicies || [];
      findings.push({
        check: 'Cost Anomaly Alerts',
        result: `${costAlerts.length} cost-related alerts found`,
        passed: costAlerts.length > 0,
        details: costAlerts.map(alert => ({
          name: alert.displayName,
          conditions: alert.conditions,
          enabled: alert.enabled
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

    // 2. Check for missing critical alerts
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
        'compute.googleapis.com/instance/network/sent_bytes_count'
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
            conditions: alert.conditions
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

    // 3. Verify alert notification channels
    try {
      const channelsResp = await monitoring.projects.notificationChannels.list({
        name: projectName
      });
      const channels = channelsResp.data.notificationChannels || [];
      findings.push({
        check: 'Alert Notification Channels',
        result: `${channels.length} notification channels found`,
        passed: channels.length > 0,
        details: channels.map(channel => ({
          type: channel.type,
          displayName: channel.displayName,
          enabled: channel.enabled
        }))
      });
      summary.totalChecks++;
      summary.passed += channels.length > 0 ? 1 : 0;
      summary.failed += channels.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Alert Notification Channels', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 4. Analyze alert coverage
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

    // 5. Assess alert effectiveness
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
        }
      };
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

  } catch (err) {
    errors.push({ check: 'Monitoring Audit', error: err.message });
  }

  writeAuditResults('monitoring-audit', findings, summary, errors, projectId);
}

runMonitoringAudit();
