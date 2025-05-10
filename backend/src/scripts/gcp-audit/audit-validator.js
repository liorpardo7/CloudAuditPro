const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
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

class AuditValidator {
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
      this.storage = google.storage({ version: 'v1', auth: this.authClient });
      this.securitycenter = google.securitycenter({ version: 'v1', auth: this.authClient });
      this.billing = google.cloudbilling({ version: 'v1', auth: this.authClient });
      this.iam = google.iam({ version: 'v1', auth: this.authClient });
      this.cloudasset = google.cloudasset({ version: 'v1', auth: this.authClient });
      this.container = google.container({ version: 'v1', auth: this.authClient });
      this.dns = google.dns({ version: 'v1', auth: this.authClient });
      this.cloudbuild = google.cloudbuild({ version: 'v1', auth: this.authClient });
      this.logging = google.logging({ version: 'v2', auth: this.authClient });
      
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

  async validateComputeChecks() {
    // List all VM instances
    await this.validateCheck('Compute.VM', 'ListAllInstances', async () => {
      const response = await this.compute.instances.list({
        project: this.projectId,
        zone: 'us-central1-a'
      });
      return response.data;
    });

    // Check machine types
    await this.validateCheck('Compute.VM', 'CheckMachineTypes', async () => {
      const response = await this.compute.machineTypes.list({
        project: this.projectId,
        zone: 'us-central1-a'
      });
      return response.data;
    });

    // Check for underutilized instances
    await this.validateCheck('Compute.VM', 'CheckUnderutilizedInstances', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await this.monitoring.projects.timeSeries.list({
        name: `projects/${this.projectId}`,
        filter: 'metric.type = "compute.googleapis.com/instance/cpu/utilization"',
        aggregation: {
          alignmentPeriod: '3600s',
          perSeriesAligner: 'ALIGN_MEAN'
        },
        'interval.startTime': sevenDaysAgo.toISOString(),
        'interval.endTime': now.toISOString()
      });
      return response.data;
    });
  }

  async validateStorageChecks() {
    // List all buckets
    await this.validateCheck('Storage', 'ListAllBuckets', async () => {
      const response = await this.storage.buckets.list({
        project: this.projectId
      });
      return response.data;
    });

    // Check bucket security
    await this.validateCheck('Storage', 'CheckBucketSecurity', async () => {
      const buckets = await this.storage.buckets.list({
        project: this.projectId
      });

      const securityResults = {};
      for (const bucket of buckets.data.items || []) {
        try {
          const policy = await this.storage.buckets.getIamPolicy({
            bucket: bucket.name
          });
          securityResults[bucket.name] = policy.data;
        } catch (error) {
          console.warn(`Warning: Could not check security for bucket ${bucket.name}: ${error.message}`);
        }
      }
      return securityResults;
    });
  }

  async validateSecurityChecks() {
    // Check IAM roles
    await this.validateCheck('Security', 'CheckIAMRoles', async () => {
      const response = await this.iam.projects.roles.list({
        parent: `projects/${this.projectId}`
      });
      return response.data;
    });

    // Check service accounts
    await this.validateCheck('Security', 'CheckServiceAccounts', async () => {
      const response = await this.iam.projects.serviceAccounts.list({
        name: `projects/${this.projectId}`
      });
      return response.data;
    });
  }

  async validateCostChecks() {
    // Check billing accounts
    await this.validateCheck('Cost', 'CheckBillingAccounts', async () => {
      const response = await this.billing.billingAccounts.list();
      return response.data;
    });

    // Check cost optimization
    await this.validateCheck('Cost', 'CheckCostOptimization', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await this.monitoring.projects.timeSeries.list({
        name: `projects/${this.projectId}`,
        filter: 'metric.type = "compute.googleapis.com/instance/cpu/utilization" AND metric.labels.state = "idle"',
        aggregation: {
          alignmentPeriod: '3600s',
          perSeriesAligner: 'ALIGN_MEAN'
        },
        'interval.startTime': sevenDaysAgo.toISOString(),
        'interval.endTime': now.toISOString()
      });
      return response.data;
    });
  }

  async validateAll() {
    await this.initialize();
    console.log('Starting comprehensive audit validation...\n');

    console.log('Validating Compute Resources...');
    await this.validateComputeChecks();

    console.log('\nValidating Storage Resources...');
    await this.validateStorageChecks();

    console.log('\nValidating Security Configuration...');
    await this.validateSecurityChecks();

    console.log('\nValidating Cost Management...');
    await this.validateCostChecks();
  }
}

module.exports = { AuditValidator };

// Run the validator
const validator = new AuditValidator();
validator.validateAll().catch(console.error); 