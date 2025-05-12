const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');
const fs = require('fs');
const path = require('path');

class MonitoringAudit extends BaseValidator {
  async auditAll() {
    await this.initialize();
    console.log('Starting monitoring and alerts audit...\n');

    const results = {
      timestamp: new Date().toISOString(),
      projectId: this.projectId,
      monitoring: {
        alertPolicies: [],
        notificationChannels: [],
        costAnomalyAlerts: [],
        missingAlerts: [],
        recommendations: []
      },
      dashboards: [],
      logConfigs: []
    };

    // Get all projects
    const projects = await this.getAllProjects();
    
    // Audit each project
    for (const project of projects) {
      await this.auditProject(project, results);
    }

    // Generate recommendations
    this.generateRecommendations(results);

    return results;
  }

  async getAllProjects() {
    try {
      const response = await this.resourceManager.projects.list();
      return response.data.projects || [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  async auditProject(project, results) {
    try {
      const monitoring = google.monitoring('v3');
      
      // Get alert policies
      const alertPoliciesResponse = await monitoring.projects.alertPolicies.list({
        name: `projects/${project.projectId}`,
        filter: 'enabled:true'
      });

      if (alertPoliciesResponse.data.alertPolicies) {
        for (const policy of alertPoliciesResponse.data.alertPolicies) {
          const policyInfo = {
            project: project.projectId,
            name: policy.displayName,
            type: this.getAlertType(policy),
            conditions: policy.conditions || [],
            notificationChannels: policy.notificationChannels || [],
            enabled: policy.enabled,
            creationTime: policy.creationRecord?.createTime,
            lastModified: policy.mutationRecord?.mutateTime
          };

          // Check if it's a cost anomaly alert
          if (this.isCostAnomalyAlert(policy)) {
            results.monitoring.costAnomalyAlerts.push(policyInfo);
          }

          results.monitoring.alertPolicies.push(policyInfo);
        }
      }

      // Get notification channels
      const channelsResponse = await monitoring.projects.notificationChannels.list({
        name: `projects/${project.projectId}`
      });

      if (channelsResponse.data.notificationChannels) {
        for (const channel of channelsResponse.data.notificationChannels) {
          const channelInfo = {
            project: project.projectId,
            name: channel.displayName,
            type: channel.type,
            enabled: channel.enabled,
            verificationStatus: channel.verificationStatus,
            labels: channel.labels || {}
          };

          results.monitoring.notificationChannels.push(channelInfo);
        }
      }

      // Check for missing critical alerts
      const missingAlerts = this.checkMissingAlerts(
        results.monitoring.alertPolicies,
        project.projectId
      );

      if (missingAlerts.length > 0) {
        results.monitoring.missingAlerts.push(...missingAlerts);
      }

    } catch (error) {
      console.error(`Error auditing project ${project.projectId}:`, error);
      results.monitoring.recommendations.push({
        category: 'Monitoring',
        issue: 'Failed to audit project',
        recommendation: 'Check API permissions and try again',
        project: project.projectId,
        error: error.message
      });
    }
  }

  getAlertType(policy) {
    if (!policy.conditions || policy.conditions.length === 0) {
      return 'UNKNOWN';
    }

    const condition = policy.conditions[0];
    if (condition.conditionThreshold) {
      return 'THRESHOLD';
    } else if (condition.conditionAbsent) {
      return 'ABSENT';
    } else if (condition.conditionMatchedLog) {
      return 'LOGGING';
    } else if (condition.conditionMonitoringQueryLanguage) {
      return 'MQL';
    }

    return 'UNKNOWN';
  }

  isCostAnomalyAlert(policy) {
    if (!policy.conditions || policy.conditions.length === 0) {
      return false;
    }

    const condition = policy.conditions[0];
    if (condition.conditionThreshold) {
      const filter = condition.conditionThreshold.filter;
      return filter && (
        filter.includes('metric.type="billing.googleapis.com/billing/budget"') ||
        filter.includes('metric.type="billing.googleapis.com/billing/cost"')
      );
    }

    return false;
  }

  checkMissingAlerts(alertPolicies, projectId) {
    const missingAlerts = [];
    const requiredAlerts = [
      {
        name: 'High CPU Usage',
        type: 'THRESHOLD',
        metric: 'compute.googleapis.com/instance/cpu/utilization'
      },
      {
        name: 'High Memory Usage',
        type: 'THRESHOLD',
        metric: 'compute.googleapis.com/instance/memory/balloon/ram_used'
      },
      {
        name: 'High Disk Usage',
        type: 'THRESHOLD',
        metric: 'compute.googleapis.com/instance/disk/read_bytes_count'
      },
      {
        name: 'Cost Anomaly',
        type: 'THRESHOLD',
        metric: 'billing.googleapis.com/billing/cost'
      }
    ];

    for (const required of requiredAlerts) {
      const hasAlert = alertPolicies.some(policy => {
        if (policy.type !== required.type) return false;
        
        const condition = policy.conditions[0];
        if (!condition || !condition.conditionThreshold) return false;

        return condition.conditionThreshold.filter.includes(required.metric);
      });

      if (!hasAlert) {
        missingAlerts.push({
          project: projectId,
          name: required.name,
          type: required.type,
          metric: required.metric
        });
      }
    }

    return missingAlerts;
  }

  generateRecommendations(results) {
    // Add recommendations based on missing alerts
    if (results.monitoring.missingAlerts.length > 0) {
      results.monitoring.recommendations.push({
        category: 'Monitoring',
        issue: 'Missing critical alerts',
        recommendation: 'Configure the following alert policies',
        missingAlerts: results.monitoring.missingAlerts
      });
    }

    // Add recommendations based on notification channels
    const channelsWithoutVerification = results.monitoring.notificationChannels.filter(
      channel => channel.verificationStatus !== 'VERIFIED'
    );

    if (channelsWithoutVerification.length > 0) {
      results.monitoring.recommendations.push({
        category: 'Monitoring',
        issue: 'Unverified notification channels',
        recommendation: 'Verify the following notification channels',
        channels: channelsWithoutVerification.map(channel => ({
          project: channel.project,
          name: channel.name,
          type: channel.type
        }))
      });
    }

    // Add recommendations based on cost anomaly alerts
    if (results.monitoring.costAnomalyAlerts.length === 0) {
      results.monitoring.recommendations.push({
        category: 'Monitoring',
        issue: 'No cost anomaly alerts configured',
        recommendation: 'Configure cost anomaly alerts to detect unexpected spending'
      });
    }

    // Add recommendations based on alert policy coverage
    const projectsWithAlerts = new Set(results.monitoring.alertPolicies.map(p => p.project));
    const projectsWithoutAlerts = results.monitoring.alertPolicies
      .filter(p => !projectsWithAlerts.has(p.project))
      .map(p => p.project);

    if (projectsWithoutAlerts.length > 0) {
      results.monitoring.recommendations.push({
        category: 'Monitoring',
        issue: 'Projects without alert policies',
        recommendation: 'Configure basic alert policies for these projects',
        projects: projectsWithoutAlerts
      });
    }
  }
}

async function runMonitoringAudit() {
  const audit = new MonitoringAudit();
  const results = await audit.auditAll();
  fs.writeFileSync(path.join(__dirname, 'monitoring-audit-results.json'), JSON.stringify(results, null, 2));
  console.log('Monitoring audit completed. Results saved to monitoring-audit-results.json');
}

runMonitoringAudit();

module.exports = MonitoringAudit; 