const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const scriptsDir = path.join(__dirname, '../backend/src/scripts/gcp-audit');
const outputDir = path.join(__dirname, '../public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Run all audit scripts
console.log('Running GCP audit scripts...');
try {
  execSync('node run-all-audits.js', { 
    cwd: scriptsDir,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Error running audit scripts:', error);
  process.exit(1);
}

// Read and combine all audit results
console.log('Combining audit results...');
const auditResults = {
  compute: readAuditResults('compute'),
  storage: readAuditResults('storage'),
  security: readAuditResults('security'),
  networking: readAuditResults('networking'),
  cost: readAuditResults('cost'),
  dataProtection: readAuditResults('data-protection'),
  devops: readAuditResults('devops'),
  monitoring: readAuditResults('monitoring'),
  resourceUtilization: readAuditResults('resource-utilization'),
  storageLifecycle: readAuditResults('storage-lifecycle'),
  budget: readAuditResults('budget')
};

// Write combined results
const outputPath = path.join(outputDir, 'audit-results.json');
fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
console.log('Audit results written to:', outputPath);

function readAuditResults(category) {
  const filePath = path.join(scriptsDir, `${category}-audit-results.json`);
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Audit results file not found: ${filePath}`);
      return {};
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading audit results for ${category}:`, error);
    return {};
  }
} 