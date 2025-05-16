const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');
const { getAuthClient, getProjectId } = require('./auth');
const fs = require('fs');
const path = require('path');

class CostAllocationAudit extends BaseValidator {
  async initialize() {
    try {
      console.log('Initializing GCP clients...');
      
      // Get auth client and project ID
      this.authClient = await getAuthClient();
      this.projectId = await getProjectId();
      
      // Initialize API clients with authenticated client
      this.compute = google.compute({ version: 'v1', auth: this.authClient });
      this.monitoring = google.monitoring({ version: 'v3', auth: this.authClient });
      this.monitoringDashboards = google.monitoring({ version: 'v1', auth: this.authClient });
      this.storage = google.storage({ version: 'v1', auth: this.authClient });
      this.securitycenter = google.securitycenter({ version: 'v1', auth: this.authClient });
      this.billing = google.cloudbilling({ version: 'v1', auth: this.authClient });
      this.iam = google.iam({ version: 'v1', auth: this.authClient });
      this.cloudasset = google.cloudasset({ version: 'v1', auth: this.authClient });
      this.container = google.container({ version: 'v1', auth: this.authClient });
      this.dns = google.dns({ version: 'v1', auth: this.authClient });
      this.cloudbuild = google.cloudbuild({ version: 'v1', auth: this.authClient });
      this.logging = google.logging({ version: 'v2', auth: this.authClient });
      this.dlp = google.dlp({ version: 'v2', auth: this.authClient });
      this.cloudresourcemanager = google.cloudresourcemanager({ version: 'v1', auth: this.authClient });
      
      console.log('GCP clients initialized successfully');
    } catch (error) {
      console.error('Error initializing GCP clients:', error);
      throw error;
    }
  }

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

    try {
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

      // Generate recommendations
      this.generateRecommendations(results);

      return results;
    } catch (error) {
      console.error('Error during cost allocation audit:', error);
      throw error;
    }
  }

  async getAllProjects() {
    try {
      const response = await this.cloudresourcemanager.projects.list();
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

if (require.main === module) {
  (async () => {
    try {
      const audit = new CostAllocationAudit();
      const results = await audit.auditAll();
      
      // Save results to JSON file
      const resultsPath = path.join(__dirname, 'cost-allocation-audit-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      
      // Write audit results using the common function
      const findings = results.recommendations.map(rec => ({
        category: rec.category,
        issue: rec.issue,
        recommendation: rec.recommendation,
        severity: 'medium',
        impact: 'Cost allocation and resource management'
      }));
      
      const summary = {
        totalChecks: results.costAllocation.taggingCoverage.total,
        passed: results.costAllocation.taggingCoverage.tagged,
        failed: results.costAllocation.taggingCoverage.total - results.costAllocation.taggingCoverage.tagged,
        costSavingsPotential: 0 // This could be calculated based on recommendations
      };
      
      const errors = results.recommendations
        .filter(rec => rec.error)
        .map(rec => ({
          message: rec.error,
          project: rec.project
        }));
      
      await writeAuditResults("cost-allocation-audit", findings, summary, errors);
      
      console.log('Cost Allocation audit completed successfully.');
      console.log(`Results saved to ${resultsPath}`);
    } catch (error) {
      console.error('Failed to complete cost allocation audit:', error);
      process.exit(1);
    }
  })();
}

module.exports = CostAllocationAudit;
