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

async function runSecurityCenterAudit() {
  const findings = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    costSavingsPotential: 0
  };
  const errors = [];

  try {
    const securitycenter = google.securitycenter({ version: 'v1', auth });
    const projectName = `projects/${projectId}`;

    // 1. Check security findings
    try {
      const findingsResp = await securitycenter.projects.sources.findings.list({
        parent: `${projectName}/sources/-`,
        filter: 'state != "INACTIVE"'
      });
      const activeFindings = findingsResp.data.findings || [];
      findings.push({
        check: 'Security Findings',
        result: `${activeFindings.length} active findings`,
        passed: activeFindings.length === 0,
        details: activeFindings.map(f => ({
          name: f.name,
          severity: f.severity,
          category: f.category,
          state: f.state
        }))
      });
      summary.totalChecks++;
      summary.passed += activeFindings.length === 0 ? 1 : 0;
      summary.failed += activeFindings.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Security Findings', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 2. Review vulnerability reports
    try {
      const sourcesResp = await securitycenter.projects.sources.list({
        parent: projectName
      });
      const sources = sourcesResp.data.sources || [];
      const vulnerabilitySources = sources.filter(s => s.displayName.includes('Vulnerability'));
      findings.push({
        check: 'Vulnerability Reports',
        result: `${vulnerabilitySources.length} vulnerability sources found`,
        passed: vulnerabilitySources.length > 0,
        details: vulnerabilitySources.map(s => ({
          name: s.displayName,
          description: s.description
        }))
      });
      summary.totalChecks++;
      summary.passed += vulnerabilitySources.length > 0 ? 1 : 0;
      summary.failed += vulnerabilitySources.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Vulnerability Reports', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 3. Verify security health analytics
    try {
      const assetsResp = await securitycenter.projects.assets.list({
        parent: projectName
      });
      const assets = assetsResp.data.assets || [];
      findings.push({
        check: 'Security Health Analytics',
        result: `${assets.length} assets monitored`,
        passed: assets.length > 0,
        details: assets.map(a => ({
          name: a.name,
          securityCenterProperties: a.securityCenterProperties
        }))
      });
      summary.totalChecks++;
      summary.passed += assets.length > 0 ? 1 : 0;
      summary.failed += assets.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Security Health Analytics', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 4. Check for threat detection
    try {
      const threatFindingsResp = await securitycenter.projects.sources.findings.list({
        parent: `${projectName}/sources/-`,
        filter: 'category="THREAT" AND state != "INACTIVE"'
      });
      const threatFindings = threatFindingsResp.data.findings || [];
      findings.push({
        check: 'Threat Detection',
        result: `${threatFindings.length} active threat findings`,
        passed: threatFindings.length === 0,
        details: threatFindings.map(f => ({
          name: f.name,
          severity: f.severity,
          category: f.category,
          state: f.state
        }))
      });
      summary.totalChecks++;
      summary.passed += threatFindings.length === 0 ? 1 : 0;
      summary.failed += threatFindings.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Threat Detection', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 5. Review security recommendations
    try {
      const recommendationsResp = await securitycenter.projects.sources.findings.list({
        parent: `${projectName}/sources/-`,
        filter: 'category="SECURITY_RECOMMENDATION" AND state != "INACTIVE"'
      });
      const recommendations = recommendationsResp.data.findings || [];
      findings.push({
        check: 'Security Recommendations',
        result: `${recommendations.length} active recommendations`,
        passed: recommendations.length > 0,
        details: recommendations.map(r => ({
          name: r.name,
          severity: r.severity,
          category: r.category,
          state: r.state
        }))
      });
      summary.totalChecks++;
      summary.passed += recommendations.length > 0 ? 1 : 0;
      summary.failed += recommendations.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Security Recommendations', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 6. Verify security monitoring
    try {
      const monitoringResp = await securitycenter.projects.sources.findings.list({
        parent: `${projectName}/sources/-`,
        filter: 'category="SECURITY_MONITORING" AND state != "INACTIVE"'
      });
      const monitoringFindings = monitoringResp.data.findings || [];
      findings.push({
        check: 'Security Monitoring',
        result: `${monitoringFindings.length} active monitoring findings`,
        passed: monitoringFindings.length > 0,
        details: monitoringFindings.map(f => ({
          name: f.name,
          severity: f.severity,
          category: f.category,
          state: f.state
        }))
      });
      summary.totalChecks++;
      summary.passed += monitoringFindings.length > 0 ? 1 : 0;
      summary.failed += monitoringFindings.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Security Monitoring', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 7. Check for security automation
    try {
      const automationResp = await securitycenter.projects.sources.findings.list({
        parent: `${projectName}/sources/-`,
        filter: 'category="SECURITY_AUTOMATION" AND state != "INACTIVE"'
      });
      const automationFindings = automationResp.data.findings || [];
      findings.push({
        check: 'Security Automation',
        result: `${automationFindings.length} active automation findings`,
        passed: automationFindings.length > 0,
        details: automationFindings.map(f => ({
          name: f.name,
          severity: f.severity,
          category: f.category,
          state: f.state
        }))
      });
      summary.totalChecks++;
      summary.passed += automationFindings.length > 0 ? 1 : 0;
      summary.failed += automationFindings.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Security Automation', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 8. Review security cost optimization
    try {
      const costResp = await securitycenter.projects.sources.findings.list({
        parent: `${projectName}/sources/-`,
        filter: 'category="COST_OPTIMIZATION" AND state != "INACTIVE"'
      });
      const costFindings = costResp.data.findings || [];
      findings.push({
        check: 'Security Cost Optimization',
        result: `${costFindings.length} active cost optimization findings`,
        passed: costFindings.length > 0,
        details: costFindings.map(f => ({
          name: f.name,
          severity: f.severity,
          category: f.category,
          state: f.state
        }))
      });
      summary.totalChecks++;
      summary.passed += costFindings.length > 0 ? 1 : 0;
      summary.failed += costFindings.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Security Cost Optimization', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

  } catch (err) {
    errors.push({ check: 'Security Center Audit', error: err.message });
  }

  writeAuditResults('securitycenter-audit', findings, summary, errors, projectId);
}

runSecurityCenterAudit();
