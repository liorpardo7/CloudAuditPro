const { BaseValidator } = require('./base-validator');

class ComputeValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting compute validation...\n');

    // List all VM instances
    await this.validateCheck('Compute.VM', 'ListAllInstances', async () => {
      const response = await this.compute.instances.list({
        project: this.projectId,
        zone: 'us-central1-a'
      });
      return response.data;
    });

    // Check machine types
    await this.validateCheck('Compute.VM', 'CheckMachineTypes', async () => {
      const response = await this.compute.machineTypes.list({
        project: this.projectId,
        zone: 'us-central1-a'
      });
      return response.data;
    });

    // Check for underutilized instances
    await this.validateCheck('Compute.VM', 'CheckUnderutilizedInstances', async () => {
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
      return response.data;
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new ComputeValidator();
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

module.exports = ComputeValidator; 