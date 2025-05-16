const fs = require('fs');
const path = require('path');

function writeAuditResults(scriptName, findings, summary, errors = [], projectId = process.env.GCP_PROJECT_ID || 'test-project') {
  const result = {
    timestamp: new Date().toISOString(),
    projectId,
    findings,
    summary,
    errors
  };
  const outPath = path.join(__dirname, `${scriptName}-results.json`);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`[writeAuditResults] Wrote results to: ${outPath}`);
}

module.exports = { writeAuditResults }; 