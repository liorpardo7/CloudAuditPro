const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');
const fs = require('fs');
const path = require('path');

class ResourceUtilizationAudit extends BaseValidator {
  constructor(authClient, projectId) {
    super();
    this.authClient = authClient;
    this.projectId = projectId;
    this.compute = google.compute({ version: 'v1', auth: this.authClient });
    this.monitoring = google.monitoring({ version: 'v3', auth: this.authClient });
    this.sql = google.sqladmin({ version: 'v1beta4', auth: this.authClient });
    this.container = google.container({ version: 'v1', auth: this.authClient });
  }

  async auditAll() {
    console.log('Starting resource utilization audit...\n');
    const results = {
      timestamp: new Date().toISOString(),
      projectId: this.projectId,
      resourceUtilization: {
        computeEngine: {
          vms: [],
          persistentDisks: [],
          loadBalancers: [],
          unusedIPs: []
        },
        cloudSQL: {
          instances: []
        },
        gke: {
          clusters: [],
          nodes: []
        }
      },
      idleVMs: [],
      idleDisks: [],
      idleDatabases: [],
      recommendations: []
    };
    // Audit Compute Engine resources
    const computeResult = await this.auditComputeEngine(results, this.projectId);
    // Audit Cloud SQL instances
    await this.auditCloudSQL(results, this.projectId);
    // Audit GKE resources
    await this.auditGKE(results, this.projectId);
    // Write results
    await writeAuditResults('resource-utilization-audit', computeResult.findings, computeResult.summary, computeResult.errors, this.projectId);
    return results;
  }

