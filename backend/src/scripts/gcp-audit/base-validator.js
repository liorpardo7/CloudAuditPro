const { google } = require('googleapis');
const { execSync } = require('child_process');

// Get access token from gcloud
function getAccessToken() {
  try {
    return execSync('gcloud auth print-access-token').toString().trim();
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

class BaseValidator {
  constructor() {
    this.results = {
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
  }

  async initialize() {
    try {
      console.log('Initializing GCP clients...');
      
      // Get access token
      const accessToken = getAccessToken();
      console.log('Got access token');
      
      // Create auth client
      this.authClient = new google.auth.OAuth2();
      this.authClient.setCredentials({ access_token: accessToken });
      
      // Get project ID
      this.projectId = 'dba-inventory-services-prod';
      console.log(`Using project ID: ${this.projectId}`);
      
      // Initialize API clients with authenticated client
      this.compute = google.compute({ version: 'v1', auth: this.authClient });
      this.monitoring = google.monitoring({ version: 'v3', auth: this.authClient });
      this.monitoringDashboards = google.monitoring({ version: 'v1', auth: this.authClient });
      this.storage = google.storage({ version: 'v1', auth: this.authClient });
      this.securitycenter = google.securitycenter({ version: 'v1', auth: this.authClient });
      this.billing = google.cloudbilling({ version: 'v1', auth: this.authClient });
      this.iam = google.iam({ version: 'v1', auth: this.authClient });
      this.cloudasset = google.cloudasset({ version: 'v1', auth: this.authClient });
      this.container = google.container({ version: 'v1', auth: this.authClient });
      this.dns = google.dns({ version: 'v1', auth: this.authClient });
      this.cloudbuild = google.cloudbuild({ version: 'v1', auth: this.authClient });
      this.logging = google.logging({ version: 'v2', auth: this.authClient });
      this.dlp = google.dlp({ version: 'v2', auth: this.authClient });
      this.cloudresourcemanager = google.cloudresourcemanager({ version: 'v1', auth: this.authClient });
      
      console.log('GCP clients initialized successfully');
    } catch (error) {
      console.error('Error initializing GCP clients:', error);
      throw error;
    }
  }

  async validateCheck(category, checkName, checkFn) {
    try {
      if (!this.results.checks[category]) {
        this.results.checks[category] = {};
      }

      console.log(`Running check: ${category}.${checkName}`);
      const result = await checkFn();

      this.results.checks[category][checkName] = {
        status: 'Passed',
        details: result
      };

      this.results.summary.total++;
      this.results.summary.passed++;

      console.log(`Check completed: ${category}.${checkName} - Status: Passed`);
    } catch (error) {
      console.error(`Error in check ${category}.${checkName}:`, error);

      this.results.checks[category][checkName] = {
        status: 'Failed',
        error: error.message
      };

      this.results.summary.total++;
      this.results.summary.failed++;
    }
  }

  getResults() {
    return this.results;
  }
}

module.exports = { BaseValidator }; 