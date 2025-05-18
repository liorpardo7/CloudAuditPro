const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');

class DiscountAudit extends BaseValidator {
  async auditAll() {
    await this.initialize();
    console.log('Starting discount program evaluation audit...\n');

    const results = {
      timestamp: new Date().toISOString(),
      projectId: this.projectId,
      discountPrograms: {
        commitments: [],
        sustainedUse: [],
        unusedCUDs: [],
        forecasts: []
      },
      recommendations: []
    };

    // Get all projects
    const projects = await this.getAllProjects();
    
    // Audit each project
    for (const project of projects) {
      await this.auditProject(project, results);
    }

    // Generate recommendations
    this.generateRecommendations(results);

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

  async auditProject(project, results) {
    try {
      // Get commitment information
      const compute = google.compute('v1');
      const commitmentsResponse = await compute.regionCommitments.list({
        project: project.projectId
      });

      if (commitmentsResponse.data.items) {
        for (const commitment of commitmentsResponse.data.items) {
          const commitmentInfo = {
            project: project.projectId,
            name: commitment.name,
            type: commitment.type,
            status: commitment.status,
            resources: commitment.resources || [],
            plan: commitment.plan,
            startTime: commitment.startTimestamp,
            endTime: commitment.endTimestamp
          };

          // Check commitment utilization
          const utilization = await this.checkCommitmentUtilization(commitment);
          commitmentInfo.utilization = utilization;

          // Check for unused CUDs
          if (utilization < 0.7) { // Less than 70% utilization
            results.discountPrograms.unusedCUDs.push({
              ...commitmentInfo,
              utilization: `${(utilization * 100).toFixed(2)}%`
            });
          }

          results.discountPrograms.commitments.push(commitmentInfo);
        }
      }

      // Get sustained use discount information
      const billing = google.cloudbilling('v1');
      const sustainedUseResponse = await billing.projects.getBillingInfo({
        name: `projects/${project.projectId}`
      });

      if (sustainedUseResponse.data) {
        const sustainedUseInfo = {
          project: project.projectId,
          enabled: sustainedUseResponse.data.sustainedUseDiscounts || false,
          resources: []
        };

        // Get resource usage for sustained use analysis
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const usageResponse = await billing.projects.getCostData({
          name: `projects/${project.projectId}`,
          interval: {
            startTime: ninetyDaysAgo.toISOString(),
            endTime: now.toISOString()
          }
        });

        if (usageResponse.data) {
          sustainedUseInfo.resources = this.analyzeSustainedUse(usageResponse.data);
        }

        results.discountPrograms.sustainedUse.push(sustainedUseInfo);
      }

      // Generate forecasts
      const forecast = await this.generateForecast(project);
      if (forecast) {
        results.discountPrograms.forecasts.push({
          project: project.projectId,
          ...forecast
        });
      }

    } catch (error) {
      console.error(`Error auditing project ${project.projectId}:`, error);
      results.recommendations.push({
        category: 'Discount Programs',
        issue: 'Failed to audit project',
        recommendation: 'Check API permissions and try again',
        project: project.projectId,
        error: error.message
      });
    }
  }

  async checkCommitmentUtilization(commitment) {
    try {
      const now = new Date();
      const startTime = new Date(commitment.startTimestamp);
      const endTime = new Date(commitment.endTimestamp);

      // Get usage data for the commitment period
      const usageResponse = await this.billing.projects.getCostData({
        name: `projects/${commitment.project}`,
        interval: {
          startTime: startTime.toISOString(),
          endTime: now > endTime ? endTime.toISOString() : now.toISOString()
        }
      });

      if (usageResponse.data) {
        // Calculate utilization based on actual usage vs commitment
        const totalUsage = usageResponse.data.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const commitmentAmount = commitment.resources.reduce((sum, resource) => sum + resource.amount, 0);
        
        return totalUsage / commitmentAmount;
      }

      return 0;
    } catch (error) {
      console.error('Error checking commitment utilization:', error);
      return 0;
    }
  }

  analyzeSustainedUse(usageData) {
    const resources = [];
    const dailyUsage = {};

    // Group usage by resource and day
    usageData.costs.forEach(cost => {
      const resource = cost.resource;
      const date = new Date(cost.timestamp).toISOString().split('T')[0];

      if (!dailyUsage[resource]) {
        dailyUsage[resource] = {};
      }
      if (!dailyUsage[resource][date]) {
        dailyUsage[resource][date] = 0;
      }
      dailyUsage[resource][date] += cost.amount;
    });

    // Analyze sustained use patterns
    for (const [resource, usage] of Object.entries(dailyUsage)) {
      const days = Object.keys(usage).length;
      const totalUsage = Object.values(usage).reduce((sum, amount) => sum + amount, 0);
      const avgUsage = totalUsage / days;

      resources.push({
        name: resource,
        daysActive: days,
        averageUsage: avgUsage,
        totalUsage: totalUsage,
        sustainedUseEligible: days >= 25 // Consider eligible if used 25+ days
      });
    }

    return resources;
  }

  async generateForecast(project) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get historical usage data
      const usageResponse = await this.billing.projects.getCostData({
        name: `projects/${project.projectId}`,
        interval: {
          startTime: thirtyDaysAgo.toISOString(),
          endTime: now.toISOString()
        }
      });

      if (usageResponse.data) {
        // Calculate trend and forecast
        const trend = this.calculateTrend(usageResponse.data.costs);
        const forecast = this.predictFutureUsage(trend);

        return {
          trend,
          forecast,
          confidence: this.calculateConfidence(trend)
        };
      }

      return null;
    } catch (error) {
      console.error('Error generating forecast:', error);
      return null;
    }
  }

  calculateTrend(costs) {
    // Implement trend calculation
    // This is a simplified version - in production, you'd want more sophisticated analysis
    if (costs.length < 2) return 'insufficient_data';

    const firstCost = costs[0].amount;
    const lastCost = costs[costs.length - 1].amount;
    const percentChange = ((lastCost - firstCost) / firstCost) * 100;

    if (percentChange > 10) return 'increasing';
    if (percentChange < -10) return 'decreasing';
    return 'stable';
  }

  predictFutureUsage(trend) {
    // Implement usage prediction
    // This is a simplified version - in production, you'd want more sophisticated forecasting
    switch (trend) {
      case 'increasing':
        return 'high';
      case 'decreasing':
        return 'low';
      case 'stable':
        return 'medium';
      default:
        return 'unknown';
    }
  }

  calculateConfidence(trend) {
    // Implement confidence calculation
    // This is a simplified version - in production, you'd want more sophisticated analysis
    switch (trend) {
      case 'stable':
        return 'high';
      case 'increasing':
      case 'decreasing':
        return 'medium';
      default:
        return 'low';
    }
  }

  generateRecommendations(results) {
    // Add recommendations based on unused CUDs
    if (results.discountPrograms.unusedCUDs.length > 0) {
      results.recommendations.push({
        category: 'Discount Programs',
        issue: 'Underutilized commitments detected',
        recommendation: 'Review and adjust commitment levels to match actual usage',
        affectedResources: results.discountPrograms.unusedCUDs.map(cud => ({
          project: cud.project,
          name: cud.name,
          utilization: cud.utilization
        }))
      });
    }

    // Add recommendations based on sustained use
    const sustainedUseOpportunities = results.discountPrograms.sustainedUse.filter(
      su => !su.enabled && su.resources.some(r => r.sustainedUseEligible)
    );

    if (sustainedUseOpportunities.length > 0) {
      results.recommendations.push({
        category: 'Discount Programs',
        issue: 'Sustained use discount opportunities',
        recommendation: 'Enable sustained use discounts for eligible resources',
        affectedProjects: sustainedUseOpportunities.map(su => su.project)
      });
    }

    // Add recommendations based on forecasts
    const highForecastProjects = results.discountPrograms.forecasts.filter(
      f => f.forecast === 'high' && f.confidence === 'high'
    );

    if (highForecastProjects.length > 0) {
      results.recommendations.push({
        category: 'Discount Programs',
        issue: 'High usage forecast',
        recommendation: 'Consider increasing commitment levels for predicted high usage',
        affectedProjects: highForecastProjects.map(f => f.project)
      });
    }
  }
}

async function run(projectId, tokens) {
      const audit = new DiscountAudit();
  // Set up OAuth2 client
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials(tokens);
  audit.authClient = authClient;
  audit.projectId = projectId;
  // Initialize API clients with OAuth
  // ...
      const results = await audit.auditAll();
  await writeAuditResults('discount-audit', results.discountPrograms.commitments, results.discountPrograms.sustainedUse, results.recommendations, projectId);
  return results;
}

module.exports = { run };
