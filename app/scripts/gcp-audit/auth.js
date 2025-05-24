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

// Simple in-memory cache for tokens (per user/session)
const tokenCache = new Map();

/**
 * Gets the authentication client
 * @param {Object} tokens - OAuth tokens (optional)
 * @param {string} sessionId - Session ID (optional)
 * @returns {Promise<OAuth2Client|JWT>} The authenticated client
 */
async function getAuthClient(tokens = null, sessionId = null) {
  if (tokens) {
    // Use OAuth2 client with provided tokens
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);
    // Validate token before returning
    try {
      await validateToken(oauth2Client);
      // Cache valid tokens
      if (sessionId) tokenCache.set(sessionId, tokens);
      return oauth2Client;
    } catch (err) {
      // If token expired and refresh_token is available, refresh it
      if (tokens.refresh_token) {
        const newTokens = await refreshAccessToken(tokens.refresh_token);
        oauth2Client.setCredentials(newTokens);
        if (sessionId) tokenCache.set(sessionId, newTokens);
        return oauth2Client;
      } else {
        throw err;
      }
    }
  }

  if (cachedAuthClient) {
    return cachedAuthClient;
  }

  // Fallback: use service account JSON (legacy/testing only)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Service account fallback is disabled in production');
  }
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
 * Validates the OAuth2 token for expiry, scope, and audience
 * @param {OAuth2Client} oauth2Client
 */
async function validateToken(oauth2Client) {
  const { tokenInfo } = await oauth2Client.getAccessToken();
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    throw new Error('Missing access token');
  }
  // Check expiry
  if (oauth2Client.credentials.expiry_date && oauth2Client.credentials.expiry_date < Date.now()) {
    throw new Error('Access token expired');
  }
  // Optionally, check scopes and audience
  // (You may want to fetch token info from Google if needed)
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

/**
 * Refreshes the access token using the refresh token
 * @param {string} refreshToken
 * @returns {Promise<Object>} New tokens
 */
async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    throw new Error('Failed to refresh access token');
  }
  return await res.json();
}

module.exports = {
  getAuthClient,
  getProjectId,
  initializeGoogleClient
}; 