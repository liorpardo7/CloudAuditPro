const { BaseValidator } = require('./base-validator');

class DevOpsValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting DevOps validation...\n');

    // Check Cloud Build configurations
    await this.validateCheck('DevOps.CICD', 'ListBuildConfigurations', async () => {
      const response = await this.cloudbuild.projects.builds.list({
        projectId: this.projectId
      });
      return response.data;
    });

    // Check monitoring dashboards
    await this.validateCheck('DevOps.Monitoring', 'ListMonitoringDashboards', async () => {
      const response = await this.monitoringDashboards.projects.dashboards.list({
        parent: `projects/${this.projectId}`
      });
      return response.data;
    });

    // Check alert policies
    await this.validateCheck('DevOps.Monitoring', 'ListAlertPolicies', async () => {
      const response = await this.monitoring.projects.alertPolicies.list({
        name: `projects/${this.projectId}`
      });
      return response.data;
    });

    // Check logging sinks
    await this.validateCheck('DevOps.Logging', 'ListLoggingSinks', async () => {
      const response = await this.logging.projects.sinks.list({
        parent: `projects/${this.projectId}`
      });
      return response.data;
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new DevOpsValidator();
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

module.exports = DevOpsValidator; 