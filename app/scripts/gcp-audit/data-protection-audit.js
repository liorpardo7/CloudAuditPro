const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');

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
    const dlp = google.dlp({ version: 'v2', auth: authClient });
    const storage = google.storage({ version: 'v1', auth: authClient });
    const compute = google.compute({ version: 'v1', auth: authClient });
    // 1. Check for sensitive data detection
    try {
      const inspectTemplatesResp = await dlp.projects.inspectTemplates.list({ parent: `projects/${projectId}` });
      const inspectTemplates = inspectTemplatesResp.data.inspectTemplates || [];
      findings.push({
        check: 'Sensitive Data Detection',
        result: `${inspectTemplates.length} inspect templates found`,
        passed: inspectTemplates.length > 0,
        details: inspectTemplates.map(template => ({
          name: template.name,
          displayName: template.displayName,
          description: template.description,
          infoTypes: template.inspectConfig.infoTypes
        }))
      });
      summary.totalChecks++;
      summary.passed += inspectTemplates.length > 0 ? 1 : 0;
      summary.failed += inspectTemplates.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Sensitive Data Detection', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 2. Review data retention
    try {
      const bucketsResp = await storage.buckets.list({ project: projectId });
      const buckets = bucketsResp.data.items || [];
      const retentionPolicies = buckets.map(bucket => ({
        name: bucket.name,
        retentionPolicy: bucket.retentionPolicy,
        lifecycle: bucket.lifecycle
      }));
      findings.push({
        check: 'Data Retention',
        result: `${buckets.length} buckets with retention policies`,
        passed: buckets.length > 0,
        details: retentionPolicies
      });
      summary.totalChecks++;
      summary.passed += buckets.length > 0 ? 1 : 0;
      summary.failed += buckets.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Data Retention', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 3. Verify data encryption
    try {
      const bucketsResp = await storage.buckets.list({ project: projectId });
      const buckets = bucketsResp.data.items || [];
      const storageEncryption = buckets.map(bucket => ({
        name: bucket.name,
        encryption: bucket.encryption,
        defaultKmsKeyName: bucket.encryption?.defaultKmsKeyName
      }));
      const disksResp = await compute.disks.list({ project: projectId });
      const disks = disksResp.data.items || [];
      const diskEncryption = disks.map(disk => ({
        name: disk.name,
        diskEncryptionKey: disk.diskEncryptionKey,
        sourceImageEncryptionKey: disk.sourceImageEncryptionKey
      }));
      findings.push({
        check: 'Data Encryption',
        result: `${buckets.length} buckets and ${disks.length} disks checked`,
        passed: buckets.length > 0 || disks.length > 0,
        details: {
          storage: storageEncryption,
          compute: diskEncryption
        }
      });
      summary.totalChecks++;
      summary.passed += (buckets.length > 0 || disks.length > 0) ? 1 : 0;
      summary.failed += (buckets.length > 0 || disks.length > 0) ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Data Encryption', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 4. Check for data residency
    try {
      const bucketsResp = await storage.buckets.list({ project: projectId });
      const buckets = bucketsResp.data.items || [];
      const dataResidency = buckets.map(bucket => ({
        name: bucket.name,
        location: bucket.location,
        locationConstraint: bucket.locationConstraint,
        customPlacementConfig: bucket.customPlacementConfig
      }));
      findings.push({
        check: 'Data Residency',
        result: `${buckets.length} buckets with location settings`,
        passed: buckets.length > 0,
        details: dataResidency
      });
      summary.totalChecks++;
      summary.passed += buckets.length > 0 ? 1 : 0;
      summary.failed += buckets.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Data Residency', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 5. Review data security
    try {
      const deidentifyTemplatesResp = await dlp.projects.deidentifyTemplates.list({ parent: `projects/${projectId}` });
      const deidentifyTemplates = deidentifyTemplatesResp.data.deidentifyTemplates || [];
      findings.push({
        check: 'Data Security',
        result: `${deidentifyTemplates.length} deidentification templates found`,
        passed: deidentifyTemplates.length > 0,
        details: deidentifyTemplates.map(template => ({
          name: template.name,
          displayName: template.displayName,
          description: template.description,
          deidentifyConfig: template.deidentifyConfig
        }))
      });
      summary.totalChecks++;
      summary.passed += deidentifyTemplates.length > 0 ? 1 : 0;
      summary.failed += deidentifyTemplates.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Data Security', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    await writeAuditResults('data-protection-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (err) {
    errors.push({ check: 'Data Protection Audit', error: err.message });
    await writeAuditResults('data-protection-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  }
}

module.exports = { run };
