const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];
const SERVICE_ACCOUNT_KEY_PATH = '/Users/liorpardo/CloudAuditPro-1/backend/src/scripts/gcp-audit/dba-inventory-services-prod-8a97ca8265b5.json';

/**
 * Gets the authentication client
 * @returns {Promise<JWT>} The authenticated client
 */
async function getAuthClient() {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
      throw new Error(`Service account key file not found at ${SERVICE_ACCOUNT_KEY_PATH}`);
    }

    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
    const client = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      SCOPES
    );
    
    // Verify the credentials work
    await client.authorize();
    console.log('Successfully authenticated with service account');
    return client;
  } catch (error) {
    console.error('Error using service account key:', error.message);
    throw new Error('Failed to authenticate with service account key');
  }
}

/**
 * Gets the project ID
 * @returns {Promise<string>} The project ID
 */
async function getProjectId() {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
      throw new Error(`Service account key file not found at ${SERVICE_ACCOUNT_KEY_PATH}`);
    }

    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
    if (credentials.project_id) {
      console.log('Using project ID from service account:', credentials.project_id);
      return credentials.project_id;
    }

    throw new Error('No project ID found in service account key');
  } catch (error) {
    console.error('Error getting project ID:', error);
    throw error;
  }
}

module.exports = {
  getAuthClient,
  getProjectId
}; 