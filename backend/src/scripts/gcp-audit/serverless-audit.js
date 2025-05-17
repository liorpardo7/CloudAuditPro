const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const cloudfunctions = google.cloudfunctions('v2');
    const runApi = google.run('v2');
    const appengine = google.appengine('v1');
    const monitoring = google.monitoring('v3');
    const findings = [];
    const errors = [];
    // Audit Cloud Functions
    console.log('Starting Cloud Functions audit...');
    const functions = await listAllFunctions(cloudfunctions, authClient, projectId);
    for (const func of functions) {
      const functionFindings = await analyzeFunction(func);
      findings.push(...functionFindings);
    }
    // Audit Cloud Run
    console.log('Starting Cloud Run audit...');
    const services = await listAllServices(runApi, authClient, projectId);
    for (const service of services) {
      const serviceFindings = await analyzeService(service);
      findings.push(...serviceFindings);
    }
    // Audit App Engine
    console.log('Starting App Engine audit...');
    const apps = await listAllApps(appengine, authClient, projectId);
    for (const app of apps) {
      const appFindings = await analyzeApp(app);
      findings.push(...appFindings);
    }
    // Check resource utilization
    console.log('Checking resource utilization...');
    const utilizationFindings = await checkResourceUtilization(monitoring, authClient, projectId);
    findings.push(...utilizationFindings);
    // Generate summary
    const summary = {
      totalFunctions: functions.length,
      totalServices: services.length,
      totalApps: apps.length,
      findings: findings.length,
      errors: errors.length
    };
    await writeAuditResults('serverless-audit', findings, summary, errors, projectId);
    return {
      findings,
      summary,
      errors
    };
  } catch (error) {
    console.error('Error in serverless audit:', error);
    return {
      findings: [],
      summary: {},
      errors: [error.message]
    };
  }
}

async function listAllFunctions(cloudfunctions, authClient, projectId) {
  const functions = [];
  let pageToken;
  do {
    const response = await cloudfunctions.projects.locations.functions.list({
      auth: authClient,
      parent: `projects/${projectId}/locations/-`,
      pageToken
    });
    if (response.data.functions) {
      functions.push(...response.data.functions);
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return functions;
}

async function listAllServices(runApi, authClient, projectId) {
  const services = [];
  let pageToken;
  do {
    const response = await runApi.projects.locations.services.list({
      auth: authClient,
      parent: `projects/${projectId}/locations/-`,
      pageToken
    });
    if (response.data.services) {
      services.push(...response.data.services);
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return services;
}

async function listAllApps(appengine, authClient, projectId) {
  const response = await appengine.apps.get({
    auth: authClient,
    appsId: projectId
  });
  return [response.data];
}

async function analyzeFunction(func) {
  const findings = [];
  // Check HTTPS trigger
  if (func.httpsTrigger && !func.httpsTrigger.securityLevel) {
    findings.push({
      type: 'insecure_http_trigger',
      function: func.name,
      status: 'warning',
      message: 'Function has HTTP trigger without security level specified'
    });
  }
  // Check VPC connector
  if (!func.vpcConnector) {
    findings.push({
      type: 'no_vpc_connector',
      function: func.name,
      status: 'warning',
      message: 'Function has no VPC connector configured'
    });
  }
  // Check service account
  if (!func.serviceAccountEmail) {
    findings.push({
      type: 'no_service_account',
      function: func.name,
      status: 'warning',
      message: 'Function has no service account configured'
    });
  }
  // Check memory allocation
  if (func.availableMemoryMb < 256) {
    findings.push({
      type: 'low_memory',
      function: func.name,
      status: 'warning',
      message: `Function has low memory allocation: ${func.availableMemoryMb}MB`
    });
  }
  // Check timeout
  if (func.timeout && func.timeout.seconds > 540) {
    findings.push({
      type: 'long_timeout',
      function: func.name,
      status: 'warning',
      message: 'Function has timeout longer than 9 minutes'
    });
  }
  // Check max instances
  if (!func.maxInstanceCount) {
    findings.push({
      type: 'no_max_instances',
      function: func.name,
      status: 'warning',
      message: 'Function has no maximum instance count configured'
    });
  }
  return findings;
}

async function analyzeService(service) {
  const findings = [];
  // Check HTTPS only
  if (!service.template?.containers?.[0]?.ports?.[0]?.containerPort) {
    findings.push({
      type: 'no_https',
      service: service.name,
      status: 'warning',
      message: 'Service does not expose HTTPS port'
    });
  }
  // Add more checks as needed
  return findings;
}

async function analyzeApp(app) {
  const findings = [];
  // Add App Engine checks as needed
  return findings;
}

async function checkResourceUtilization(monitoring, authClient, projectId) {
  const findings = [];
  // Add resource utilization checks as needed
  return findings;
}

module.exports = { run }; 