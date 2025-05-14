const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');
const projectId = credentials.project_id;

// Initialize auth client
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/cloud-platform']
);

async function runCostManagementAudit() {
  const findings = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    costSavingsPotential: 0
  };
  const errors = [];

  try {
    // Initialize APIs
    const compute = google.compute({ version: 'v1', auth });
    const cloudbilling = google.cloudbilling({ version: 'v1', auth });
    const monitoring = google.monitoring({ version: 'v3', auth });

    // 1. Check for idle VMs
    try {
      const zonesResp = await compute.zones.list({ project: projectId });
      const zones = zonesResp.data.items || [];
      const idleVMs = [];

      for (const zone of zones) {
        const instancesResp = await compute.instances.list({
          project: projectId,
          zone: zone.name
        });
        const instances = instancesResp.data.items || [];

        for (const instance of instances) {
          // Get CPU utilization for the last 7 days
          const cpuUtilization = await monitoring.projects.timeSeries.list({
            name: `projects/${projectId}`,
            filter: `metric.type = "compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id = "${instance.id}"`,
            interval: {
              startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              endTime: new Date().toISOString()
            }
          });

          const points = cpuUtilization.data.timeSeries?.[0]?.points || [];
          const avgUtilization = points.reduce((sum, point) => sum + point.value.doubleValue, 0) / points.length;

          if (avgUtilization < 0.1) { // Less than 10% CPU utilization
            idleVMs.push({
              name: instance.name,
              zone: zone.name,
              machineType: instance.machineType,
              avgCpuUtilization: avgUtilization,
              status: instance.status
            });
          }
        }
      }

      findings.push({
        check: 'Idle VMs',
        result: `${idleVMs.length} idle VMs found`,
        passed: idleVMs.length === 0,
        details: idleVMs
      });
      summary.totalChecks++;
      summary.passed += idleVMs.length === 0 ? 1 : 0;
      summary.failed += idleVMs.length === 0 ? 0 : 1;
      summary.costSavingsPotential += idleVMs.length * 100; // Rough estimate of $100 per idle VM
    } catch (err) {
      errors.push({ check: 'Idle VMs', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 2. Check for unattached persistent disks
    try {
      const zonesResp = await compute.zones.list({ project: projectId });
      const zones = zonesResp.data.items || [];
      const unattachedDisks = [];

      for (const zone of zones) {
        const disksResp = await compute.disks.list({
          project: projectId,
          zone: zone.name
        });
        const disks = disksResp.data.items || [];

        for (const disk of disks) {
          if (!disk.users || disk.users.length === 0) {
            unattachedDisks.push({
              name: disk.name,
              zone: zone.name,
              sizeGb: disk.sizeGb,
              type: disk.type,
              lastAttachTimestamp: disk.lastAttachTimestamp
            });
          }
        }
      }

      findings.push({
        check: 'Unattached Disks',
        result: `${unattachedDisks.length} unattached disks found`,
        passed: unattachedDisks.length === 0,
        details: unattachedDisks
      });
      summary.totalChecks++;
      summary.passed += unattachedDisks.length === 0 ? 1 : 0;
      summary.failed += unattachedDisks.length === 0 ? 0 : 1;
      summary.costSavingsPotential += unattachedDisks.reduce((sum, disk) => sum + disk.sizeGb * 0.08, 0); // $0.08 per GB per month
    } catch (err) {
      errors.push({ check: 'Unattached Disks', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 3. Check for budget alerts
    try {
      const billingAccountsResp = await cloudbilling.billingAccounts.list();
      const billingAccounts = billingAccountsResp.data.billingAccounts || [];
      const budgetAlerts = [];

      for (const account of billingAccounts) {
        const budgetsResp = await cloudbilling.billingAccounts.budgets.list({
          parent: account.name
        });
        const budgets = budgetsResp.data.budgets || [];

        for (const budget of budgets) {
          if (budget.alertThresholds) {
            budgetAlerts.push({
              billingAccount: account.name,
              budgetName: budget.displayName,
              amount: budget.amount,
              thresholdRules: budget.alertThresholds
            });
          }
        }
      }

      findings.push({
        check: 'Budget Alerts',
        result: `${budgetAlerts.length} budget alerts configured`,
        passed: budgetAlerts.length > 0,
        details: budgetAlerts
      });
      summary.totalChecks++;
      summary.passed += budgetAlerts.length > 0 ? 1 : 0;
      summary.failed += budgetAlerts.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Budget Alerts', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 4. Check for committed use discounts
    try {
      const commitmentsResp = await compute.regionCommitments.list({
        project: projectId
      });
      const commitments = commitmentsResp.data.items || [];
      const activeCommitments = commitments.filter(c => c.status === 'ACTIVE');

      findings.push({
        check: 'Committed Use Discounts',
        result: `${activeCommitments.length} active commitments found`,
        passed: activeCommitments.length > 0,
        details: activeCommitments
      });
      summary.totalChecks++;
      summary.passed += activeCommitments.length > 0 ? 1 : 0;
      summary.failed += activeCommitments.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Committed Use Discounts', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 5. Check for oversized instances
    try {
      const zonesResp = await compute.zones.list({ project: projectId });
      const zones = zonesResp.data.items || [];
      const oversizedInstances = [];

      for (const zone of zones) {
        const instancesResp = await compute.instances.list({
          project: projectId,
          zone: zone.name
        });
        const instances = instancesResp.data.items || [];

        for (const instance of instances) {
          // Get CPU and memory utilization for the last 7 days
          const cpuUtilization = await monitoring.projects.timeSeries.list({
            name: `projects/${projectId}`,
            filter: `metric.type = "compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id = "${instance.id}"`,
            interval: {
              startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              endTime: new Date().toISOString()
            }
          });

          const memoryUtilization = await monitoring.projects.timeSeries.list({
            name: `projects/${projectId}`,
            filter: `metric.type = "compute.googleapis.com/instance/memory/balloon/ram_used" AND resource.labels.instance_id = "${instance.id}"`,
            interval: {
              startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              endTime: new Date().toISOString()
            }
          });

          const cpuPoints = cpuUtilization.data.timeSeries?.[0]?.points || [];
          const memoryPoints = memoryUtilization.data.timeSeries?.[0]?.points || [];
          
          const avgCpuUtilization = cpuPoints.reduce((sum, point) => sum + point.value.doubleValue, 0) / cpuPoints.length;
          const avgMemoryUtilization = memoryPoints.reduce((sum, point) => sum + point.value.doubleValue, 0) / memoryPoints.length;

          if (avgCpuUtilization < 0.3 && avgMemoryUtilization < 0.3) { // Less than 30% utilization
            oversizedInstances.push({
              name: instance.name,
              zone: zone.name,
              machineType: instance.machineType,
              avgCpuUtilization: avgCpuUtilization,
              avgMemoryUtilization: avgMemoryUtilization
            });
          }
        }
      }

      findings.push({
        check: 'Oversized Instances',
        result: `${oversizedInstances.length} oversized instances found`,
        passed: oversizedInstances.length === 0,
        details: oversizedInstances
      });
      summary.totalChecks++;
      summary.passed += oversizedInstances.length === 0 ? 1 : 0;
      summary.failed += oversizedInstances.length === 0 ? 0 : 1;
      summary.costSavingsPotential += oversizedInstances.length * 50; // Rough estimate of $50 per oversized instance
    } catch (err) {
      errors.push({ check: 'Oversized Instances', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

  } catch (err) {
    errors.push({ check: 'Cost Management Audit', error: err.message });
  }

  writeAuditResults('cost-management-audit', findings, summary, errors, projectId);
}

runCostManagementAudit(); 