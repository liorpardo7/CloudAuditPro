const { BaseValidator } = require('./base-validator');

class StorageValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting storage validation...\n');

    // List all buckets
    await this.validateCheck('Storage', 'ListAllBuckets', async () => {
      const response = await this.storage.buckets.list({
        project: this.projectId
      });
      return response.data;
    });

    // Check bucket security
    await this.validateCheck('Storage', 'CheckBucketSecurity', async () => {
      const buckets = await this.storage.buckets.list({
        project: this.projectId
      });

      const securityResults = {};
      for (const bucket of buckets.data.items || []) {
        try {
          const policy = await this.storage.buckets.getIamPolicy({
            bucket: bucket.name
          });
          securityResults[bucket.name] = policy.data;
        } catch (error) {
          console.warn(`Warning: Could not check security for bucket ${bucket.name}: ${error.message}`);
        }
      }
      return securityResults;
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new StorageValidator();
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

module.exports = StorageValidator; 