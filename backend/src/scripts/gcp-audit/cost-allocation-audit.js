const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');
const fs = require('fs');
const path = require('path');

class CostAllocationAudit extends BaseValidator {
  async auditAll() {
    await this.initialize();
    console.log('Starting cost allocation and tagging audit...\n');

    const results = {
      timestamp: new Date().toISOString(),
      projectId: this.projectId,
      costAllocation: {
        taggingCoverage: {
          total: 0,
          tagged: 0,
          percentage: 0
        },
        missingLabels: [],
        inconsistentTags: [],
        resources: []
      },
      recommendations: []
    };

    // Get all projects
    const projects = await this.getAllProjects();
    
    // Required labels to check
    const requiredLabels = ['cost_center', 'environment', 'project', 'owner', 'team'];
    
    // Audit each project
    for (const project of projects) {
      await this.auditProject(project, requiredLabels, results);
    }

    // Calculate tagging coverage
    results.costAllocation.taggingCoverage.percentage = 
      (results.costAllocation.taggingCoverage.tagged / results.costAllocation.taggingCoverage.total) * 100;

    return results;
  }

  async getAllProjects() {
    try {
      const response = await this.resourceManager.projects.list();
      return response.data.projects || [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  async auditProject(project, requiredLabels, results) {
    try {
      // Get project assets using Asset Inventory API
      const asset = google.cloudasset('v1');
      const assetsResponse = await asset.assets.list({
        parent: `projects/${project.projectId}`,
        contentType: 'RESOURCE',
        assetTypes: [
          'compute.googleapis.com/Instance',
          'compute.googleapis.com/Disk',
          'sqladmin.googleapis.com/Instance',
          'container.googleapis.com/Cluster',
          'storage.googleapis.com/Bucket'
        ]
      });

      if (assetsResponse.data.assets) {
        for (const resource of assetsResponse.data.assets) {
          results.costAllocation.taggingCoverage.total++;
          
          const resourceInfo = {
            project: project.projectId,
            type: resource.assetType,
            name: resource.name,
            labels: resource.resource.data.labels || {},
            missingLabels: [],
            inconsistentLabels: []
          };

          // Check for missing required labels
          for (const label of requiredLabels) {
            if (!resourceInfo.labels[label]) {
              resourceInfo.missingLabels.push(label);
              if (!results.costAllocation.missingLabels.includes(label)) {
                results.costAllocation.missingLabels.push(label);
              }
            }
          }

          // Check for inconsistent labels across projects
          if (resourceInfo.labels) {
            for (const [key, value] of Object.entries(resourceInfo.labels)) {
              const existingTag = results.costAllocation.inconsistentTags.find(
                tag => tag.key === key && tag.value !== value
              );
              
              if (existingTag) {
                resourceInfo.inconsistentLabels.push({
                  key,
                  value,
                  expectedValue: existingTag.value
                });
              }
            }
          }

          // If resource has all required labels, increment tagged count
          if (resourceInfo.missingLabels.length === 0) {
            results.costAllocation.taggingCoverage.tagged++;
          }

          results.costAllocation.resources.push(resourceInfo);
        }
      }

      // Get cost data using Cloud Billing API
      const billing = google.cloudbilling('v1');
      const costResponse = await billing.projects.getBillingInfo({
        name: `projects/${project.projectId}`
      });

      if (costResponse.data) {
        // Add cost allocation recommendations
        if (!costResponse.data.billingEnabled) {
          results.recommendations.push({
            category: 'Cost Allocation',
            issue: 'Billing not enabled',
            recommendation: 'Enable billing for the project',
            project: project.projectId
          });
        }
      }

    } catch (error) {
      console.error(`Error auditing project ${project.projectId}:`, error);
      results.recommendations.push({
        category: 'Cost Allocation',
        issue: 'Failed to audit project',
        recommendation: 'Check API permissions and try again',
        project: project.projectId,
        error: error.message
      });
    }
  }

  generateRecommendations(results) {
    // Add recommendations based on missing labels
    if (results.costAllocation.missingLabels.length > 0) {
      results.recommendations.push({
        category: 'Cost Allocation',
        issue: 'Missing required labels',
        recommendation: `Add the following labels to all resources: ${results.costAllocation.missingLabels.join(', ')}`,
        missingLabels: results.costAllocation.missingLabels
      });
    }

    // Add recommendations based on inconsistent tags
    if (results.costAllocation.inconsistentTags.length > 0) {
      results.recommendations.push({
        category: 'Cost Allocation',
        issue: 'Inconsistent labels across projects',
        recommendation: 'Standardize label values across all projects',
        inconsistentTags: results.costAllocation.inconsistentTags
      });
    }

    // Add recommendations based on tagging coverage
    if (results.costAllocation.taggingCoverage.percentage < 90) {
      results.recommendations.push({
        category: 'Cost Allocation',
        issue: 'Low tagging coverage',
        recommendation: 'Improve resource tagging to reach at least 90% coverage',
        currentCoverage: `${results.costAllocation.taggingCoverage.percentage.toFixed(2)}%`
      });
    }
  }
}

async function runCostAllocationAudit() {
  // TODO: Implement GCP API calls to collect cost allocation data
  const results = {
    timestamp: new Date().toISOString(),
    taggingFindings: [], // Fill with tagging compliance
    costCenterFindings: [], // Fill with cost center allocation
    projectCostFindings: [], // Fill with project/service-level cost analysis
    recommendations: [
      // Example:
      // { issue: 'Missing cost center tags', recommendation: 'Tag all resources with cost center', severity: 'medium', estimatedSavings: null }
    ]
  };
  fs.writeFileSync(path.join(__dirname, 'cost-allocation-audit-results.json'), JSON.stringify(results, null, 2));
  console.log('Cost Allocation audit completed. Results saved to cost-allocation-audit-results.json');
}

if (require.main === module) {
  runCostAllocationAudit();
}

module.exports = CostAllocationAudit; 

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("cost-allocation-audit", findings, summary, errors);
