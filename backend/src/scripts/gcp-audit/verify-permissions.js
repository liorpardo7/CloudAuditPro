const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');
const projectId = 'dba-inventory-services-prod';

// Initialize auth client with correct scopes based on service account roles
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/cloud-platform'] // Full scope for admin roles
);

async function verifyPermissions() {
  const results = {
    timestamp: new Date().toISOString(),
    projectId: projectId,
    serviceAccount: credentials.client_email,
    permissions: {}
  };

  try {
    // First verify if the service account is valid
    console.log('Verifying service account authentication...');
    try {
      await auth.authorize();
      console.log('✓ Service account authentication successful');
    } catch (error) {
      console.error('✗ Service account authentication failed:', error.message);
      if (error.response?.data) {
        console.error('Detailed error:', JSON.stringify(error.response.data, null, 2));
      }
      process.exit(1);
    }

    // Verify Compute Engine permissions
    console.log('\nVerifying Compute Engine permissions...');
    const compute = google.compute({ version: 'v1', auth });
    try {
      await compute.zones.list({ project: projectId });
      results.permissions.compute = {
        status: 'success',
        message: 'Compute Engine API access verified'
      };
      console.log('✓ Compute Engine permissions verified');
    } catch (error) {
      results.permissions.compute = {
        status: 'error',
        message: error.message,
        details: error.response?.data || {},
        requiredPermissions: ['compute.zones.list']
      };
      console.log('✗ Compute Engine permissions check failed:', error.message);
    }

    // Verify Storage permissions
    const storage = google.storage({ version: 'v1', auth });
    try {
      await storage.buckets.list({ project: projectId });
      results.permissions.storage = {
        status: 'success',
        message: 'Cloud Storage API access verified'
      };
    } catch (error) {
      results.permissions.storage = {
        status: 'error',
        message: error.message,
        requiredPermissions: ['storage.buckets.list']
      };
    }

    // Verify IAM permissions
    const iam = google.iam({ version: 'v1', auth });
    try {
      await iam.projects.serviceAccounts.list({ name: `projects/${projectId}` });
      results.permissions.iam = {
        status: 'success',
        message: 'IAM API access verified'
      };
    } catch (error) {
      results.permissions.iam = {
        status: 'error',
        message: error.message,
        requiredPermissions: ['iam.serviceAccounts.list']
      };
    }

    // Verify Resource Manager permissions
    const cloudresourcemanager = google.cloudresourcemanager({ version: 'v1', auth });
    try {
      await cloudresourcemanager.projects.getIamPolicy({
        resource: projectId
      });
      results.permissions.resourceManager = {
        status: 'success',
        message: 'Resource Manager API access verified'
      };
    } catch (error) {
      results.permissions.resourceManager = {
        status: 'error',
        message: error.message,
        requiredPermissions: ['resourcemanager.projects.getIamPolicy']
      };
    }

    // Verify Billing permissions
    const cloudbilling = google.cloudbilling({ version: 'v1', auth });
    try {
      await cloudbilling.billingAccounts.list();
      results.permissions.billing = {
        status: 'success',
        message: 'Billing API access verified'
      };
    } catch (error) {
      results.permissions.billing = {
        status: 'error',
        message: error.message,
        requiredPermissions: ['billing.accounts.list']
      };
    }

    // Verify Monitoring permissions
    const monitoring = google.monitoring({ version: 'v3', auth });
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      
      await monitoring.projects.timeSeries.list({
        name: `projects/${projectId}`,
        filter: 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
        'interval.startTime': oneHourAgo.toISOString(),
        'interval.endTime': now.toISOString()
      });
      results.permissions.monitoring = {
        status: 'success',
        message: 'Monitoring API access verified'
      };
      console.log('✓ Monitoring permissions verified');
    } catch (error) {
      results.permissions.monitoring = {
        status: 'error',
        message: error.message,
        details: error.response?.data || {},
        requiredPermissions: ['monitoring.timeSeries.list']
      };
      console.log('✗ Monitoring permissions check failed:', error.message);
    }

    // Verify Logging permissions
    const logging = google.logging({ version: 'v2', auth });
    try {
      await logging.entries.list({
        resourceNames: [`projects/${projectId}`],
        filter: 'resource.type="gce_instance"',
        pageSize: 1
      });
      results.permissions.logging = {
        status: 'success',
        message: 'Logging API access verified'
      };
    } catch (error) {
      results.permissions.logging = {
        status: 'error',
        message: error.message,
        requiredPermissions: ['logging.logEntries.list']
      };
    }

    // Save results to file
    const outputPath = path.join(__dirname, 'permissions-verification-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log('\nPermissions verification completed. Results saved to:', outputPath);

    // Print summary
    console.log('\nPermissions Summary:');
    Object.entries(results.permissions).forEach(([service, result]) => {
      const icon = result.status === 'success' ? '✓' : '✗';
      console.log(`${icon} ${service}: ${result.status}`);
      if (result.status === 'error') {
        console.log(`  Required permissions: ${result.requiredPermissions.join(', ')}`);
        if (result.details?.error?.message) {
          console.log(`  Error details: ${result.details.error.message}`);
        }
      }
    });

  } catch (error) {
    console.error('Error during permissions verification:', error);
    if (error.response?.data) {
      console.error('Detailed error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

verifyPermissions(); 