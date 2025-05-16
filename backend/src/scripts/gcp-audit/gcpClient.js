const { google } = require('googleapis');
const path = require('path');
const { getAuthClient, getProjectId } = require('./auth');

// Export initialized API clients
module.exports = {
  getAuthClient,
  getProjectId,
  getResourceManager: async () => {
    const auth = await getAuthClient();
    return google.cloudresourcemanager({ version: 'v1', auth });
  },
  getCompute: async () => {
    const auth = await getAuthClient();
    return google.compute({ version: 'v1', auth });
  },
  getSecurityCenter: async () => {
    const auth = await getAuthClient();
    return google.securitycenter({ version: 'v1', auth });
  },
  getRecommender: async () => {
    const auth = await getAuthClient();
    return google.recommender({ version: 'v1', auth });
  },
  getMonitoring: async () => {
    const auth = await getAuthClient();
    return google.monitoring({ version: 'v1', auth });
  },
  getBilling: async () => {
    const auth = await getAuthClient();
    return google.cloudbilling({ version: 'v1', auth });
  },
  getContainer: async () => {
    const auth = await getAuthClient();
    return google.container({ version: 'v1', auth });
  },
  getDlp: async () => {
    const auth = await getAuthClient();
    return google.dlp({ version: 'v2', auth });
  },
  getOrgPolicy: async () => {
    const auth = await getAuthClient();
    return google.orgpolicy({ version: 'v2', auth });
  },
  getKms: async () => {
    const auth = await getAuthClient();
    return google.cloudkms({ version: 'v1', auth });
  }
}; 