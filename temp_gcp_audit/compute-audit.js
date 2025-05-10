const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize the Compute API client
const compute = google.compute('v1');
const monitoring = google.monitoring('v1');
const recommender = google.recommender('v1');

async function auditComputeResources() {
  try {
    console.log('Starting compute audit...');
    const results = {
      timestamp: new Date().toISOString(),
      projectId: 'dba-inventory-services-prod',
      computeResources: {
        vms: [],
        gkeClusters: [],
        instanceGroups: [],
        instanceTemplates: [],
        diskSnapshots: [],
        diskImages: [],
        reservations: [],
        commitments: [],
        machineTypes: [],
        utilizationMetrics: []
      },
      recommendations: []
    };

    // Get all regions first
    const regionsResponse = await compute.regions.list({
      project: 'dba-inventory-services-prod'
    });
    const regions = regionsResponse.data.items.map(region => region.name);
    console.log(`Found ${regions.length} regions: ${regions.join(', ')}`);

    // Get machine types for deprecated type checks
    try {
      for (const zone of regionsResponse.data.items.flatMap(region => region.zones)) {
        const machineTypesResponse = await compute.machineTypes.list({
          project: 'dba-inventory-services-prod',
          zone: zone.split('/').pop()
        });
        if (machineTypesResponse.data.items) {
          results.computeResources.machineTypes.push(...machineTypesResponse.data.items);
        }
      }
      console.log(`Found ${results.computeResources.machineTypes.length} machine types`);
    } catch (error) {
      console.error('Error getting machine types:', error.message);
    }

    // Audit VMs
    try {
      for (const region of regions) {
        const zonesResponse = await compute.zones.list({
          project: 'dba-inventory-services-prod',
          filter: `region eq .*${region}`
        });
        
        for (const zone of zonesResponse.data.items) {
          const instancesResponse = await compute.instances.list({
            project: 'dba-inventory-services-prod',
            zone: zone.name
          });
          
          if (instancesResponse.data.items) {
            for (const instance of instancesResponse.data.items) {
              // Get utilization metrics
              try {
                const utilizationResponse = await monitoring.projects.timeSeries.list({
                  name: `projects/dba-inventory-services-prod`,
                  filter: `metric.type="compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id="${instance.id}"`,
                  interval: {
                    startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    endTime: new Date().toISOString()
                  }
                });
                
                results.computeResources.utilizationMetrics.push({
                  instanceId: instance.id,
                  metrics: utilizationResponse.data.timeSeries || []
                });
              } catch (error) {
                console.error(`Error getting utilization metrics for instance ${instance.id}:`, error.message);
              }

              results.computeResources.vms.push({
                ...instance,
                zone: zone.name,
                region: region
              });
            }
          }
        }
      }
      console.log(`Found ${results.computeResources.vms.length} VMs`);
    } catch (error) {
      console.error('Error auditing VMs:', error.message);
      results.recommendations.push({
        category: 'Compute',
        issue: 'Failed to retrieve VM information',
        recommendation: 'Check compute.instances.list permission'
      });
    }

    // Get cost recommendations
    try {
      const recommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: `projects/dba-inventory-services-prod/locations/-/recommenders/google.compute.instance.MachineTypeRecommender`
      });
      results.computeResources.costRecommendations = recommendationsResponse.data.recommendations || [];
      console.log(`Found ${results.computeResources.costRecommendations.length} cost recommendations`);
    } catch (error) {
      console.error('Error getting cost recommendations:', error.message);
    }

    // Audit GKE Clusters
    try {
      const container = google.container('v1');
      const clustersResponse = await container.projects.locations.clusters.list({
        parent: `projects/dba-inventory-services-prod/locations/-`
      });
      results.computeResources.gkeClusters = clustersResponse.data.clusters || [];
      console.log(`Found ${results.computeResources.gkeClusters.length} GKE clusters`);
    } catch (error) {
      console.error('Error auditing GKE clusters:', error.message);
      results.recommendations.push({
        category: 'GKE',
        issue: 'Failed to retrieve GKE cluster information',
        recommendation: 'Check container.clusters.list permission'
      });
    }

    // Audit Instance Groups
    try {
      for (const region of regions) {
        const instanceGroupsResponse = await compute.instanceGroups.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        if (instanceGroupsResponse.data.items) {
          results.computeResources.instanceGroups.push(...instanceGroupsResponse.data.items);
        }
      }
      console.log(`Found ${results.computeResources.instanceGroups.length} instance groups`);
    } catch (error) {
      console.error('Error auditing instance groups:', error.message);
      results.recommendations.push({
        category: 'Compute',
        issue: 'Failed to retrieve instance group information',
        recommendation: 'Check compute.instanceGroups.list permission'
      });
    }

    // Audit Instance Templates
    try {
      const instanceTemplatesResponse = await compute.instanceTemplates.list({
        project: 'dba-inventory-services-prod'
      });
      results.computeResources.instanceTemplates = instanceTemplatesResponse.data.items || [];
      console.log(`Found ${results.computeResources.instanceTemplates.length} instance templates`);
    } catch (error) {
      console.error('Error auditing instance templates:', error.message);
      results.recommendations.push({
        category: 'Compute',
        issue: 'Failed to retrieve instance template information',
        recommendation: 'Check compute.instanceTemplates.list permission'
      });
    }

    // Audit Disk Snapshots
    try {
      for (const region of regions) {
        const snapshotsResponse = await compute.snapshots.list({
          project: 'dba-inventory-services-prod'
        });
        if (snapshotsResponse.data.items) {
          results.computeResources.diskSnapshots.push(...snapshotsResponse.data.items);
        }
      }
      console.log(`Found ${results.computeResources.diskSnapshots.length} disk snapshots`);
    } catch (error) {
      console.error('Error auditing disk snapshots:', error.message);
      results.recommendations.push({
        category: 'Storage',
        issue: 'Failed to retrieve disk snapshot information',
        recommendation: 'Check compute.snapshots.list permission'
      });
    }

    // Audit Disk Images
    try {
      const imagesResponse = await compute.images.list({
        project: 'dba-inventory-services-prod'
      });
      results.computeResources.diskImages = imagesResponse.data.items || [];
      console.log(`Found ${results.computeResources.diskImages.length} disk images`);
    } catch (error) {
      console.error('Error auditing disk images:', error.message);
      results.recommendations.push({
        category: 'Storage',
        issue: 'Failed to retrieve disk image information',
        recommendation: 'Check compute.images.list permission'
      });
    }

    // Generate recommendations
    generateComputeRecommendations(results);

    // Save results
    const resultsPath = path.join(__dirname, 'compute-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Compute audit completed. Results saved to compute-audit-results.json');
  } catch (error) {
    console.error('Error during compute audit:', error);
    throw error;
  }
}