  async auditComputeEngine(results, projectId) {
    const findings = [];
    const errors = [];
    const summary = {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      costSavingsPotential: 0
    };
    const metrics = [];
    try {
      const project = projectId;
      // Get all regions
      const regionsResponse = await this.compute.regions.list({ project });
      const regions = regionsResponse.data.items.map(region => region.name);
      for (const region of regions) {
        const zonesResponse = await this.compute.zones.list({ project, filter: `region eq .*${region}` });
        for (const zone of zonesResponse.data.items) {
          // Get VM instances
          const instancesResponse = await this.compute.instances.list({ project, zone: zone.name });
          if (instancesResponse.data.items) {
            for (const instance of instancesResponse.data.items) {
              if (instance.status !== 'RUNNING') continue;
              const cpuFilter = `metric.type="compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id="${instance.id}"`;
              const memoryFilter = `metric.type="compute.googleapis.com/instance/memory/balloon/ram_used" AND resource.labels.instance_id="${instance.id}"`;
              const diskFilter = `metric.type="compute.googleapis.com/instance/disk/read_bytes_count" AND resource.labels.instance_id="${instance.id}"`;
              const [cpuData, memoryData, diskData] = await Promise.all([
                this.getMetricData('compute.googleapis.com/instance/cpu/utilization', instance.id),
                this.getMetricData('compute.googleapis.com/instance/memory/balloon/ram_used', instance.id),
                this.getMetricData('compute.googleapis.com/instance/disk/read_bytes_count', instance.id)
              ]);
              const cpuUtilization = cpuData.map(ts => ts.points.map(p => p.value.doubleValue)).flat();
              const memoryUtilization = memoryData.map(ts => ts.points.map(p => p.value.doubleValue)).flat();
              const diskIO = diskData.map(ts => ts.points.map(p => p.value.doubleValue)).flat();
              const avgCpu = cpuUtilization.length ? cpuUtilization.reduce((a, b) => a + b, 0) / cpuUtilization.length : 0;
              const avgMemory = memoryUtilization.length ? memoryUtilization.reduce((a, b) => a + b, 0) / memoryUtilization.length : 0;
              findings.push({
                resourceType: 'compute',
                resourceId: instance.id,
                name: instance.name,
                zone: zone.name,
                machineType: instance.machineType,
                status: instance.status,
                utilization: {
                  cpu: avgCpu,
                  memory: avgMemory,
                  diskIO: diskIO.length ? diskIO.reduce((a, b) => a + b, 0) / diskIO.length : 0
                },
                recommendations: this.generateRecommendations(avgCpu, avgMemory, instance.machineType),
                projectId
              });
              summary.totalChecks++;
              if (avgCpu < 0.3 || avgMemory < 0.3) {
                summary.failed++;
                summary.costSavingsPotential += this.estimateCostSavings(instance.machineType);
              } else {
                summary.passed++;
              }
              results.resourceUtilization.computeEngine.vms.push({
                name: instance.name,
                zone: zone.name,
                cpuUtilization: avgCpu,
                memoryUtilization: avgMemory,
                diskIO: diskIO.length ? diskIO.reduce((a, b) => a + b, 0) / diskIO.length : 0,
                machineType: instance.machineType,
                status: instance.status
              });
              metrics.push({
                resourceType: 'compute',
                resourceId: instance.id,
                name: instance.name,
                zone: zone.name,
                cpuUtilization: avgCpu,
                memoryUtilization: avgMemory,
                diskIO: diskIO.length ? diskIO.reduce((a, b) => a + b, 0) / diskIO.length : 0
              });
            }
          }
          // Get persistent disks
          const disksResponse = await this.compute.disks.list({ project, zone: zone.name });
          if (disksResponse.data.items) {
            for (const disk of disksResponse.data.items) {
              const diskIO = await this.getMetricData('compute.googleapis.com/instance/disk/read_bytes_count', disk.id);
              results.resourceUtilization.computeEngine.persistentDisks.push({
                name: disk.name,
                zone: zone.name,
                size: disk.sizeGb,
                diskIO,
                status: disk.status
              });
              metrics.push({
                resourceType: 'compute',
                resourceId: disk.id,
                name: disk.name,
                zone: zone.name,
                diskIO: diskIO.length ? diskIO.reduce((a, b) => a + b, 0) / diskIO.length : 0
              });
            }
          }
        }
      }
      // Get load balancers
      const loadBalancersResponse = await this.compute.forwardingRules.list({ project });
      if (loadBalancersResponse.data.items) {
        for (const lb of loadBalancersResponse.data.items) {
          const traffic = await this.getMetricData('compute.googleapis.com/instance/network/received_bytes_count', lb.id);
          results.resourceUtilization.computeEngine.loadBalancers.push({
            name: lb.name,
            region: lb.region,
            traffic,
            status: lb.status
          });
          metrics.push({
            resourceType: 'compute',
            resourceId: lb.id,
            name: lb.name,
            region: lb.region,
            traffic: traffic.length ? traffic.reduce((a, b) => a + b, 0) / traffic.length : 0
          });
        }
      }
      // Get unused IPs
      const addressesResponse = await this.compute.addresses.list({ project });
      if (addressesResponse.data.items) {
        for (const ip of addressesResponse.data.items) {
          if (!ip.users) {
            results.resourceUtilization.computeEngine.unusedIPs.push({
              name: ip.name,
              region: ip.region,
              address: ip.address
            });
            metrics.push({
              resourceType: 'compute',
              resourceId: ip.id,
              name: ip.name,
              region: ip.region,
              address: ip.address
            });
          }
        }
      }
      return { findings, errors, summary, metrics };
    } catch (error) {
      errors.push({ error: error.message });
      findings.push({
        status: 'ERROR',
        severity: 'ERROR',
        description: `Error auditing Compute Engine: ${error.message}`,
        projectId
      });
      return { findings, errors, summary, metrics };
    }
  }

  async auditCloudSQL(results, projectId) {
    try {
      // Get all Cloud SQL instances
      const instancesResponse = await this.sql.instances.list({
        project: projectId
      });

      if (instancesResponse.data.items) {
        for (const instance of instancesResponse.data.items) {
          // Get CPU utilization
          const cpuUtilization = await this.getMetricData(
            'cloudsql.googleapis.com/database/cpu/utilization',
            instance.name
          );

          // Get memory utilization
          const memoryUtilization = await this.getMetricData(
            'cloudsql.googleapis.com/database/memory/utilization',
            instance.name
          );

          // Get disk utilization
          const diskUtilization = await this.getMetricData(
            'cloudsql.googleapis.com/database/disk/utilization',
            instance.name
          );

          results.resourceUtilization.cloudSQL.instances.push({
            name: instance.name,
            region: instance.region,
            cpuUtilization,
            memoryUtilization,
            diskUtilization,
            state: instance.state
          });
        }
      }
    } catch (error) {
      console.error('Error auditing Cloud SQL instances:', error);
      results.recommendations.push({
        category: 'Resource Utilization',
        issue: 'Failed to audit Cloud SQL instances',
        recommendation: 'Check API permissions and try again',
        error: error.message
      });
    }
  }

