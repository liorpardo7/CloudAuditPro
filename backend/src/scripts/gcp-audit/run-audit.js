const { OAuthAuthenticator } = require('./oauth-auth');
const path = require('path');
const fs = require('fs');

async function runAudit() {
  try {
    // Initialize OAuth authenticator
    const authenticator = new OAuthAuthenticator();
    
    // Start authentication process
    console.log('Starting authentication process...');
    const { tokens, selectedProjects } = await authenticator.authenticate();
    
    console.log('Authentication successful!');
    console.log(`Selected projects: ${selectedProjects.join(', ')}`);
    
    // Tokens must be managed by the backend/database only. Remove any code that writes tokens to local files.
    if (!tokens) {
      throw new Error('OAuth tokens must be provided by the backend/database. Local file usage is not allowed.');
    }
    
    // Create audit configuration
    const config = {
      tokens,
      selectedProjects,
      auditScripts: [
        'cost-allocation-audit.js',
        'security-audit.js',
        'networking-audit.js',
        'iam-audit.js',
        'storage-audit.js',
        'compute-audit.js',
        'bigquery-audit.js',
        'cloudsql_audit.js',
        'monitoring-audit.js',
        'billing-audit.js'
      ]
    };
    
    // Save configuration
    const configPath = path.join(__dirname, 'audit-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('Configuration saved. Starting audits...');
    
    // Run each audit script for selected projects
    for (const projectId of selectedProjects) {
      console.log(`\nAuditing project: ${projectId}`);
      
      for (const script of config.auditScripts) {
        try {
          console.log(`Running ${script}...`);
          const scriptPath = path.join(__dirname, script);
          const scriptModule = require(scriptPath);
          
          if (typeof scriptModule.run === 'function') {
            await scriptModule.run(projectId, tokens);
          } else {
            console.warn(`Script ${script} does not have a run method`);
          }
        } catch (error) {
          console.error(`Error running ${script}:`, error);
        }
      }
    }
    
    console.log('\nAudit completed!');
    console.log('Results are available in the results directory.');
    
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAudit().catch(console.error);
}

module.exports = { runAudit }; 