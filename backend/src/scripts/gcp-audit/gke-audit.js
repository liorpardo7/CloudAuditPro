const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const container = google.container({ version: 'v1', auth: authClient });
    const findings = [];
    const errors = [];
    // List all GKE clusters
    console.log('Starting GKE cluster audit...');
    const clusters = await listAllClusters(container, projectId);
    // Analyze each cluster
    for (const cluster of clusters) {
      const clusterFindings = await analyzeCluster(cluster);
      findings.push(...clusterFindings);
    }
    // Generate summary
    const summary = {
      totalClusters: clusters.length,
      findings: findings.length,
      errors: errors.length
    };
    await writeAuditResults('gke-audit', findings, summary, errors, projectId);
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

async function listAllClusters(container, projectId) {
  const clusters = [];
  let pageToken;
  do {
    const response = await container.projects.locations.clusters.list({
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

async function analyzeCluster(cluster) {
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
  for (const nodePool of cluster.nodePools || []) {
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
      type: 'no_resource_quota',
      cluster: cluster.name,
      status: 'warning',
      message: 'Resource usage export is not configured.'
    });
  }
  return findings;
}

module.exports = { run };
