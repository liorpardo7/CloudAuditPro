const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

// Initialize auth client
const authClient = auth.getAuthClient();

async function runGkeAudit() {
  try {
    const projectId = auth.getProjectId();
    
    const findings = [];
    const errors = [];
    
    // List all GKE clusters
    console.log('Starting GKE cluster audit...');
    const clusters = await listAllClusters(authClient, projectId);
    
    // Analyze each cluster
    for (const cluster of clusters) {
      const clusterFindings = await analyzeCluster(authClient, projectId, cluster);
      findings.push(...clusterFindings);
    }
    
    // Generate summary
    const summary = {
      totalClusters: clusters.length,
      findings: findings.length,
      errors: errors.length
    };
    
    return {
      findings,
      summary,
      errors
    };
  } catch (error) {
    console.error('Error in GKE audit:', error);
    return {
      findings: [],
      summary: {},
      errors: [error.message]
    };
  }
}

async function listAllClusters(authClient, projectId) {
  const clusters = [];
  let pageToken;
  
  do {
    const response = await google.container('v1').projects.locations.clusters.list({
      auth: authClient,
      parent: `projects/${projectId}/locations/-`,
      pageToken
    });
    
    if (response.data.clusters) {
      clusters.push(...response.data.clusters);
    }
    
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  
  return clusters;
}

async function analyzeCluster(authClient, projectId, cluster) {
  const findings = [];
  
  // Check cluster version
  findings.push({
    type: 'cluster_version',
    cluster: cluster.name,
    status: 'info',
    message: `Cluster running version ${cluster.currentMasterVersion}`
  });
  
  // Check for private cluster
  if (!cluster.privateClusterConfig?.enablePrivateNodes) {
    findings.push({
      type: 'public_cluster',
      cluster: cluster.name,
      status: 'warning',
      message: 'Cluster is not private. Consider enabling private cluster for better security.'
    });
  }
  
  // Check workload identity
  if (!cluster.workloadIdentityConfig?.workloadPool) {
    findings.push({
      type: 'no_workload_identity',
      cluster: cluster.name,
      status: 'warning',
      message: 'Workload identity is not configured. Consider enabling it for better security.'
    });
  }
  
  // Check network policy
  if (!cluster.networkPolicy?.enabled) {
    findings.push({
      type: 'no_network_policy',
      cluster: cluster.name,
      status: 'warning',
      message: 'Network policy is not enabled. Consider enabling it for better security.'
    });
  }
  
  // Check binary authorization
  if (!cluster.binaryAuthorization?.enabled) {
    findings.push({
      type: 'no_binary_authorization',
      cluster: cluster.name,
      status: 'warning',
      message: 'Binary authorization is not enabled. Consider enabling it for better security.'
    });
  }
  
  // Check pod security policy
  if (!cluster.podSecurityPolicyConfig?.enabled) {
    findings.push({
      type: 'no_pod_security_policy',
      cluster: cluster.name,
      status: 'warning',
      message: 'Pod security policy is not enabled. Consider enabling it for better security.'
    });
  }
  
  // Check container image scanning
  if (!cluster.binaryAuthorization?.evaluationMode) {
    findings.push({
      type: 'no_image_scanning',
      cluster: cluster.name,
      status: 'warning',
      message: 'Container image scanning is not configured. Consider enabling it for better security.'
    });
  }
  
  // Check cluster security posture
  if (!cluster.securityPostureConfig?.mode) {
    findings.push({
      type: 'no_security_posture',
      cluster: cluster.name,
      status: 'warning',
      message: 'Security posture is not configured. Consider enabling it for better security.'
    });
  }
  
  // Check logging and monitoring
  if (!cluster.loggingService || !cluster.monitoringService) {
    findings.push({
      type: 'incomplete_monitoring',
      cluster: cluster.name,
      status: 'warning',
      message: 'Logging or monitoring services are not fully configured.'
    });
  }
  
  // Check node pool sizing
  for (const nodePool of cluster.nodePools) {
    if (nodePool.initialNodeCount < 3) {
      findings.push({
        type: 'small_node_pool',
        cluster: cluster.name,
        nodePool: nodePool.name,
        status: 'warning',
        message: `Node pool has only ${nodePool.initialNodeCount} nodes. Consider increasing for better availability.`
      });
    }
  }
  
  // Check cluster autoscaling
  if (!cluster.autoscaling?.enableNodeAutoprovisioning) {
    findings.push({
      type: 'no_autoscaling',
      cluster: cluster.name,
      status: 'warning',
      message: 'Node auto-provisioning is not enabled. Consider enabling it for better resource management.'
    });
  }
  
  // Check vertical pod autoscaling
  if (!cluster.verticalPodAutoscaling?.enabled) {
    findings.push({
      type: 'no_vertical_autoscaling',
      cluster: cluster.name,
      status: 'warning',
      message: 'Vertical pod autoscaling is not enabled. Consider enabling it for better resource utilization.'
    });
  }
  
  // Check resource quotas
  if (!cluster.resourceUsageExportConfig) {
    findings.push({
      type: 'no_resource_export',
      cluster: cluster.name,
      status: 'warning',
      message: 'Resource usage export is not configured. Consider enabling it for better resource tracking.'
    });
  }
  
  // Check node auto-provisioning
  if (!cluster.autoscaling?.enableNodeAutoprovisioning) {
    findings.push({
      type: 'no_node_autoprovisioning',
      cluster: cluster.name,
      status: 'warning',
      message: 'Node auto-provisioning is not enabled. Consider enabling it for better resource management.'
    });
  }
  
  // Check cluster resource utilization
  try {
    const utilization = await getClusterUtilization(authClient, projectId, cluster);
    if (utilization.cpu < 30) {
      findings.push({
        type: 'low_cluster_utilization',
        cluster: cluster.name,
        status: 'warning',
        message: `Low cluster CPU utilization: ${utilization.cpu}%`
      });
    }
    if (utilization.memory < 30) {
      findings.push({
        type: 'low_cluster_memory',
        cluster: cluster.name,
        status: 'warning',
        message: `Low cluster memory utilization: ${utilization.memory}%`
      });
    }
  } catch (error) {
    console.error(`Error getting utilization metrics for cluster ${cluster.name}:`, error);
  }
  
  // Mark these as not implemented due to API limitations
  findings.push({
    type: 'pod_disruption_budgets',
    cluster: cluster.name,
    status: 'not_implemented',
    message: 'Pod disruption budgets check not implemented due to API limitations'
  });
  
  findings.push({
    type: 'cost_optimized_node_pools',
    cluster: cluster.name,
    status: 'not_implemented',
    message: 'Cost-optimized node pools check not implemented due to API limitations'
  });
  
  findings.push({
    type: 'workload_right_sizing',
    cluster: cluster.name,
    status: 'not_implemented',
    message: 'GKE workload right-sizing check not implemented due to API limitations'
  });
  
  findings.push({
    type: 'idle_node_pool_detection',
    cluster: cluster.name,
    status: 'not_implemented',
    message: 'GKE idle node pool detection not implemented due to API limitations'
  });
  
  return findings;
}

async function getClusterUtilization(authClient, projectId, cluster) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const [cpuResponse, memoryResponse] = await Promise.all([
    google.monitoring('v3').projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type = "container.googleapis.com/cluster/cpu/core_usage" AND resource.labels.cluster_name = "${cluster.name}"`,
      interval: {
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString()
      }
    }),
    google.monitoring('v3').projects.timeSeries.list({
      auth: authClient,
      name: `projects/${projectId}`,
      filter: `metric.type = "container.googleapis.com/cluster/memory/used_bytes" AND resource.labels.cluster_name = "${cluster.name}"`,
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
  runGkeAudit()
    .then(results => {
      console.log('GKE audit completed. Results:', JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('Error running GKE audit:', error);
      process.exit(1);
    });
}

module.exports = {
  runGkeAudit
};
