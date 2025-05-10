const { BaseValidator } = require('./base-validator');

class NetworkingValidator extends BaseValidator {
  async validateAll() {
    await this.initialize();
    console.log('Starting networking validation...\n');

    // Check VPC networks
    await this.validateCheck('Networking.VPC', 'ListVPCNetworks', async () => {
      const response = await this.compute.networks.list({
        project: this.projectId
      });
      return response.data;
    });

    // Check subnet configurations
    await this.validateCheck('Networking.VPC', 'CheckSubnetConfigurations', async () => {
      const response = await this.compute.subnetworks.list({
        project: this.projectId,
        region: 'us-central1'
      });
      return response.data;
    });

    // Check firewall rules
    await this.validateCheck('Networking.VPC', 'CheckFirewallRules', async () => {
      const response = await this.compute.firewalls.list({
        project: this.projectId
      });
      return response.data;
    });

    // Check load balancers
    await this.validateCheck('Networking.LoadBalancer', 'ListLoadBalancers', async () => {
      const response = await this.compute.forwardingRules.list({
        project: this.projectId,
        region: 'us-central1'
      });
      return response.data;
    });

    // Check DNS zones
    await this.validateCheck('Networking.DNS', 'ListDNSZones', async () => {
      const response = await this.dns.managedZones.list({
        project: this.projectId
      });
      return response.data;
    });

    return this.getResults();
  }
}

// Run the validator if this script is run directly
if (require.main === module) {
  const validator = new NetworkingValidator();
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

module.exports = NetworkingValidator; 