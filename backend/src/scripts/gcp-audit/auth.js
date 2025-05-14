const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Load service account credentials
const keyPath = path.join(__dirname, 'dba-inventory-services-prod-8a97ca8265b5.json');
const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

function getAuthClient() {
  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    SCOPES
  );
}

function getProjectId() {
  // Prefer env var, fallback to credentials
  return process.env.GOOGLE_CLOUD_PROJECT || credentials.project_id;
}

module.exports = {
  getAuthClient,
  getProjectId
}; 