function generateComputeRecommendations(results) {
  // Check VM configurations
  results.computeResources.vms.forEach(vm => {
    // Check for deprecated machine types
    const machineType = results.computeResources.machineTypes.find(
      mt => mt.selfLink === vm.machineType
    );
    if (machineType?.deprecated) {
      results.recommendations.push({
        category: 'Compute',
        issue: 'Deprecated machine type in use',
        recommendation: 'Migrate to a supported machine type',
        resource: vm.name,
        zone: vm.zone,
        machineType: machineType.name
      });
    }

    // Check instance naming conventions
    if (!/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(vm.name)) {
      results.recommendations.push({
        category: 'Compute',
        issue: 'Invalid instance naming convention',
        recommendation: 'Follow GCP naming conventions: lowercase letters, numbers, and hyphens',
        resource: vm.name,
        zone: vm.zone
      });
    }

    // Check CPU and memory utilization
    const utilization = results.computeResources.utilizationMetrics.find(
      um => um.instanceId === vm.id
    );
    if (utilization) {
      const avgUtilization = utilization.metrics.reduce((acc, metric) => {
        const points = metric.points || [];
        const sum = points.reduce((sum, point) => sum + (point.value?.doubleValue || 0), 0);
        return acc + (sum / points.length);
      }, 0) / utilization.metrics.length;

      if (avgUtilization < 0.3) {
        results.recommendations.push({
          category: 'Cost Optimization',
          issue: 'Low CPU utilization',
          recommendation: 'Consider downsizing the instance or using a smaller machine type',
          resource: vm.name,
          zone: vm.zone,
          utilization: `${(avgUtilization * 100).toFixed(2)}%`
        });
      }
    }

    // Check for idle instances during non-business hours
    if (utilization) {
      const businessHours = utilization.metrics.filter(metric => {
        const hour = new Date(metric.points[0]?.interval?.startTime).getHours();
        return hour >= 9 && hour <= 17;
      });
      const nonBusinessHours = utilization.metrics.filter(metric => {
        const hour = new Date(metric.points[0]?.interval?.startTime).getHours();
        return hour < 9 || hour > 17;
      });

      const businessUtilization = businessHours.reduce((acc, metric) => {
        const points = metric.points || [];
        const sum = points.reduce((sum, point) => sum + (point.value?.doubleValue || 0), 0);
        return acc + (sum / points.length);
      }, 0) / businessHours.length;

      const nonBusinessUtilization = nonBusinessHours.reduce((acc, metric) => {
        const points = metric.points || [];
        const sum = points.reduce((sum, point) => sum + (point.value?.doubleValue || 0), 0);
        return acc + (sum / points.length);
      }, 0) / nonBusinessHours.length;

      if (nonBusinessUtilization < 0.1 && businessUtilization > 0.3) {
        results.recommendations.push({
          category: 'Cost Optimization',
          issue: 'Instance idle during non-business hours',
          recommendation: 'Consider using instance scheduling or auto-shutdown during non-business hours',
          resource: vm.name,
          zone: vm.zone,
          businessUtilization: `${(businessUtilization * 100).toFixed(2)}%`,
          nonBusinessUtilization: `${(nonBusinessUtilization * 100).toFixed(2)}%`
        });
      }
    }

    // Enhanced security checks
    if (!vm.shieldedInstanceConfig?.enableSecureBoot) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Secure Boot not enabled',
        recommendation: 'Enable Secure Boot for better security',
        resource: vm.name,
        zone: vm.zone
      });
    }

    if (!vm.shieldedInstanceConfig?.enableVtpm) {
      results.recommendations.push({
        category: 'Security',
        issue: 'vTPM not enabled',
        recommendation: 'Enable vTPM for better security',
        resource: vm.name,
        zone: vm.zone
      });
    }

    if (!vm.shieldedInstanceConfig?.enableIntegrityMonitoring) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Integrity monitoring not enabled',
        recommendation: 'Enable integrity monitoring for better security',
        resource: vm.name,
        zone: vm.zone
      });
    }

    // Check for confidential computing
    if (!vm.confidentialInstanceConfig?.enableConfidentialCompute) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Confidential computing not enabled',
        recommendation: 'Consider enabling confidential computing for sensitive workloads',
        resource: vm.name,
        zone: vm.zone
      });
    }

    // Check VM metadata security
    if (vm.metadata?.items?.some(item => item.key === 'ssh-keys')) {
      results.recommendations.push({
        category: 'Security',
        issue: 'SSH keys in instance metadata',
        recommendation: 'Use OS Login instead of SSH keys in instance metadata',
        resource: vm.name,
        zone: vm.zone
      });
    }

    // Check for sustained use discounts
    if (!vm.scheduling?.automaticRestart) {
      results.recommendations.push({
        category: 'Cost Optimization',
        issue: 'Automatic restart disabled',
        recommendation: 'Enable automatic restart to qualify for sustained use discounts',
        resource: vm.name,
        zone: vm.zone
      });
    }
  });

  // Check GKE cluster configurations
  results.computeResources.gkeClusters.forEach(cluster => {
    // Check for regional vs zonal clusters
    if (!cluster.location.includes('-')) {
      results.recommendations.push({
        category: 'GKE',
        issue: 'Zonal cluster detected',
        recommendation: 'Consider using regional clusters for better availability',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for pod security policies
    if (!cluster.podSecurityPolicyConfig?.enabled) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Pod security policies not enabled',
        recommendation: 'Enable pod security policies for better security',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for container image scanning
    if (!cluster.binaryAuthorization?.enabled) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Binary authorization not enabled',
        recommendation: 'Enable binary authorization for better security',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for cluster security posture
    if (!cluster.securityPostureConfig?.mode) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Security posture not configured',
        recommendation: 'Configure security posture for better security',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for cluster logging and monitoring
    if (!cluster.loggingService || !cluster.monitoringService) {
      results.recommendations.push({
        category: 'Monitoring',
        issue: 'Logging or monitoring not configured',
        recommendation: 'Enable logging and monitoring services',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for node auto-provisioning
    if (!cluster.autoscaling?.enableNodeAutoprovisioning) {
      results.recommendations.push({
        category: 'Cost Optimization',
        issue: 'Node auto-provisioning not enabled',
        recommendation: 'Enable node auto-provisioning for better cost optimization',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for pod disruption budgets
    if (!cluster.podDisruptionBudget) {
      results.recommendations.push({
        category: 'Reliability',
        issue: 'Pod disruption budget not configured',
        recommendation: 'Configure pod disruption budgets for better reliability',
        resource: cluster.name,
        location: cluster.location
      });
    }

    // Check for cost-optimized node pools
    if (!cluster.nodePools?.some(pool => pool.config?.machineType?.includes('e2-'))) {
      results.recommendations.push({
        category: 'Cost Optimization',
        issue: 'No cost-optimized node pools',
        recommendation: 'Consider using E2 machine types for better cost efficiency',
        resource: cluster.name,
        location: cluster.location
      });
    }
  });

  // Check cost recommendations
  results.computeResources.costRecommendations?.forEach(recommendation => {
    results.recommendations.push({
      category: 'Cost Optimization',
      issue: recommendation.content?.operationGroups?.[0]?.operations?.[0]?.resourceType || 'Cost optimization',
      recommendation: recommendation.description,
      resource: recommendation.content?.operationGroups?.[0]?.operations?.[0]?.resource,
      estimatedSavings: recommendation.primaryImpact?.costProjection?.cost?.currencyUnits || 'N/A'
    });
  });
}

// Run the audit if this script is run directly
if (require.main === module) {
  auditComputeResources().catch(error => {
    console.error('Error running compute audit:', error);
    process.exit(1);
  });
}

module.exports = {
  auditComputeResources
}; 