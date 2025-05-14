const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');

class BudgetAudit extends BaseValidator {
  async auditAll() {
    await this.initialize();
    console.log('Starting budget and forecasting audit...\n');

    const results = {
      timestamp: new Date().toISOString(),
      projectId: this.projectId,
      budgetSettings: {
        budgets: [],
        forecasts: [],
        alerts: [],
        thresholds: []
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
      // Get budget information using Billing Budgets API
      const billingbudgets = google.billingbudgets('v1');
      const budgetsResponse = await billingbudgets.billingAccounts.budgets.list({
        parent: `billingAccounts/${project.billingAccountName}`
      });

      if (budgetsResponse.data.budgets) {
        for (const budget of budgetsResponse.data.budgets) {
          const budgetInfo = {
            project: project.projectId,
            name: budget.name,
            amount: budget.amount,
            thresholdRules: budget.thresholdRules || [],
            notifications: budget.notifications || [],
            forecastSettings: budget.forecastSettings || {}
          };

          // Check if budget has forecast enabled
          if (!budgetInfo.forecastSettings.enabled) {
            results.recommendations.push({
              category: 'Budget',
              issue: 'Forecasting not enabled',
              recommendation: 'Enable cost forecasting for better budget planning',
              project: project.projectId,
              budget: budget.name
            });
          }

          // Check threshold rules
          if (budgetInfo.thresholdRules.length === 0) {
            results.recommendations.push({
              category: 'Budget',
              issue: 'No threshold rules configured',
              recommendation: 'Configure budget threshold rules to monitor spending',
              project: project.projectId,
              budget: budget.name
            });
          }

          // Check notifications
          if (budgetInfo.notifications.length === 0) {
            results.recommendations.push({
              category: 'Budget',
              issue: 'No notifications configured',
              recommendation: 'Configure budget notifications to alert on spending',
              project: project.projectId,
              budget: budget.name
            });
          }

          results.budgetSettings.budgets.push(budgetInfo);
        }
      } else {
        results.recommendations.push({
          category: 'Budget',
          issue: 'No budgets configured',
          recommendation: 'Create a budget to track project spending',
          project: project.projectId
        });
      }

      // Get cost data using Cloud Billing API
      const billing = google.cloudbilling('v1');
      const costResponse = await billing.projects.getBillingInfo({
        name: `projects/${project.projectId}`
      });

      if (costResponse.data) {
        // Get cost data for the last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const costDataResponse = await billing.projects.getCostData({
          name: `projects/${project.projectId}`,
          interval: {
            startTime: thirtyDaysAgo.toISOString(),
            endTime: now.toISOString()
          }
        });

        if (costDataResponse.data) {
          // Analyze cost trends
          const costTrend = this.analyzeCostTrend(costDataResponse.data);
          
          // Add forecast based on trend
          results.budgetSettings.forecasts.push({
            project: project.projectId,
            trend: costTrend,
            forecastedAmount: this.calculateForecast(costTrend)
          });
        }
      }

    } catch (error) {
      console.error(`Error auditing project ${project.projectId}:`, error);
      results.recommendations.push({
        category: 'Budget',
        issue: 'Failed to audit project',
        recommendation: 'Check API permissions and try again',
        project: project.projectId,
        error: error.message
      });
    }
  }

  analyzeCostTrend(costData) {
    // Implement cost trend analysis
    // This is a simplified version - in production, you'd want more sophisticated analysis
    const dailyCosts = costData.costs || [];
    if (dailyCosts.length < 2) return 'insufficient_data';

    const firstCost = dailyCosts[0].amount;
    const lastCost = dailyCosts[dailyCosts.length - 1].amount;
    const percentChange = ((lastCost - firstCost) / firstCost) * 100;

    if (percentChange > 10) return 'increasing';
    if (percentChange < -10) return 'decreasing';
    return 'stable';
  }

  calculateForecast(trend) {
    // Implement forecast calculation
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

  generateRecommendations(results) {
    // Add recommendations based on budget settings
    const projectsWithoutBudgets = results.recommendations.filter(
      r => r.category === 'Budget' && r.issue === 'No budgets configured'
    );

    if (projectsWithoutBudgets.length > 0) {
      results.recommendations.push({
        category: 'Budget',
        issue: 'Multiple projects without budgets',
        recommendation: 'Create budgets for all projects to track spending',
        affectedProjects: projectsWithoutBudgets.map(r => r.project)
      });
    }

    // Add recommendations based on forecasts
    const increasingCosts = results.budgetSettings.forecasts.filter(
      f => f.trend === 'increasing'
    );

    if (increasingCosts.length > 0) {
      results.recommendations.push({
        category: 'Budget',
        issue: 'Increasing costs detected',
        recommendation: 'Review and optimize resource usage in projects with increasing costs',
        affectedProjects: increasingCosts.map(f => f.project)
      });
    }
  }
}

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  (async () => {
    const audit = new BudgetAudit();
    const results = await audit.auditAll();
    const resultsPath = path.join(__dirname, 'budget-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Budget Audit completed. Results written to', resultsPath);
  })();
}

module.exports = BudgetAudit; 

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("budget-audit", findings, summary, errors);
