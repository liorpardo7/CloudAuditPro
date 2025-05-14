const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

class ResourceUtilizationAudit extends BaseValidator {
  constructor() {
    super();
    this.compute = google.compute({ version: 'v1', auth: auth.getAuthClient() });
    this.monitoring = google.monitoring({ version: 'v3', auth: auth.getAuthClient() });
    this.sql = google.sqladmin({ version: 'v1beta4', auth: auth.getAuthClient() });
    this.container = google.container({ version: 'v1', auth: auth.getAuthClient() });
  }

  async auditAll() {
    await this.initialize();
    console.log('Starting resource utilization audit...\n');

    const results = {
      timestamp: new Date().toISOString(),
      projectId: auth.getProjectId(),
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
    const computeResult = await this.auditComputeEngine(results, auth.getProjectId());
    // Audit Cloud SQL instances
    await this.auditCloudSQL(results, auth.getProjectId());
    // Audit GKE resources
    await this.auditGKE(results, auth.getProjectId());

    // Write results
    writeAuditResults('resource-utilization-audit', computeResult.findings, computeResult.summary, computeResult.errors, auth.getProjectId());
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
                this.getMetricData(cpuFilter, instance.id),
                this.getMetricData(memoryFilter, instance.id),
                this.getMetricData(diskFilter, instance.id)
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
          }
        }
      }
      return { findings, errors, summary };
    } catch (error) {
      errors.push({ error: error.message });
      findings.push({
        status: 'ERROR',
        severity: 'ERROR',
        description: `Error auditing Compute Engine: ${error.message}`,
        projectId
      });
      return { findings, errors, summary };
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

      if (clustersResponse.data.clusters) {
        for (const cluster of clustersResponse.data.clusters) {
          // Get node pool information
          const nodePoolsResponse = await this.container.projects.locations.clusters.nodePools.list({
            parent: cluster.name
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

  async getMetricData(filter, resourceId) {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime);
      startTime.setHours(startTime.getHours() - 24);
      const response = await this.monitoring.projects.timeSeries.list({
        name: `projects/${process.env.GCP_PROJECT_ID || 'dba-inventory-services-prod'}`,
        filter: filter,
        interval: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        },
        aggregation: {
          alignmentPeriod: '3600s',
          perSeriesAligner: 'ALIGN_MEAN'
        }
      });
      return response.data.timeSeries || [];
    } catch (error) {
      console.error(`Error getting metric data for ${filter}:`, error.message);
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

async function runResourceUtilizationAudit() {
  const audit = new ResourceUtilizationAudit();
  await audit.auditAll();
}

if (require.main === module) {
  runResourceUtilizationAudit().catch(console.error);
}

module.exports = { runResourceUtilizationAudit };
