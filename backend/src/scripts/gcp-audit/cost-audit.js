const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize the necessary API clients
const cloudbilling = google.cloudbilling('v1');
const recommender = google.recommender('v1');
const cloudresourcemanager = google.cloudresourcemanager('v1');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

async function auditCostSettings() {
  try {
    console.log('Starting cost audit...');
    const results = {
      timestamp: new Date().toISOString(),
      projectId: 'dba-inventory-services-prod',
      costSettings: {
        billingAccount: null,
        budgetAlerts: [],
        costRecommendations: [],
        commitmentRecommendations: [],
        resourceRecommendations: [],
        skuRecommendations: [],
        costBreakdown: {
          byService: {},
          byRegion: {},
          byResource: {}
        }
      },
      recommendations: []
    };

    // Get billing account information
    try {
      const projectResponse = await cloudresourcemanager.projects.get({
        projectId: 'dba-inventory-services-prod'
      });
      
      if (projectResponse.data.billingAccountName) {
        const billingResponse = await cloudbilling.billingAccounts.get({
          name: projectResponse.data.billingAccountName
        });
        results.costSettings.billingAccount = billingResponse.data;
        console.log('Retrieved billing account information');
      } else {
        results.recommendations.push({
          category: 'Cost',
          issue: 'No billing account linked',
          recommendation: 'Link a billing account to the project'
        });
      }
    } catch (error) {
      console.error('Error getting billing account:', error.message);
      results.recommendations.push({
        category: 'Cost',
        issue: 'Failed to retrieve billing account information',
        recommendation: 'Check cloudbilling.billingAccounts.get permission'
      });
    }

    // Get cost recommendations
    try {
      const costRecommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: 'projects/dba-inventory-services-prod/locations/-/recommenders/google.compute.commitment.UsageCommitmentRecommender'
      });
      results.costSettings.commitmentRecommendations = costRecommendationsResponse.data.recommendations || [];
      console.log(`Found ${results.costSettings.commitmentRecommendations.length} commitment recommendations`);
    } catch (error) {
      console.error('Error getting commitment recommendations:', error.message);
      results.recommendations.push({
        category: 'Cost',
        issue: 'Failed to retrieve commitment recommendations',
        recommendation: 'Check recommender.recommendations.list permission'
      });
    }

    // Get resource recommendations
    try {
      const resourceRecommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: 'projects/dba-inventory-services-prod/locations/-/recommenders/google.compute.instance.MachineTypeRecommender'
      });
      results.costSettings.resourceRecommendations = resourceRecommendationsResponse.data.recommendations || [];
      console.log(`Found ${results.costSettings.resourceRecommendations.length} resource recommendations`);
    } catch (error) {
      console.error('Error getting resource recommendations:', error.message);
      results.recommendations.push({
        category: 'Cost',
        issue: 'Failed to retrieve resource recommendations',
        recommendation: 'Check recommender.recommendations.list permission'
      });
    }

    // Get SKU recommendations
    try {
      const skuRecommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: 'projects/dba-inventory-services-prod/locations/-/recommenders/google.compute.disk.IdleResourceRecommender'
      });
      results.costSettings.skuRecommendations = skuRecommendationsResponse.data.recommendations || [];
      console.log(`Found ${results.costSettings.skuRecommendations.length} SKU recommendations`);
    } catch (error) {
      console.error('Error getting SKU recommendations:', error.message);
      results.recommendations.push({
        category: 'Cost',
        issue: 'Failed to retrieve SKU recommendations',
        recommendation: 'Check recommender.recommendations.list permission'
      });
    }

    // Generate recommendations
    generateCostRecommendations(results);

    // Save results
    const resultsPath = path.join(__dirname, 'cost-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Cost audit completed. Results saved to cost-audit-results.json');
  } catch (error) {
    console.error('Error during cost audit:', error);
    throw error;
  }
}

function generateCostRecommendations(results) {
  // Check commitment recommendations
  results.costSettings.commitmentRecommendations.forEach(recommendation => {
    if (recommendation.priority === 'P1' || recommendation.priority === 'P2') {
      results.recommendations.push({
        category: 'Cost',
        issue: 'High priority commitment recommendation',
        recommendation: recommendation.description,
        impact: recommendation.impact,
        resource: recommendation.resourceName
      });
    }
  });

  // Check resource recommendations
  results.costSettings.resourceRecommendations.forEach(recommendation => {
    if (recommendation.priority === 'P1' || recommendation.priority === 'P2') {
      results.recommendations.push({
        category: 'Cost',
        issue: 'High priority resource recommendation',
        recommendation: recommendation.description,
        impact: recommendation.impact,
        resource: recommendation.resourceName
      });
    }
  });

  // Check SKU recommendations
  results.costSettings.skuRecommendations.forEach(recommendation => {
    if (recommendation.priority === 'P1' || recommendation.priority === 'P2') {
      results.recommendations.push({
        category: 'Cost',
        issue: 'High priority SKU recommendation',
        recommendation: recommendation.description,
        impact: recommendation.impact,
        resource: recommendation.resourceName
      });
    }
  });

  // Check billing account settings
  if (results.costSettings.billingAccount) {
    const billingAccount = results.costSettings.billingAccount;
    
    // Check for budget alerts
    if (!billingAccount.budgetAlerts || billingAccount.budgetAlerts.length === 0) {
      results.recommendations.push({
        category: 'Cost',
        issue: 'No budget alerts configured',
        recommendation: 'Configure budget alerts to monitor spending'
      });
    }

    // Check for commitment discounts
    if (!billingAccount.commitmentDiscounts || billingAccount.commitmentDiscounts.length === 0) {
      results.recommendations.push({
        category: 'Cost',
        issue: 'No commitment discounts in use',
        recommendation: 'Consider using commitment discounts for predictable workloads'
      });
    }

    // Check for sustained use discounts
    if (!billingAccount.sustainedUseDiscounts || billingAccount.sustainedUseDiscounts.length === 0) {
      results.recommendations.push({
        category: 'Cost',
        issue: 'No sustained use discounts in use',
        recommendation: 'Consider using sustained use discounts for long-running workloads'
      });
    }
  }

  // Check for idle resources
  const idleResources = results.costSettings.resourceRecommendations.filter(
    r => r.description?.includes('idle') || r.description?.includes('underutilized')
  );

  if (idleResources.length > 0) {
    results.recommendations.push({
      category: 'Cost',
      issue: 'Idle or underutilized resources detected',
      recommendation: 'Review and either resize or delete idle resources',
      count: idleResources.length
    });
  }

  // Check for commitment opportunities
  const commitmentOpportunities = results.costSettings.commitmentRecommendations.filter(
    r => r.description?.includes('commitment') || r.description?.includes('reservation')
  );

  if (commitmentOpportunities.length > 0) {
    results.recommendations.push({
      category: 'Cost',
      issue: 'Commitment opportunities available',
      recommendation: 'Consider using commitments for predictable workloads',
      count: commitmentOpportunities.length
    });
  }

  // Check for storage optimization opportunities
  const storageOpportunities = results.costSettings.skuRecommendations.filter(
    r => r.description?.includes('storage') || r.description?.includes('disk')
  );

  if (storageOpportunities.length > 0) {
    results.recommendations.push({
      category: 'Cost',
      issue: 'Storage optimization opportunities available',
      recommendation: 'Review storage configurations for cost optimization',
      count: storageOpportunities.length
    });
  }
}

module.exports = {
  auditCostSettings
}; 

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("cost-audit", findings, summary, errors);
