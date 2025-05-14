const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

const cloudfunctions = google.cloudfunctions('v2');
const run = google.run('v2');
const appengine = google.appengine('v1');
const monitoring = google.monitoring('v3');

async function runServerlessAudit() {
  try {
    const authClient = auth.getAuthClient();
    const projectId = auth.getProjectId();
    
    const findings = [];
    const errors = [];
    
    // Audit Cloud Functions
    console.log('Starting Cloud Functions audit...');
    const functions = await listAllFunctions(authClient, projectId);
    for (const func of functions) {
      const functionFindings = await analyzeFunction(authClient, projectId, func);
      findings.push(...functionFindings);
    }
    
    // Audit Cloud Run
    console.log('Starting Cloud Run audit...');
    const services = await listAllServices(authClient, projectId);
    for (const service of services) {
      const serviceFindings = await analyzeService(authClient, projectId, service);
      findings.push(...serviceFindings);
    }
    
    // Audit App Engine
    console.log('Starting App Engine audit...');
    const apps = await listAllApps(authClient, projectId);
    for (const app of apps) {
      const appFindings = await analyzeApp(authClient, projectId, app);
      findings.push(...appFindings);
    }
    
    // Check resource utilization
    console.log('Checking resource utilization...');
    const utilizationFindings = await checkResourceUtilization(authClient, projectId);
    findings.push(...utilizationFindings);
    
    // Generate summary
    const summary = {
      totalFunctions: functions.length,
      totalServices: services.length,
      totalApps: apps.length,
      findings: findings.length,
      errors: errors.length
    };
    
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

async function listAllFunctions(authClient, projectId) {
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

async function listAllServices(authClient, projectId) {
  const services = [];
  let pageToken;
  
  do {
    const response = await run.projects.locations.services.list({
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

async function listAllApps(authClient, projectId) {
  const response = await appengine.apps.get({
    auth: authClient,
    appsId: projectId
  });
  
  return [response.data];
}

async function analyzeFunction(authClient, projectId, func) {
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

async function analyzeService(authClient, projectId, service) {
  const findings = [];
  
  // Check HTTPS only
  if (!service.template?.containers?.[0]?.ports?.[0]?.containerPort) {
    findings.push({
      type: 'no_https',
      service: service.name,
      status: 'warning',
      message: 'Service does not have HTTPS port configured'
    });
  }
  
  // Check VPC connector
  if (!service.template?.vpcAccess) {
    findings.push({
      type: 'no_vpc_connector',
      service: service.name,
      status: 'warning',
      message: 'Service has no VPC connector configured'
    });
  }
  
  // Check service account
  if (!service.template?.serviceAccount) {
    findings.push({
      type: 'no_service_account',
      service: service.name,
      status: 'warning',
      message: 'Service has no service account configured'
    });
  }
  
  // Check resource limits
  const container = service.template?.containers?.[0];
  if (!container?.resources?.limits) {
    findings.push({
      type: 'no_resource_limits',
      service: service.name,
      status: 'warning',
      message: 'Service has no resource limits configured'
    });
  }
  
  // Check container concurrency
  if (!service.template?.containerConcurrency) {
    findings.push({
      type: 'no_concurrency',
      service: service.name,
      status: 'warning',
      message: 'Service has no container concurrency configured'
    });
  }
  
  // Check min instances
  if (!service.template?.scaling?.minInstanceCount) {
    findings.push({
      type: 'no_min_instances',
      service: service.name,
      status: 'warning',
      message: 'Service has no minimum instance count configured'
    });
  }
  
  // Check max instances
  if (!service.template?.scaling?.maxInstanceCount) {
    findings.push({
      type: 'no_max_instances',
      service: service.name,
      status: 'warning',
      message: 'Service has no maximum instance count configured'
    });
  }
  
  return findings;
}

async function analyzeApp(authClient, projectId, app) {
  const findings = [];
  
  // Check SSL configuration
  if (!app.sslSettings?.sslManagementType) {
    findings.push({
      type: 'no_ssl',
      app: app.name,
      status: 'warning',
      message: 'App has no SSL configuration'
    });
  }
  
  // Check service account
  if (!app.serviceAccount) {
    findings.push({
      type: 'no_service_account',
      app: app.name,
      status: 'warning',
      message: 'App has no service account configured'
    });
  }
  
  // Check resource limits
  for (const service of app.services || []) {
    if (!service.resources?.cpu || !service.resources?.memoryGb) {
      findings.push({
        type: 'no_resource_limits',
        app: app.name,
        service: service.id,
        status: 'warning',
        message: 'Service has no resource limits configured'
      });
    }
  }
  
  // Check scaling settings
  for (const service of app.services || []) {
    if (!service.automaticScaling) {
      findings.push({
        type: 'no_autoscaling',
        app: app.name,
        service: service.id,
        status: 'warning',
        message: 'Service has no automatic scaling configured'
      });
    }
  }
  
  return findings;
}

async function checkResourceUtilization(authClient, projectId) {
  const findings = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Check Cloud Run utilization
  const runResponse = await monitoring.projects.timeSeries.list({
    auth: authClient,
    name: `projects/${projectId}`,
    filter: 'metric.type = "run.googleapis.com/request_count"',
    interval: {
      startTime: oneDayAgo.toISOString(),
      endTime: now.toISOString()
    }
  });
  
  const runPoints = runResponse.data.timeSeries[0]?.points || [];
  const runAvg = runPoints.reduce((sum, point) => sum + point.value.int64Value, 0) / runPoints.length;
  
  if (runAvg < 1) {
    findings.push({
      type: 'low_run_utilization',
      status: 'warning',
      message: 'Low Cloud Run request count in the last 24 hours'
    });
  }
  
  // Check Cloud Functions utilization
  const functionsResponse = await monitoring.projects.timeSeries.list({
    auth: authClient,
    name: `projects/${projectId}`,
    filter: 'metric.type = "cloudfunctions.googleapis.com/function/execution_count"',
    interval: {
      startTime: oneDayAgo.toISOString(),
      endTime: now.toISOString()
    }
  });
  
  const functionsPoints = functionsResponse.data.timeSeries[0]?.points || [];
  const functionsAvg = functionsPoints.reduce((sum, point) => sum + point.value.int64Value, 0) / functionsPoints.length;
  
  if (functionsAvg < 1) {
    findings.push({
      type: 'low_functions_utilization',
      status: 'warning',
      message: 'Low Cloud Functions execution count in the last 24 hours'
    });
  }
  
  // Check App Engine utilization
  const appEngineResponse = await monitoring.projects.timeSeries.list({
    auth: authClient,
    name: `projects/${projectId}`,
    filter: 'metric.type = "appengine.googleapis.com/system/instance_count"',
    interval: {
      startTime: oneDayAgo.toISOString(),
      endTime: now.toISOString()
    }
  });
  
  const appEnginePoints = appEngineResponse.data.timeSeries[0]?.points || [];
  const appEngineAvg = appEnginePoints.reduce((sum, point) => sum + point.value.doubleValue, 0) / appEnginePoints.length;
  
  if (appEngineAvg < 1) {
    findings.push({
      type: 'low_appengine_utilization',
      status: 'warning',
      message: 'Low App Engine instance count in the last 24 hours'
    });
  }
  
  return findings;
}

// Run the audit if this file is executed directly
if (require.main === module) {
  runServerlessAudit()
    .then(results => {
      console.log('Serverless audit completed. Results:', JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('Error running serverless audit:', error);
      process.exit(1);
    });
}

module.exports = {
  runServerlessAudit
}; 