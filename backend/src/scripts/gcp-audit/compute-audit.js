const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  const findings = [];
  const errors = [];
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const compute = google.compute({ version: 'v1', auth: authClient });
    const monitoring = google.monitoring({ version: 'v3', auth: authClient });
    
    // VM Instance Inventory
    console.log('Starting VM instance inventory...');
    const instances = await listAllInstances(compute, projectId);
    
    // Check instance types and sizes
    const machineTypes = await listMachineTypes(compute, projectId);
    
    // Analyze each instance
    for (const instance of instances) {
      const instanceFindings = await analyzeInstance(compute, monitoring, projectId, instance, machineTypes);
      findings.push(...instanceFindings);
    }
    
    // Generate summary
    const summary = {
      totalInstances: instances.length,
      findings: findings.length,
      errors: errors.length
    };
    
    // Write results
    await writeAuditResults('compute-audit', findings, summary, errors, projectId);
    
    return {
      findings,
      summary,
      errors
    };
  } catch (error) {
    console.error('Error in compute audit:', error);
    errors.push({ error: error.message });
    await writeAuditResults('compute-audit', findings, summary, errors, projectId);
    throw error;
  }
}

async function listAllInstances(compute, projectId) {
  const instances = [];
  let pageToken;
  
  do {
    const response = await compute.instances.aggregatedList({
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

async function listMachineTypes(compute, projectId) {
  const machineTypes = new Map();
  let pageToken;
  
  do {
    const response = await compute.machineTypes.aggregatedList({
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

async function analyzeInstance(compute, monitoring, projectId, instance, machineTypes) {
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
    const utilization = await getInstanceUtilization(monitoring, projectId, instance);
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

async function getInstanceUtilization(monitoring, projectId, instance) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const [cpuResponse, memoryResponse] = await Promise.all([
    monitoring.projects.timeSeries.list({
      name: `projects/${projectId}`,
      filter: `metric.type = "compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id = "${instance.id}"`,
      'interval.startTime': oneHourAgo.toISOString(),
      'interval.endTime': now.toISOString()
    }),
    monitoring.projects.timeSeries.list({
      name: `projects/${projectId}`,
      filter: `metric.type = "compute.googleapis.com/instance/memory/balloon/ram_used" AND resource.labels.instance_id = "${instance.id}"`,
      'interval.startTime': oneHourAgo.toISOString(),
      'interval.endTime': now.toISOString()
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

module.exports = { run };

// Run the audit if this file is executed directly
if (require.main === module) {
  run().catch(console.error);
} 
