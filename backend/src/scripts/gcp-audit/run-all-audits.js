const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { AuditValidator } = require('./audit-validator');

const auditScripts = [
  'compute-audit.js',
  'storage-audit.js',
  'networking-audit.js',
  'security-audit.js',
  'cost-audit.js',
  'data-protection-audit.js',
  'compliance-validator.js',
  'bigquery-audit.js'
];

const auditResults = {
  timestamp: new Date().toISOString(),
  projectId: 'dba-inventory-services-prod',
  audits: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    notImplemented: 0,
    notApplicable: 0
  }
};

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Running ${scriptName} ===`);
    console.log(`Started at: ${new Date().toISOString()}`);
    
    const process = exec(`node ${scriptName}`, async (error, stdout, stderr) => {
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
        resolve(false);
        return;
      }

      console.log(`\n${scriptName} completed successfully`);
      console.log('Output:', stdout);
      
      // Wait for 1 second to ensure the file is written
      await sleep(1000);
      
      // Try to read the results file
      const resultsFile = path.join(__dirname, `${scriptName.replace('.js', '-results.json')}`);
      try {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        auditResults.audits[scriptName] = {
          status: 'success',
          results: results,
          timestamp: new Date().toISOString()
        };
      } catch (readError) {
        console.error(`Error reading results file for ${scriptName}:`, readError.message);
        auditResults.audits[scriptName] = {
          status: 'partial',
          error: 'Could not read results file',
          timestamp: new Date().toISOString()
        };
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
    // Initialize the validator
    await validator.initialize();
    
    // Run all audit scripts
    for (const script of auditScripts) {
      console.log(`\nRunning ${script}...`);
      try {
        const result = await runAudit(script);
        const parsedResult = JSON.parse(result);
        auditResults.audits[script] = parsedResult;
        
        // Update summary
        auditResults.summary.total += parsedResult.summary?.total || 0;
        auditResults.summary.passed += parsedResult.summary?.passed || 0;
        auditResults.summary.failed += parsedResult.summary?.failed || 0;
        auditResults.summary.notImplemented += parsedResult.summary?.notImplemented || 0;
        auditResults.summary.notApplicable += parsedResult.summary?.notApplicable || 0;
        
        console.log(`✓ ${script} completed successfully`);
      } catch (error) {
        console.error(`✗ Error in ${script}:`, error);
        auditResults.audits[script] = {
          error: error.message,
          status: 'failed'
        };
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
    
    return auditResults;
  } catch (error) {
    console.error('Error running audits:', error);
    throw error;
  }
}

// Run the audits
runAllAudits().catch(console.error); 