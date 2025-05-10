const ComputeValidator = require('./compute-validator');
const StorageValidator = require('./storage-validator');
const SecurityValidator = require('./security-validator');
const CostValidator = require('./cost-validator');
const NetworkingValidator = require('./networking-validator');
const DevOpsValidator = require('./devops-validator');
const ComplianceValidator = require('./compliance-validator');
const { ReportGenerator } = require('./report-generator');
const fs = require('fs');
const path = require('path');

async function runValidation(options = {}) {
  const {
    outputDir = path.join(__dirname, 'reports'),
    categories = ['all']
  } = options;

  const results = {
    timestamp: new Date().toISOString(),
    projectId: 'dba-inventory-services-prod',
    checks: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      notImplemented: 0,
      notApplicable: 0
    }
  };

  // Define all validators
  const allValidators = {
    compute: { name: 'Compute', validator: new ComputeValidator() },
    storage: { name: 'Storage', validator: new StorageValidator() },
    security: { name: 'Security', validator: new SecurityValidator() },
    cost: { name: 'Cost', validator: new CostValidator() },
    networking: { name: 'Networking', validator: new NetworkingValidator() },
    devops: { name: 'DevOps', validator: new DevOpsValidator() },
    compliance: { name: 'Compliance', validator: new ComplianceValidator() }
  };

  // Determine which validators to run
  const validatorsToRun = categories.includes('all') 
    ? Object.values(allValidators)
    : categories.map(category => {
        const validator = allValidators[category.toLowerCase()];
        if (!validator) {
          throw new Error(`Invalid category: ${category}`);
        }
        return validator;
      });

  console.log('\nStarting GCP Audit...\n');
  console.log('Categories to validate:', validatorsToRun.map(v => v.name).join(', '), '\n');

  // Run selected validators
  for (const { name, validator } of validatorsToRun) {
    try {
      console.log(`Running ${name} validation...`);
      const validatorResults = await validator.validateAll();
      
      // Merge results
      results.checks = { ...results.checks, ...validatorResults.checks };
      results.summary.total += validatorResults.summary.total;
      results.summary.passed += validatorResults.summary.passed;
      results.summary.failed += validatorResults.summary.failed;
      results.summary.notImplemented += validatorResults.summary.notImplemented;
      results.summary.notApplicable += validatorResults.summary.notApplicable;
      
      console.log(`${name} validation completed.\n`);
    } catch (error) {
      console.error(`Error in ${name} validation:`, error);
      results.summary.failed++;
    }
  }

  // Generate reports
  console.log('\nGenerating audit reports...');
  const reportGenerator = new ReportGenerator(results);
  const reportFiles = reportGenerator.saveReports(outputDir);

  console.log('\nAudit Summary:');
  console.log(`- Total Checks: ${results.summary.total}`);
  console.log(`- Passed: ${results.summary.passed}`);
  console.log(`- Failed: ${results.summary.failed}`);
  console.log(`- Not Implemented: ${results.summary.notImplemented}`);
  console.log(`- Not Applicable: ${results.summary.notApplicable}`);
  
  console.log('\nReports generated:');
  console.log(`- Markdown: ${path.join(outputDir, reportFiles.markdown)}`);
  console.log(`- JSON: ${path.join(outputDir, reportFiles.json)}`);
  console.log(`- HTML: ${path.join(outputDir, reportFiles.html)}`);

  return {
    results,
    reportFiles
  };
}

// Handle command line arguments if run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    outputDir: path.join(__dirname, 'reports'),
    categories: ['all']
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--categories' || args[i] === '-c') {
      options.categories = args[++i].split(',');
    } else if (args[i] === '--output' || args[i] === '-o') {
      options.outputDir = args[++i];
    }
  }

  runValidation(options).catch(error => {
    console.error('Error running validation:', error);
    process.exit(1);
  });
}

module.exports = { runValidation }; 