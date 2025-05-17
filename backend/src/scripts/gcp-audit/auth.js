const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/compute',
  'https://www.googleapis.com/auth/monitoring',
  'https://www.googleapis.com/auth/cloud-platform.read-only'
];

const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'dba-inventory-services-prod-8a97ca8265b5.json');

let cachedAuthClient = null;
let cachedProjectId = null;

/**
 * Gets the authentication client
 * @param {Object} tokens - OAuth tokens (optional)
 * @returns {Promise<OAuth2Client|JWT>} The authenticated client
 */
async function getAuthClient(tokens = null) {
  if (tokens) {
    // Use OAuth2 client with provided tokens
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  }

  if (cachedAuthClient) {
    return cachedAuthClient;
  }

  // Fallback: use service account JSON (legacy/testing only)
  try {
    const keyFile = await fs.readFile(SERVICE_ACCOUNT_KEY_PATH, 'utf8');
    const key = JSON.parse(keyFile);
    cachedAuthClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES
    );
    await cachedAuthClient.authorize();
    console.log('Successfully authenticated with service account');
    return cachedAuthClient;
  } catch (error) {
    console.error('Error initializing auth client:', error);
    throw error;
  }
}

/**
 * Gets the project ID
 * @param {OAuth2Client|JWT} authClient - The authenticated client
 * @returns {Promise<string>} The project ID
 */
async function getProjectId(authClient = null) {
  if (cachedProjectId) {
    return cachedProjectId;
  }

  // If using OAuth2, get projectId from token info or Cloud Resource Manager
  if (authClient && authClient.credentials && authClient.credentials.access_token) {
    try {
      const cloudResourceManager = google.cloudresourcemanager('v1');
      const res = await cloudResourceManager.projects.list({ auth: authClient, pageSize: 1 });
      if (res.data.projects && res.data.projects.length > 0) {
        cachedProjectId = res.data.projects[0].projectId;
        return cachedProjectId;
      }
    } catch (error) {
      console.error('Error getting project ID from OAuth2 client:', error);
      throw error;
    }
  }

  // Fallback: use service account JSON
  try {
    const keyFile = await fs.readFile(SERVICE_ACCOUNT_KEY_PATH, 'utf8');
    const key = JSON.parse(keyFile);
    cachedProjectId = key.project_id;
    return cachedProjectId;
  } catch (error) {
    console.error('Error getting project ID:', error);
    throw error;
  }
}

/**
 * Initializes the Google API client with authentication
 * @returns {Promise<Object>} The initialized Google API client
 */
async function initializeGoogleClient() {
  if (!cachedAuthClient) {
    cachedAuthClient = await getAuthClient();
  }
  return cachedAuthClient;
}

module.exports = {
  getAuthClient,
  getProjectId,
  initializeGoogleClient
}; 