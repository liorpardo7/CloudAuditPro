const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { AuditValidator } = require('./audit-validator');
const { getAuthClient, getProjectId } = require('./auth');

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkApiEnabled(projectId, apiName) {
  try {
    const auth = await getAuthClient();
    const serviceusage = google.serviceusage({ version: 'v1', auth });
    
    const response = await serviceusage.services.get({
      name: `projects/${projectId}/services/${apiName}`
    });
    
    return response.data.state === 'ENABLED';
  } catch (error) {
    console.error(`Error checking API ${apiName}:`, error.message);
    return false;
  }
}

async function runAudit(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Running ${scriptName} ===`);
    console.log(`Started at: ${new Date().toISOString()}`);
    
    const scriptPath = path.join(scriptDir, scriptName);
    const process = exec(`node ${scriptPath}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`\nError in ${scriptName}:`);
        console.error(error.message);
        if (stderr) {
          console.error('Stderr:', stderr);
        }
        auditResults.audits[scriptName] = {
          status: 'error',
          error: error.message,
          stderr: stderr,
          timestamp: new Date().toISOString()
        };
        auditResults.summary.failed++;
        resolve(false);
        return;
      }

      console.log(`\n${scriptName} completed successfully`);
      console.log('Output:', stdout);
      
      // Wait for 1 second to ensure the file is written
      await sleep(1000);
      
      // Standardize to dash-based results file naming
      const dashName = scriptName.replace('.js', '').replace(/_/g, '-');
      const resultsFile = path.join(scriptDir, `${dashName}-results.json`);
      try {
        if (fs.existsSync(resultsFile)) {
          const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
          auditResults.audits[scriptName] = {
            status: 'success',
            results: results,
            timestamp: new Date().toISOString()
          };
          auditResults.summary.passed++;
        } else {
          console.warn(`Results file not found for ${scriptName}: ${resultsFile}`);
          auditResults.audits[scriptName] = {
            status: 'warning',
            error: 'Results file not found',
            timestamp: new Date().toISOString()
          };
          auditResults.summary.notImplemented++;
        }
      } catch (readError) {
        console.error(`Error reading results file for ${scriptName}:`, readError.message);
        auditResults.audits[scriptName] = {
          status: 'error',
          error: 'Could not read results file',
          timestamp: new Date().toISOString()
        };
        auditResults.summary.failed++;
      }
      
      resolve(true);
    });

    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}

async function runAllAudits() {
  console.log('Starting comprehensive GCP audit...');
  const validator = new AuditValidator();
  
  try {
    // Get project ID and verify authentication
    auditResults.projectId = await getProjectId();
    console.log(`Using project ID: ${auditResults.projectId}`);
    
    // Initialize the validator
    await validator.initialize();
    
    // Check required APIs
    const requiredApis = [
      'compute.googleapis.com',
      'cloudresourcemanager.googleapis.com',
      'orgpolicy.googleapis.com',
      'serviceusage.googleapis.com'
    ];
    
    for (const api of requiredApis) {
      const isEnabled = await checkApiEnabled(auditResults.projectId, api);
      if (!isEnabled) {
        console.warn(`API ${api} is not enabled. Please enable it in the Google Cloud Console.`);
        auditResults.summary.errors.push(`API ${api} is not enabled`);
      }
    }
    
    // Run all audit scripts
    for (const script of auditScripts) {
      console.log(`\nRunning ${script}...`);
      try {
        await runAudit(script);
        auditResults.summary.total++;
      } catch (error) {
        console.error(`✗ Error in ${script}:`, error);
        auditResults.audits[script] = {
          error: error.message,
          status: 'failed'
        };
        auditResults.summary.failed++;
      }
    }
    
    // Add validator results
    const validatorResults = await validator.validateAll();
    auditResults.validator = validatorResults;
    
    // Calculate overall pass rate
    auditResults.summary.passRate = 
      `${((auditResults.summary.passed / auditResults.summary.total) * 100).toFixed(2)}%`;
    
    // Save results
    const resultsPath = path.join(__dirname, 'audit-suite-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
    
    console.log('\nAudit completed successfully!');
    console.log('Results saved to:', resultsPath);
    console.log('\nSummary:');
    console.log(`Total Checks: ${auditResults.summary.total}`);
    console.log(`Passed: ${auditResults.summary.passed}`);
    console.log(`Failed: ${auditResults.summary.failed}`);
    console.log(`Pass Rate: ${auditResults.summary.passRate}`);
    
    if (auditResults.summary.errors.length > 0) {
      console.log('\nErrors:');
      auditResults.summary.errors.forEach(error => console.log(`- ${error}`));
    }
    
    return auditResults;
  } catch (error) {
    console.error('Error running audits:', error);
    throw error;
  }
}

// Run the audits
runAllAudits().catch(console.error); 