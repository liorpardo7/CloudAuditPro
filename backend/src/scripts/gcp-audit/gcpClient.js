const { google } = require('googleapis');
const path = require('path');
const { getAuthClient: getAuthClientFromAuth, getProjectId: getProjectIdFromAuth } = require('./auth');

let authClient = null;
let projectId = null;
let computeClient = null;
let monitoringClient = null;
let containerClient = null;
let storageClient = null;
let cloudFunctionsClient = null;
let bigqueryClient = null;
let cloudsqlClient = null;

async function initializeGoogleClient() {
  if (!authClient) {
    authClient = await getAuthClientFromAuth();
  }
  return authClient;
}

async function getAuthClient() {
  if (!authClient) {
    authClient = await initializeGoogleClient();
  }
  return authClient;
}

async function getProjectId() {
  if (!projectId) {
    projectId = await getProjectIdFromAuth();
  }
  return projectId;
}

async function getCompute() {
  if (!computeClient) {
    const auth = await getAuthClient();
    computeClient = google.compute({ version: 'v1', auth });
  }
  return computeClient;
}

async function getMonitoring() {
  if (!monitoringClient) {
    const auth = await getAuthClient();
    monitoringClient = google.monitoring({ version: 'v3', auth });
  }
  return monitoringClient;
}

async function getContainer() {
  if (!containerClient) {
    const auth = await getAuthClient();
    containerClient = google.container({ version: 'v1', auth });
  }
  return containerClient;
}

async function getStorage() {
  if (!storageClient) {
    const auth = await getAuthClient();
    storageClient = google.storage({ version: 'v1', auth });
  }
  return storageClient;
}

async function getCloudFunctions() {
  if (!cloudFunctionsClient) {
    const auth = await getAuthClient();
    cloudFunctionsClient = google.cloudfunctions({ version: 'v2', auth });
  }
  return cloudFunctionsClient;
}

async function getBigQuery() {
  if (!bigqueryClient) {
    const auth = await getAuthClient();
    bigqueryClient = google.bigquery({ version: 'v2', auth });
  }
  return bigqueryClient;
}

async function getCloudSQL() {
  if (!cloudsqlClient) {
    const auth = await getAuthClient();
    cloudsqlClient = google.sqladmin({ version: 'v1beta4', auth });
  }
  return cloudsqlClient;
}

// Export initialized API clients
module.exports = {
  initializeGoogleClient,
  getAuthClient,
  getProjectId,
  getCompute,
  getMonitoring,
  getContainer,
  getStorage,
  getCloudFunctions,
  getBigQuery,
  getCloudSQL,
  getResourceManager: async () => {
    const auth = await getAuthClient();
    return google.cloudresourcemanager({ version: 'v1', auth });
  },
  getBilling: async () => {
    const auth = await getAuthClient();
    return google.cloudbilling({ version: 'v1', auth });
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