const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const auditScripts = [
  'compute-audit.js',
  'storage-audit.js',
  'networking-audit.js',
  'security-audit.js',
  'cost-audit.js'
];

const auditResults = {
  timestamp: new Date().toISOString(),
  projectId: 'dba-inventory-services-prod',
  audits: {}
};

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
  console.log('Starting GCP Audit Suite...');
  console.log('Project: dba-inventory-services-prod');
  console.log('Timestamp:', new Date().toISOString());
  console.log('==========================================');

  for (const script of auditScripts) {
    await runAudit(script);
    console.log('\n==========================================');
  }

  // Save overall results
  const resultsPath = path.join(__dirname, 'audit-suite-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
  
  console.log('\nAudit Suite Summary:');
  console.log('==========================================');
  Object.entries(auditResults.audits).forEach(([script, result]) => {
    const icon = result.status === 'success' ? '✓' : result.status === 'partial' ? '⚠' : '✗';
    console.log(`${icon} ${script}: ${result.status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  console.log('\nDetailed results saved to:', resultsPath);
}

runAllAudits().catch(error => {
  console.error('Fatal error in audit suite:', error);
  process.exit(1);
}); 