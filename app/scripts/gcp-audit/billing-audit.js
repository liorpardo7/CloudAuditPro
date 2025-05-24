const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  const findings = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    costSavingsPotential: 0
  };
  const errors = [];
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    // Initialize clients
    const billingClient = google.cloudbilling({ version: 'v1', auth: authClient });
    const computeClient = google.compute({ version: 'v1', auth: authClient });
    const monitoring = google.monitoring({ version: 'v3', auth: authClient });

    // 1. List all billing accounts
    try {
      const billingAccountsResp = await billingClient.billingAccounts.list();
      const billingAccounts = billingAccountsResp.data.billingAccounts || [];
      findings.push({
        check: 'Billing Accounts',
        result: `${billingAccounts.length} billing accounts found`,
        passed: billingAccounts.length > 0,
        details: billingAccounts.map(acc => ({
          name: acc.name,
          displayName: acc.displayName,
          open: acc.open
        }))
      });
      summary.totalChecks++;
      summary.passed += billingAccounts.length > 0 ? 1 : 0;
      summary.failed += billingAccounts.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Billing Accounts', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 2. Check billing export
    try {
      const projectBillingInfo = await billingClient.projects.getBillingInfo({
        name: `projects/${projectId}`
      });
      const hasBillingExport = projectBillingInfo.data.billingEnabled;
      findings.push({
        check: 'Billing Export',
        result: hasBillingExport ? 'Enabled' : 'Disabled',
        passed: hasBillingExport,
        details: projectBillingInfo.data
      });
      summary.totalChecks++;
      summary.passed += hasBillingExport ? 1 : 0;
      summary.failed += hasBillingExport ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Billing Export', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 3. Check for committed use discounts
    try {
      const commitmentsResp = await computeClient.regionCommitments.list({
        project: projectId,
        region: '-'
      });
      const commitments = commitmentsResp.data.items || [];
      findings.push({
        check: 'Committed Use Discounts',
        result: `${commitments.length} commitments found`,
        passed: commitments.length > 0,
        details: commitments.map(c => ({
          name: c.name,
          status: c.status,
          plan: c.plan,
          resources: c.resources
        }))
      });
      summary.totalChecks++;
      summary.passed += commitments.length > 0 ? 1 : 0;
      summary.failed += commitments.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Committed Use Discounts', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 4. Detect idle resources
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const endTime = now;
      const idleResourcesResp = await monitoring.projects.timeSeries.list({
        name: `projects/${projectId}`,
        filter: 'metric.type = "compute.googleapis.com/instance/cpu/utilization"',
        'interval.startTime': startTime,
        'interval.endTime': endTime
      });
      const idleResources = idleResourcesResp.data.timeSeries || [];
      findings.push({
        check: 'Idle Resources',
        result: `${idleResources.length} resources with low utilization`,
        passed: idleResources.length === 0,
        details: idleResources.map(r => ({
          resource: r.resource,
          metric: r.metric,
          points: r.points
        }))
      });
      summary.totalChecks++;
      summary.passed += idleResources.length === 0 ? 1 : 0;
      summary.failed += idleResources.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Idle Resources', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 5. Review cost allocation tags
    try {
      const projectBillingInfo = await billingClient.projects.getBillingInfo({
        name: `projects/${projectId}`
      });
      const hasCostAllocation = projectBillingInfo.data.costAllocationTags;
      findings.push({
        check: 'Cost Allocation Tags',
        result: hasCostAllocation ? 'Enabled' : 'Disabled',
        passed: hasCostAllocation,
        details: projectBillingInfo.data
      });
      summary.totalChecks++;
      summary.passed += hasCostAllocation ? 1 : 0;
      summary.failed += hasCostAllocation ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Cost Allocation Tags', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 6. Identify high spend services
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endTime = now;
      const costResp = await monitoring.projects.timeSeries.list({
        name: `projects/${projectId}`,
        filter: 'metric.type = "billing.googleapis.com/consumption/cost"',
        'interval.startTime': startTime,
        'interval.endTime': endTime
      });
      const costData = costResp.data.timeSeries || [];
      findings.push({
        check: 'High Spend Services',
        result: `${costData.length} services with cost data`,
        passed: costData.length > 0,
        details: costData.map(c => ({
          service: c.metric.labels.service,
          cost: c.points[0].value.doubleValue
        }))
      });
      summary.totalChecks++;
      summary.passed += costData.length > 0 ? 1 : 0;
      summary.failed += costData.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'High Spend Services', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    await writeAuditResults('billing-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (error) {
    console.error('Error in billing audit:', error);
    errors.push({
      check: 'Billing Audit',
      error: error.message
    });
    await writeAuditResults('billing-audit', findings, summary, errors, projectId);
    throw error;
  }
}

module.exports = { run };
