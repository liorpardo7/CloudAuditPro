// DEPRECATED: Use run-full-gcp-checklist-audit.js for all production and full audits.
const fs = require('fs');
const path = require('path');
const { AuditValidator } = require('./audit-validator');

const auditScripts = [
  // Compute & VM
  'compute-audit.js',
  'persistent-disk-audit.js',
  'serverless-audit.js',
  'gke-audit.js',

  // Storage
  'storage-audit.js',
  'storage_folder_lifecycle.js',
  'storage-lifecycle-audit.js',
  // 'storage-advanced-audit.js', // Uncomment if active

  // BigQuery
  'bigquery_deep_dive.js',
  'bigquery-audit.js',

  // Database
  'cloudsql_audit.js',
  'data-protection-audit.js',

  // Networking
  'networking-audit.js',
  'idle_external_ips.js',

  // IAM, Security, Org Policy
  'iam-audit.js',
  'security-audit.js',
  'securitycenter-audit.js',
  'org-policy-audit.js',
  'permissions-audit.js',

  // Monitoring & Cost
  'monitoring-audit.js',
  'cost-audit.js',
  'cost-allocation-audit.js',
  'cost-management-audit.js',
  'billing-audit.js',
  'discount-audit.js',
  'budget-audit.js',

  // Resource Utilization & Optimization
  'resource-utilization-audit.js',
  'resource-optimization-audit.js',

  // DevOps & Compliance
  'devops-audit.js',
  'compliance-audit.js',
  // Validators/helpers are not run directly

  // Pub/Sub & Scheduler
  'pubsub_audit.js',
  'scheduler_audit.js',

  // Composer/Airflow
  'composer_dag_audit.js',

  // Cross-Project & Label Consistency
  'cross_project_audit.js',
  'label_consistency.js',

  // Recommendations & Advanced
  'recommendations_engine.js',
  'advanced_audits.js',
];

const auditResults = {
  timestamp: new Date().toISOString(),
  projectId: null,
  audits: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    notImplemented: 0,
    notApplicable: 0,
    errors: []
  }
};

const scriptDir = path.join(__dirname);

async function runAllAudits(projectId, tokens) {
  console.log('Starting comprehensive GCP audit...');
  const validator = new AuditValidator();
  auditResults.projectId = projectId;
  await validator.initialize();
  for (const script of auditScripts) {
    console.log(`\nRunning ${script}...`);
    try {
      const scriptPath = path.join(scriptDir, script);
      const auditModule = require(scriptPath);
      if (typeof auditModule.run === 'function') {
        const result = await auditModule.run(projectId, tokens);
        auditResults.audits[script] = {
          status: 'success',
          results: result,
          timestamp: new Date().toISOString()
        };
        auditResults.summary.passed++;
      } else {
        auditResults.audits[script] = {
          status: 'not-implemented',
          error: 'No run(projectId, tokens) export',
          timestamp: new Date().toISOString()
        };
        auditResults.summary.notImplemented++;
      }
      auditResults.summary.total++;
    } catch (error) {
      console.error(`✗ Error in ${script}:`, error);
      auditResults.audits[script] = {
        error: error.message,
        status: 'failed',
        timestamp: new Date().toISOString()
      };
      auditResults.summary.failed++;
    }
  }
  // Add validator results
  const validatorResults = await validator.validateAll();
  auditResults.validator = validatorResults;
  // Write final results
  const outputFile = path.join(scriptDir, `all-audits-results.json`);
  fs.writeFileSync(outputFile, JSON.stringify(auditResults, null, 2));
  console.log(`All audits complete. Results written to ${outputFile}`);
}

// Example usage: load tokens and projectId from a config file or env
if (require.main === module) {
  // Replace with your actual token/projectId loading logic
  const configPath = path.join(__dirname, 'oauth-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('Missing oauth-config.json with { "projectId": "...", "tokens": { ... } }');
    process.exit(1);
  }
  const { projectId, tokens } = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  runAllAudits(projectId, tokens).catch(err => {
    console.error('Fatal error running all audits:', err);
    process.exit(1);
  });
} 