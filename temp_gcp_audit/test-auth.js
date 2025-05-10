const { google } = require('googleapis');
const fs = require('fs');

// Load service account credentials
const credentials = require('../../dba-inventory-services-prod-8a97ca8265b5.json');
const projectId = credentials.project_id;

// Initialize auth client with correct scopes based on service account roles
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/cloud-platform'] // Full scope for admin roles
);

async function testAuth() {
  try {
    console.log('Testing service account authentication...');
    console.log('Service Account:', credentials.client_email);
    console.log('Project ID:', projectId);
    
    // Test authentication
    await auth.authorize();
    console.log('\nAuthentication successful!');
    console.log('Access token obtained.');
    
    // Test a simple API call
    const compute = google.compute({ version: 'v1', auth });
    const response = await compute.zones.list({ project: projectId });
    
    console.log('\nZones information retrieved successfully:');
    console.log('Number of zones:', response.data.items.length);
    console.log('First zone:', response.data.items[0].name);
    
  } catch (error) {
    console.error('\nAuthentication failed:');
    console.error('Error message:', error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAuth(); 