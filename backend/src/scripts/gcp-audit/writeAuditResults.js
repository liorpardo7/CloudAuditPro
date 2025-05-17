const fs = require('fs').promises;
const path = require('path');
const { getProjectId } = require('./auth');

async function writeAuditResults(scriptName, findings, summary, errors = [], projectId = null) {
  try {
    // Ensure we have a project ID
    if (!projectId) {
      projectId = await getProjectId();
    }

    const result = {
      timestamp: new Date().toISOString(),
      projectId,
      findings,
      summary,
      errors
    };

    // Create results directory if it doesn't exist
    const resultsDir = path.join(__dirname, 'results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Write results file
    const outPath = path.join(resultsDir, `${scriptName}-results.json`);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2));
    console.log(`[writeAuditResults] Wrote results to: ${outPath}`);

    return outPath;
  } catch (error) {
    console.error('Error writing audit results:', error);
    
    // Fallback to using environment variable or default
    const fallbackProjectId = process.env.GCP_PROJECT_ID || 'test-project';
    const result = {
      timestamp: new Date().toISOString(),
      projectId: fallbackProjectId,
      findings,
      summary,
      errors: [...errors, `Error writing results: ${error.message}`]
    };

    // Ensure results directory exists
    const resultsDir = path.join(__dirname, 'results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (mkdirError) {
      if (mkdirError.code !== 'EEXIST') {
        throw mkdirError;
      }
    }

    // Write fallback results
    const outPath = path.join(resultsDir, `${scriptName}-results.json`);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2));
    console.log(`[writeAuditResults] Wrote fallback results to: ${outPath}`);

    return outPath;
  }
}

module.exports = { writeAuditResults }; 