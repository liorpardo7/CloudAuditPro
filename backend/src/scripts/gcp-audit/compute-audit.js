const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

// Initialize the Compute API client with auth
const compute = google.compute('v1');
const monitoring = google.monitoring('v3');

const recommender = google.recommender({
  version: 'v1',
  auth: auth.getAuthClient()
});

async function runComputeAudit() {
  try {
    const authClient = auth.getAuthClient();
    const projectId = auth.getProjectId();
    
    const findings = [];
    const errors = [];
    
    // VM Instance Inventory
    console.log('Starting VM instance inventory...');
    const instances = await listAllInstances(authClient, projectId);
    
    // Check instance types and sizes
    const machineTypes = await listMachineTypes(authClient, projectId);
    
    // Analyze each instance
    for (const instance of instances) {
      const instanceFindings = await analyzeInstance(authClient, projectId, instance, machineTypes);
      findings.push(...instanceFindings);
    }
    
    // Generate summary
    const summary = {
      totalInstances: instances.length,
      findings: findings.length,
      errors: errors.length
    };
    
    return {
      findings,
      summary,
      errors
    };
  } catch (error) {
    console.error('Error in compute audit:', error);
    return {
      findings: [],
      summary: {},
      errors: [error.message]
    };
  }
}

async function listAllInstances(authClient, projectId) {
  const instances = [];
  let pageToken;
  
  do {
    const response = await compute.instances.aggregatedList({
      auth: authClient,
      project: projectId,
      pageToken
    });
    
    for (const [zone, zoneData] of Object.entries(response.data.items)) {
      if (zoneData.instances) {
        instances.push(...zoneData.instances);
      }
    }
    
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  
  return instances;
}

async function listMachineTypes(authClient, projectId) {
  const machineTypes = new Map();
  let pageToken;
  
  do {
    const response = await compute.machineTypes.aggregatedList({
      auth: authClient,
      project: projectId,
      pageToken
    });
    
    for (const [zone, zoneData] of Object.entries(response.data.items)) {
      if (zoneData.machineTypes) {
        for (const machineType of zoneData.machineTypes) {
          machineTypes.set(machineType.name, machineType);
        }
      }
    }
    
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  
  return machineTypes;
}

async function analyzeInstance(authClient, projectId, instance, machineTypes) {
  const findings = [];
  
  // Check instance type
  const machineType = machineTypes.get(instance.machineType.split('/').pop());
  if (machineType) {
    findings.push({
      type: 'instance_type',
      instance: instance.name,
      status: 'info',
      message: `Instance using ${machineType.name} (${machineType.description})`
    });
  }
  
  // Check labels
  if (!instance.labels || Object.keys(instance.labels).length === 0) {
    findings.push({
      type: 'missing_labels',
      instance: instance.name,
      status: 'warning',
      message: 'Instance has no labels'
    });
  }
  
  // Check service account
  if (!instance.serviceAccounts || instance.serviceAccounts.length === 0) {
    findings.push({
      type: 'no_service_account',
      instance: instance.name,
      status: 'warning',
      message: 'Instance has no service account configured'
    });
  }
  
  // Check disk encryption
  for (const disk of instance.disks) {
    if (!disk.diskEncryptionKey) {
      findings.push({
        type: 'unencrypted_disk',
        instance: instance.name,
        disk: disk.deviceName,
        status: 'warning',
        message: 'Disk is not encrypted'
      });
    }
  }
  
  // Check utilization
  try {
    const utilization = await getInstanceUtilization(authClient, projectId, instance);
    if (utilization.cpu < 10) {
      findings.push({
        type: 'low_cpu_utilization',
        instance: instance.name,
        status: 'warning',
        message: `Low CPU utilization: ${utilization.cpu}%`
      });
    }
    if (utilization.memory < 10) {
      findings.push({
        type: 'low_memory_utilization',
        instance: instance.name,
        status: 'warning',
        message: `Low memory utilization: ${utilization.memory}%`
      });
    }
  } catch (error) {
    console.error(`Error getting utilization metrics for instance ${instance.name}:`, error);
  }
  
  return findings;
}

async function getInstanceUtilization(authClient, projectId, instance) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const [cpuResponse, memoryResponse] = await Promise.all([
    monitoring.projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type = "compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id = "${instance.id}"`,
      interval: {
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString()
      }
    }),
    monitoring.projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type = "compute.googleapis.com/instance/memory/balloon/ram_used" AND resource.labels.instance_id = "${instance.id}"`,
      interval: {
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString()
      }
    })
  ]);
  
  const cpuPoints = cpuResponse.data.timeSeries[0]?.points || [];
  const memoryPoints = memoryResponse.data.timeSeries[0]?.points || [];
  
  const cpuAvg = cpuPoints.reduce((sum, point) => sum + point.value.doubleValue, 0) / cpuPoints.length;
  const memoryAvg = memoryPoints.reduce((sum, point) => sum + point.value.doubleValue, 0) / memoryPoints.length;
  
  return {
    cpu: cpuAvg * 100,
    memory: memoryAvg * 100
  };
}

// Run the audit if this file is executed directly
if (require.main === module) {
  runComputeAudit()
    .then(results => {
      console.log('Compute audit completed. Results:', JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('Error running compute audit:', error);
      process.exit(1);
    });
}

module.exports = {
  runComputeAudit
};

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("compute-audit", findings, summary, errors);