  async auditGKE(results, projectId) {
    try {
      // Get all GKE clusters
      const clustersResponse = await this.container.projects.locations.clusters.list({
        parent: `projects/${projectId}/locations/-`
      });

      if (!clustersResponse.data.clusters || clustersResponse.data.clusters.length === 0) {
        console.log('No GKE clusters found in the project');
        return;
      }

      for (const cluster of clustersResponse.data.clusters) {
        try {
          // Get node pool information
          const nodePoolsResponse = await this.container.projects.locations.clusters.nodePools.list({
            parent: `projects/${projectId}/locations/${cluster.location}/clusters/${cluster.name}`
          });

          const nodes = [];
          if (nodePoolsResponse.data.nodePools) {
            for (const nodePool of nodePoolsResponse.data.nodePools) {
              // Get node metrics
              const cpuUtilization = await this.getMetricData(
                'container.googleapis.com/node/cpu/core_usage_time',
                nodePool.name
              );

              const memoryUtilization = await this.getMetricData(
                'container.googleapis.com/node/memory/used_bytes',
                nodePool.name
              );

              nodes.push({
                name: nodePool.name,
                cpuUtilization,
                memoryUtilization,
                nodeCount: nodePool.initialNodeCount,
                status: nodePool.status
              });
            }
          }

          results.resourceUtilization.gke.clusters.push({
            name: cluster.name,
            location: cluster.location,
            nodes,
            status: cluster.status
          });
        } catch (error) {
          console.error(`Error auditing GKE cluster ${cluster.name}:`, error.message);
          results.recommendations.push({
            category: 'Resource Utilization',
            issue: `Failed to audit GKE cluster ${cluster.name}`,
            recommendation: 'Check API permissions and cluster status',
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error auditing GKE resources:', error);
      results.recommendations.push({
        category: 'Resource Utilization',
        issue: 'Failed to audit GKE resources',
        recommendation: 'Check API permissions and try again',
        error: error.message
      });
    }
  }

  async getMetricData(metricType, resourceId) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    try {
      // Determine the correct label key based on the metric type
      let labelKey = 'instance_id';
      if (metricType.startsWith('cloudsql.googleapis.com')) {
        labelKey = 'database_id';
      } else if (metricType.startsWith('container.googleapis.com')) {
        labelKey = 'node_name';
      }
      const filter = `metric.type = "${metricType}" AND resource.labels.${labelKey} = "${resourceId}"`;
      const request = {
        name: `projects/${process.env.GCP_PROJECT_ID || 'dba-inventory-services-prod'}`,
        filter: filter,
        'interval.startTime': oneHourAgo.toISOString(),
        'interval.endTime': now.toISOString(),
        'aggregation.alignmentPeriod': '3600s',
        'aggregation.perSeriesAligner': 'ALIGN_MEAN'
      };
      const response = await this.monitoring.projects.timeSeries.list({
        name: `projects/${this.projectId}`,
        filter: request.filter,
        'interval.startTime': request.startTime,
        'interval.endTime': request.endTime
      });
      return response.data.timeSeries || [];
    } catch (error) {
      console.error(`Error getting metric data for ${metricType} and resourceId ${resourceId}:`, error.message);
      return [];
    }
  }

  generateRecommendations(cpu, memory, machineType) {
    const recommendations = [];
    if (cpu < 0.3) {
      recommendations.push('Consider downsizing CPU resources');
    }
    if (memory < 0.3) {
      recommendations.push('Consider reducing memory allocation');
    }
    return recommendations;
  }

  estimateCostSavings(machineType) {
    // This is a simplified estimation - you may want to implement a more accurate calculation
    return 100; // Example: $100 potential savings
  }
}

async function run(projectId, tokens) {
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials(tokens);
  const audit = new ResourceUtilizationAudit(authClient, projectId);
  const results = await audit.auditAll();
  return results;
}

module.exports = { run };
