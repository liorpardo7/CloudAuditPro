const path = require('path');
const scriptPath = path.join(process.cwd(), 'shared-scripts', 'gcp-audit', 'compute-audit.js');
console.log('Trying to require:', scriptPath);
try {
  const mod = require(scriptPath);
  console.log('Success:', typeof mod);
} catch (err) {
  console.error('Error:', err);
} 