const fs = require('fs');
const path = require('path');
const { checkStalePartitioning, checkDeprecatedUDFs } = require('../../services/bigqueryChecks');

async function runBigQueryAudit() {
  const results = {
    timestamp: new Date().toISOString(),
    projectId: process.env.GCP_PROJECT_ID || 'unknown',
    bigquery: {
      stalePartitioning: [],
      deprecatedUDFs: []
    }
  };

  try {
    console.log('Running BigQuery Stale Partitioning Check...');
    results.bigquery.stalePartitioning = await checkStalePartitioning();
    console.log(`Found ${results.bigquery.stalePartitioning.length} tables with stale partitioning.`);
  } catch (err) {
    console.error('Error in Stale Partitioning Check:', err);
    results.bigquery.stalePartitioningError = err.message;
  }

  try {
    console.log('Running Deprecated SQL UDFs Check...');
    results.bigquery.deprecatedUDFs = await checkDeprecatedUDFs();
    console.log(`Found ${results.bigquery.deprecatedUDFs.length} deprecated UDFs.`);
  } catch (err) {
    console.error('Error in Deprecated UDFs Check:', err);
    results.bigquery.deprecatedUDFsError = err.message;
  }

  const resultsPath = path.join(__dirname, 'bigquery-audit-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('BigQuery audit completed. Results saved to', resultsPath);
}

runBigQueryAudit().catch(err => {
  console.error('BigQuery audit failed:', err);
  process.exit(1);
}); 