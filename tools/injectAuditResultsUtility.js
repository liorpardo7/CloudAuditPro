const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '../backend/src/scripts/gcp-audit');
const UTILITY_REQUIRE = "const { writeAuditResults } = require('./writeAuditResults');";
const PLACEHOLDER_BLOCK = `\nconst findings = [];\nconst summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };\nconst errors = [];\nwriteAuditResults(SCRIPT_NAME, findings, summary, errors);\n`;

fs.readdirSync(SCRIPTS_DIR)
  .filter(f => f.endsWith('-audit.js'))
  .forEach(file => {
    const filePath = path.join(SCRIPTS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('writeAuditResults')) {
      console.log(`${file} already uses writeAuditResults. Skipping.`);
      return;
    }
    // Insert require at the top (after any 'use strict' or shebang)
    let lines = content.split('\n');
    let insertIdx = 0;
    if (lines[0].startsWith("'use strict'") || lines[0].startsWith('"use strict"')) insertIdx = 1;
    if (lines[0].startsWith('#!')) insertIdx = 1;
    lines.splice(insertIdx, 0, UTILITY_REQUIRE);

    // Append placeholder block at the end, replacing SCRIPT_NAME
    let scriptName = file.replace('.js', '');
    lines.push(PLACEHOLDER_BLOCK.replace('SCRIPT_NAME', JSON.stringify(scriptName)));

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Updated ${file}`);
  });

console.log('Injection complete.'); 