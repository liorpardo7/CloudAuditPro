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
        notApplicable: 0,
        errors: {
          permissionDenied: 0,
          quotaExceeded: 0,
          serviceUnavailable: 0,
          timeout: 0,
          other: 0
        }
      },
      permissions: {
        required: [],
        missing: [],
        verified: []
      },
      errors: []
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

  async validatePermission(permission) {
    try {
      const testResponse = await this.iam.testIamPermissions({
        resource: `projects/${this.projectId}`,
        permissions: [permission]
      });
      
      const hasPermission = testResponse.data.permissions.includes(permission);
      if (hasPermission) {
        this.results.permissions.verified.push(permission);
      } else {
        this.results.permissions.missing.push(permission);
      }
      return hasPermission;
    } catch (error) {
      this.results.errors.push({
        type: 'Permission Check',
        permission,
        error: error.message
      });
      return false;
    }
  }

  async validateCheck(category, checkName, checkFn, requiredPermissions = []) {
    this.results.summary.total++;
    
    try {
      // Validate required permissions
      const missingPermissions = [];
      for (const permission of requiredPermissions) {
        if (!this.results.permissions.verified.includes(permission)) {
          const hasPermission = await this.validatePermission(permission);
          if (!hasPermission) {
            missingPermissions.push(permission);
          }
        }
      }

      if (missingPermissions.length > 0) {
        this.results.checks[`${category}.${checkName}`] = {
          status: '✗',
          error: `Missing required permissions: ${missingPermissions.join(', ')}`,
          errorType: 'permissionDenied'
        };
        this.results.summary.failed++;
        this.results.summary.errors.permissionDenied++;
        return;
      }

      // Run the check with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Check timed out')), 30000)
      );
      
      const result = await Promise.race([checkFn(), timeoutPromise]);
      
      // Validate the result
      const isValid = this.validateResult(result);
      
      this.results.checks[`${category}.${checkName}`] = {
        status: isValid ? '✓' : '✗',
        result: result,
        timestamp: new Date().toISOString()
      };
      
      if (isValid) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    } catch (error) {
      let errorType = 'other';
      let errorMessage = error.message;
      
      // Categorize errors
      if (error.message.includes('permission denied') || error.message.includes('403')) {
        errorType = 'permissionDenied';
      } else if (error.message.includes('quota exceeded') || error.message.includes('429')) {
        errorType = 'quotaExceeded';
      } else if (error.message.includes('service unavailable') || error.message.includes('503')) {
        errorType = 'serviceUnavailable';
      } else if (error.message.includes('timed out')) {
        errorType = 'timeout';
      }
      
      this.results.checks[`${category}.${checkName}`] = {
        status: '✗',
        error: errorMessage,
        errorType: errorType,
        timestamp: new Date().toISOString()
      };
      
      this.results.summary.failed++;
      this.results.summary.errors[errorType]++;
      
      this.results.errors.push({
        type: 'Check Execution',
        category,
        check: checkName,
        error: errorMessage,
        errorType,
        timestamp: new Date().toISOString(),
        details: error.response?.data || {}
      });
    }
  }

  validateResult(result) {
    if (!result) return false;
    
    // Check if result is an object with data
    if (typeof result === 'object') {
      // Check for empty arrays
      if (Array.isArray(result) && result.length === 0) return false;
      
      // Check for empty objects
      if (Object.keys(result).length === 0) return false;
      
      // Check for data property in API responses
      if (result.data) {
        if (Array.isArray(result.data) && result.data.length === 0) return false;
        if (typeof result.data === 'object' && Object.keys(result.data).length === 0) return false;
      }
    }
    
    return true;
  }

  getResults() {
    return {
      ...this.results,
      summary: {
        ...this.results.summary,
        passRate: `${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`
      }
    };
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