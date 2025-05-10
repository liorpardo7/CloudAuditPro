const { BaseValidator } = require('./base-validator');

class ComplianceValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting compliance validation...\n');

    // Check DLP inspection templates
    await this.validateCheck('Compliance.DataProtection', 'CheckDLPTemplates', async () => {
      const response = await this.dlp.projects.inspectTemplates.list({
        parent: `projects/${this.projectId}`
      });
      return response.data;
    });

    // Check security findings using new Security Command Center API
    await this.validateCheck('Compliance.Security', 'CheckSecurityFindings', async () => {
      try {
        // First try to get the organization ID
        const response = await this.cloudresourcemanager.projects.get({
          projectId: this.projectId
        });
        
        if (response.data && response.data.parent) {
          const orgId = response.data.parent.id;
          const securityResponse = await this.securitycenter.organizations.sources.list({
            parent: `organizations/${orgId}`
          });
          return securityResponse.data;
        } else {
          return {
            status: 'Not Available',
            message: 'Project is not part of an organization'
          };
        }
      } catch (error) {
        if (error.code === 403) {
          return {
            status: 'Not Available',
            message: 'Security Command Center access requires Standard or Premium tier subscription'
          };
        }
        throw error;
      }
    });

    // Check audit logs
    await this.validateCheck('Compliance.Audit', 'CheckAuditLogs', async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const response = await this.logging.entries.list({
        resourceNames: [`projects/${this.projectId}`],
        filter: 'resource.type="gcp_audit_log"',
        orderBy: 'timestamp desc',
        pageSize: 100
      });
      return response.data;
    });

    // Check organization policies with permission handling
    await this.validateCheck('Compliance.Policies', 'CheckOrgPolicies', async () => {
      try {
        const response = await this.cloudasset.assets.list({
          parent: `projects/${this.projectId}`,
          assetTypes: ['orgpolicy.googleapis.com/Policy']
        });
        return response.data;
      } catch (error) {
        if (error.code === 403) {
          return {
            status: 'Not Available',
            message: 'Missing required IAM permissions for Cloud Asset Inventory',
            requiredRole: 'roles/cloudasset.viewer'
          };
        }
        throw error;
      }
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new ComplianceValidator();
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

module.exports = ComplianceValidator; 