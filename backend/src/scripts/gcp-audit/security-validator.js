const { BaseValidator } = require('./base-validator');

class SecurityValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting security validation...\n');

    // Check IAM roles
    await this.validateCheck('Security', 'CheckIAMRoles', async () => {
      const response = await this.iam.projects.roles.list({
        parent: `projects/${this.projectId}`
      });
      return response.data;
    });

    // Check service accounts
    await this.validateCheck('Security', 'CheckServiceAccounts', async () => {
      const response = await this.iam.projects.serviceAccounts.list({
        name: `projects/${this.projectId}`
      });
      return response.data;
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new SecurityValidator();
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

module.exports = SecurityValidator; 