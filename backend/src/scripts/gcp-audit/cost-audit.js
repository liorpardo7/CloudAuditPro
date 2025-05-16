const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { getAuthClient, getProjectId } = require('./auth');
const fs = require('fs');
const path = require('path');

// Initialize the necessary API clients
const cloudbilling = google.cloudbilling('v1');
const recommender = google.recommender('v1');
const cloudresourcemanager = google.cloudresourcemanager('v1');
const billingdata = google.cloudbilling('v1beta');

async function auditCostSettings() {
  try {
    console.log('Starting cost audit...');
    const auth = await getAuthClient();
    const projectId = await getProjectId();
    
    console.log('Using project ID:', projectId);
    
    const findings = [];
    const summary = {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      costSavingsPotential: 0
    };
    const errors = [];

    // Get billing account information
    try {
      const projectResponse = await cloudresourcemanager.projects.get({
        projectId,
        auth
      });
      
      if (projectResponse.data.billingAccountName) {
        const billingResponse = await cloudbilling.billingAccounts.get({
          name: projectResponse.data.billingAccountName,
          auth
        });
        
        findings.push({
          category: 'Billing',
          check: 'Billing Account Configuration',
          status: 'PASS',
          details: {
            billingAccountId: billingResponse.data.name,
            displayName: billingResponse.data.displayName,
            open: billingResponse.data.open
          }
        });
        summary.passed++;
      } else {
        findings.push({
          category: 'Billing',
          check: 'Billing Account Configuration',
          status: 'FAIL',
          details: {
            issue: 'No billing account linked',
            recommendation: 'Link a billing account to the project'
          }
        });
        summary.failed++;
      }
    } catch (error) {
      console.error('Error getting billing account:', error.message);
      errors.push({
        category: 'Billing',
        message: 'Failed to retrieve billing account information',
        error: error.message
      });
    }

    // Get cost data for the last 30 days
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const costResponse = await billingdata.projects.getCosts({
        name: `projects/${projectId}`,
        auth,
        requestBody: {
          interval: {
            startTime: thirtyDaysAgo.toISOString(),
            endTime: now.toISOString()
          },
          groupBy: ['SERVICE', 'REGION', 'RESOURCE_TYPE']
        }
      });

      if (costResponse.data) {
        findings.push({
          category: 'Cost',
          check: 'Cost Analysis',
          status: 'PASS',
          details: {
            timeRange: {
              start: thirtyDaysAgo.toISOString(),
              end: now.toISOString()
            },
            costBreakdown: costResponse.data
          }
        });
        summary.passed++;
      }
    } catch (error) {
      console.error('Error getting cost data:', error.message);
      errors.push({
        category: 'Cost',
        message: 'Failed to retrieve cost data',
        error: error.message
      });
    }

    // Get cost recommendations
    try {
      const costRecommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: `projects/${projectId}/locations/-/recommenders/google.compute.commitment.UsageCommitmentRecommender`,
        auth
      });
      
      if (costRecommendationsResponse.data.recommendations) {
        findings.push({
          category: 'Cost',
          check: 'Commitment Recommendations',
          status: 'PASS',
          details: {
            recommendations: costRecommendationsResponse.data.recommendations
          }
        });
        summary.passed++;
      }
    } catch (error) {
      console.error('Error getting commitment recommendations:', error.message);
      errors.push({
        category: 'Cost',
        message: 'Failed to retrieve commitment recommendations',
        error: error.message
      });
    }

    // Get resource recommendations
    try {
      const resourceRecommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: `projects/${projectId}/locations/-/recommenders/google.compute.instance.MachineTypeRecommender`,
        auth
      });
      
      if (resourceRecommendationsResponse.data.recommendations) {
        findings.push({
          category: 'Cost',
          check: 'Resource Recommendations',
          status: 'PASS',
          details: {
            recommendations: resourceRecommendationsResponse.data.recommendations
          }
        });
        summary.passed++;
      }
    } catch (error) {
      console.error('Error getting resource recommendations:', error.message);
      errors.push({
        category: 'Cost',
        message: 'Failed to retrieve resource recommendations',
        error: error.message
      });
    }

    // Get SKU recommendations
    try {
      const skuRecommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: `projects/${projectId}/locations/-/recommenders/google.compute.disk.IdleResourceRecommender`,
        auth
      });
      
      if (skuRecommendationsResponse.data.recommendations) {
        findings.push({
          category: 'Cost',
          check: 'SKU Recommendations',
          status: 'PASS',
          details: {
            recommendations: skuRecommendationsResponse.data.recommendations
          }
        });
        summary.passed++;
      }
    } catch (error) {
      console.error('Error getting SKU recommendations:', error.message);
      errors.push({
        category: 'Cost',
        message: 'Failed to retrieve SKU recommendations',
        error: error.message
      });
    }

    // Calculate total checks
    summary.totalChecks = findings.length;

    // Calculate potential cost savings
    const costSavings = findings
      .filter(f => f.category === 'Cost' && f.details.recommendations)
      .reduce((total, finding) => {
        return total + (finding.details.recommendations.reduce((sum, rec) => {
          return sum + (rec.impact?.costValue?.units || 0);
        }, 0));
      }, 0);
    
    summary.costSavingsPotential = costSavings;

    // Write results
    writeAuditResults("cost-audit", findings, summary, errors);
    console.log('Cost audit completed successfully');
  } catch (error) {
    console.error('Error during cost audit:', error);
    writeAuditResults("cost-audit", [], { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 }, [{
      category: 'System',
      message: 'Failed to complete cost audit',
      error: error.message
    }]);
    throw error;
  }
}

module.exports = {
  auditCostSettings
}; 
