const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');

class ResourceUtilizationAudit extends BaseValidator {
  async auditAll() {
    await this.initialize();
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
      recommendations: []
    };

    // Audit Compute Engine resources
    await this.auditComputeEngine(results);
    
    // Audit Cloud SQL instances
    await this.auditCloudSQL(results);
    
    // Audit GKE resources
    await this.auditGKE(results);

    return results;
  }

  async auditComputeEngine(results) {
    try {
      // Get all regions
      const regionsResponse = await this.compute.regions.list({
        project: this.projectId
      });
      const regions = regionsResponse.data.items.map(region => region.name);

      // Audit VMs and their resources
      for (const region of regions) {
        const zonesResponse = await this.compute.zones.list({
          project: this.projectId,
          filter: `region eq .*${region}`
        });

        for (const zone of zonesResponse.data.items) {
          // Get VM instances
          const instancesResponse = await this.compute.instances.list({
            project: this.projectId,
            zone: zone.name
          });

          if (instancesResponse.data.items) {
            for (const instance of instancesResponse.data.items) {
              // Get CPU utilization
              const cpuUtilization = await this.getMetricData(
                'compute.googleapis.com/instance/cpu/utilization',
                instance.id,
                'instance_id'
              );

              // Get memory utilization
              const memoryUtilization = await this.getMetricData(
                'compute.googleapis.com/instance/memory/balloon/ram_used',
                instance.id,
                'instance_id'
              );

              // Get disk I/O
              const diskIO = await this.getMetricData(
                'compute.googleapis.com/instance/disk/read_bytes_count',
                instance.id,
                'instance_id'
              );

              results.resourceUtilization.computeEngine.vms.push({
                name: instance.name,
                zone: zone.name,
                cpuUtilization,
                memoryUtilization,
                diskIO,
                machineType: instance.machineType,
                status: instance.status
              });
            }
          }

          // Get persistent disks
          const disksResponse = await this.compute.disks.list({
            project: this.projectId,
            zone: zone.name
          });

          if (disksResponse.data.items) {
            for (const disk of disksResponse.data.items) {
              const diskIO = await this.getMetricData(
                'compute.googleapis.com/instance/disk/read_bytes_count',
                disk.id,
                'device_name'
              );

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
      const loadBalancersResponse = await this.compute.forwardingRules.list({
        project: this.projectId
      });

      if (loadBalancersResponse.data.items) {
        for (const lb of loadBalancersResponse.data.items) {
          const traffic = await this.getMetricData(
            'compute.googleapis.com/instance/network/received_bytes_count',
            lb.id,
            'forwarding_rule_id'
          );

          results.resourceUtilization.computeEngine.loadBalancers.push({
            name: lb.name,
            region: lb.region,
            traffic,
            status: lb.status
          });
        }
      }

      // Get unused IPs
      const addressesResponse = await this.compute.addresses.list({
        project: this.projectId
      });

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
    } catch (error) {
      console.error('Error auditing Compute Engine resources:', error);
      results.recommendations.push({
        category: 'Resource Utilization',
        issue: 'Failed to audit Compute Engine resources',
        recommendation: 'Check API permissions and try again',
        error: error.message
      });
    }
  }

  async auditCloudSQL(results) {
    try {
      const sql = google.sqladmin('v1beta4');
      
      // Get all Cloud SQL instances
      const instancesResponse = await sql.instances.list({
        project: this.projectId
      });

      if (instancesResponse.data.items) {
        for (const instance of instancesResponse.data.items) {
          // Get CPU utilization
          const cpuUtilization = await this.getMetricData(
            'cloudsql.googleapis.com/database/cpu/utilization',
            instance.name,
            'database_id'
          );

          // Get memory utilization
          const memoryUtilization = await this.getMetricData(
            'cloudsql.googleapis.com/database/memory/utilization',
            instance.name,
            'database_id'
          );

          // Get disk utilization
          const diskUtilization = await this.getMetricData(
            'cloudsql.googleapis.com/database/disk/utilization',
            instance.name,
            'database_id'
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

  async auditGKE(results) {
    try {
      const container = google.container('v1');
      
      // Get all GKE clusters
      const clustersResponse = await container.projects.locations.clusters.list({
        parent: `projects/${this.projectId}/locations/-`
      });

      if (clustersResponse.data.clusters) {
        for (const cluster of clustersResponse.data.clusters) {
          // Get node pool information
          const nodePoolsResponse = await container.projects.locations.clusters.nodePools.list({
            parent: cluster.name
          });

          const nodes = [];
          if (nodePoolsResponse.data.nodePools) {
            for (const nodePool of nodePoolsResponse.data.nodePools) {
              // Get node metrics
              const cpuUtilization = await this.getMetricData(
                'container.googleapis.com/node/cpu/core_usage_time',
                nodePool.name,
                'node_pool_id'
              );

              const memoryUtilization = await this.getMetricData(
                'container.googleapis.com/node/memory/used_bytes',
                nodePool.name,
                'node_pool_id'
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

  async getMetricData(metricType, resourceId, resourceLabel) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const response = await this.monitoring.projects.timeSeries.list({
        name: `projects/${this.projectId}`,
        filter: `metric.type="${metricType}" AND resource.labels.${resourceLabel}="${resourceId}"`,
        interval: {
          startTime: startTime.toISOString(),
          endTime: now.toISOString()
        },
        aggregation: {
          alignmentPeriod: '3600s',
          perSeriesAligner: 'ALIGN_MEAN'
        }
      });

      return response.data.timeSeries || [];
    } catch (error) {
      console.error(`Error getting metric data for ${metricType}:`, error);
      return [];
    }
  }
}

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  (async () => {
    const audit = new ResourceUtilizationAudit();
    const results = await audit.auditAll();
    const resultsPath = path.join(__dirname, 'resource-utilization-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Resource Utilization Audit completed. Results written to', resultsPath);
  })();
}

module.exports = ResourceUtilizationAudit; 