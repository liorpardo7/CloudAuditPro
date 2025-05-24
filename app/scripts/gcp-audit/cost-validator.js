const { BaseValidator } = require('./base-validator');

class CostValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting cost validation...\n');

    // Check billing accounts
    await this.validateCheck('Cost', 'CheckBillingAccounts', async () => {
      const response = await this.billing.billingAccounts.list();
      return response.data;
    });

    // Check cost optimization
    await this.validateCheck('Cost', 'CheckCostOptimization', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await this.monitoring.projects.timeSeries.list({
        name: `projects/${this.projectId}`,
        filter: 'metric.type = "compute.googleapis.com/instance/cpu/utilization"',
        'aggregation.alignmentPeriod': '3600s',
        'aggregation.perSeriesAligner': 'ALIGN_MEAN',
        'interval.startTime': sevenDaysAgo.toISOString(),
        'interval.endTime': now.toISOString()
      });

      // Analyze CPU utilization to identify underutilized instances
      const underutilizedInstances = [];
      if (response.data.timeSeries) {
        for (const series of response.data.timeSeries) {
          const instance = series.resource.labels.instance_id;
          const points = series.points || [];
          
          // Calculate average CPU utilization
          let totalUtilization = 0;
          for (const point of points) {
            totalUtilization += point.value.doubleValue || 0;
          }
          const avgUtilization = points.length > 0 ? totalUtilization / points.length : 0;
          
          // If average CPU utilization is less than 10%, consider it underutilized
          if (avgUtilization < 0.1) {
            underutilizedInstances.push({
              instance,
              avgCpuUtilization: avgUtilization * 100
            });
          }
        }
      }

      return {
        underutilizedInstances,
        totalInstances: response.data.timeSeries ? response.data.timeSeries.length : 0
      };
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new CostValidator();
  validator.validateAll()
    .then(results => {
      console.log('\nValidation Summary:');
      console.log(`- Total Checks: ${results.summary.total}`);
      console.log(`- Passed: ${results.summary.passed}`);
      console.log(`- Failed: ${results.summary.failed}`);
      console.log(`- Not Implemented: ${results.summary.notImplemented}`);
      console.log(`- Not Applicable: ${results.summary.notApplicable}`);
    })
    .catch(console.error);
}

module.exports = CostValidator; 