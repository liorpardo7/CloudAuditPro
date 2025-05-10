const { google } = require('googleapis');
const path = require('path');
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

// Auth client for all APIs
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/compute.readonly',
    'https://www.googleapis.com/auth/monitoring.read',
    'https://www.googleapis.com/auth/securitycenter.readonly',
    'https://www.googleapis.com/auth/iam.readonly',
    'https://www.googleapis.com/auth/cloudkms.readonly',
    'https://www.googleapis.com/auth/cloud-billing.readonly',
    'https://www.googleapis.com/auth/cloud-platform.read-only',
    'https://www.googleapis.com/auth/cloud-asset.readonly',
    'https://www.googleapis.com/auth/cloudresourcemanager.readonly',
    'https://www.googleapis.com/auth/service.management.readonly',
    'https://www.googleapis.com/auth/servicecontrol',
    'https://www.googleapis.com/auth/service.management',
    'https://www.googleapis.com/auth/serviceusage.readonly',
    'https://www.googleapis.com/auth/recommender.read',
  ]
});

// Export initialized API clients
module.exports = {
  auth,
  getResourceManager: () => google.cloudresourcemanager({ version: 'v1', auth }),
  getCompute: () => google.compute({ version: 'v1', auth }),
  getSecurityCenter: () => google.securitycenter({ version: 'v1', auth }),
  getRecommender: () => google.recommender({ version: 'v1', auth }),
  getMonitoring: () => google.monitoring({ version: 'v1', auth }),
  getBilling: () => google.cloudbilling({ version: 'v1', auth }),
  getContainer: () => google.container({ version: 'v1', auth }),
  getDlp: () => google.dlp({ version: 'v2', auth }),
  getOrgPolicy: () => google.orgpolicy({ version: 'v2', auth }),
  getKms: () => google.cloudkms({ version: 'v1', auth }),
}; 