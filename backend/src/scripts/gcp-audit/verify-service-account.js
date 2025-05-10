const { google } = require('googleapis');
const fs = require('fs');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');
const projectId = credentials.project_id;
const serviceAccountEmail = credentials.client_email;

// Initialize auth client
const auth = new google.auth.JWT(
  serviceAccountEmail,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/cloud-platform']
);

async function verifyServiceAccount() {
  try {
    console.log('Verifying service account status...');
    console.log('Service Account:', serviceAccountEmail);
    console.log('Project ID:', projectId);

    // Test authentication
    await auth.authorize();
    console.log('\n✓ Authentication successful');

    // Get service account details
    const iam = google.iam({ version: 'v1', auth });
    try {
      const response = await iam.projects.serviceAccounts.get({
        name: `projects/${projectId}/serviceAccounts/${serviceAccountEmail}`
      });
      console.log('\n✓ Service account exists and is active');
      console.log('Display Name:', response.data.displayName || 'Not set');
      console.log('Description:', response.data.description || 'Not set');
      console.log('Disabled:', response.data.disabled ? 'Yes' : 'No');
    } catch (error) {
      console.error('\n✗ Error retrieving service account details:', error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Get IAM policy
    const resourceManager = google.cloudresourcemanager({ version: 'v1', auth });
    try {
      const response = await resourceManager.projects.getIamPolicy({
        resource: projectId
      });
      
      console.log('\nIAM Policy for project:');
      const bindings = response.data.bindings || [];
      const serviceAccountRoles = bindings
        .filter(binding => binding.members.includes(`serviceAccount:${serviceAccountEmail}`))
        .map(binding => binding.role);
      
      if (serviceAccountRoles.length > 0) {
        console.log('\n✓ Service account has the following roles:');
        serviceAccountRoles.forEach(role => console.log(`  - ${role}`));
      } else {
        console.log('\n✗ Service account has no roles assigned');
      }
    } catch (error) {
      console.error('\n✗ Error retrieving IAM policy:', error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('\n✗ Error during verification:', error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

verifyServiceAccount(); 