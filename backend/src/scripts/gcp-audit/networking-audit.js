const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

// Initialize authentication
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Initialize API clients with auth
let compute;
let dns;

async function initializeClients() {
  const authClient = await auth.getClient();
  compute = google.compute({
    version: 'v1',
    auth: authClient
  });
  dns = google.dns({
    version: 'v1',
    auth: authClient
  });
}

async function auditNetworkingResources() {
  try {
    console.log('Starting networking audit...');
    await initializeClients();
    
    const results = {
      timestamp: new Date().toISOString(),
      projectId: 'dba-inventory-services-prod',
      networkingResources: {
        vpcs: [],
        subnets: [],
        firewallRules: [],
        loadBalancers: [],
        cloudNat: [],
        cloudDns: [],
        vpnTunnels: [],
        interconnectAttachments: [],
        cloudRouters: [],
        routes: []
      },
      recommendations: []
    };

    // Get all regions first
    const regionsResponse = await compute.regions.list({
      project: 'dba-inventory-services-prod'
    });
    const regions = regionsResponse.data.items.map(region => region.name);
    console.log(`Found ${regions.length} regions: ${regions.join(', ')}`);

    // Audit VPCs
    try {
      const vpcsResponse = await compute.networks.list({
        project: 'dba-inventory-services-prod'
      });
      results.networkingResources.vpcs = vpcsResponse.data.items || [];
      console.log(`Found ${results.networkingResources.vpcs.length} VPCs`);
    } catch (error) {
      console.error('Error auditing VPCs:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve VPC information',
        recommendation: 'Check compute.networks.list permission'
      });
    }

    // Audit Subnets
    try {
      for (const region of regions) {
        const subnetsResponse = await compute.subnetworks.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        if (subnetsResponse.data.items) {
          results.networkingResources.subnets.push(...subnetsResponse.data.items);
        }
      }
      console.log(`Found ${results.networkingResources.subnets.length} subnets`);
    } catch (error) {
      console.error('Error auditing subnets:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve subnet information',
        recommendation: 'Check compute.subnetworks.list permission'
      });
    }

    // Audit Firewall Rules
    try {
      const firewallResponse = await compute.firewalls.list({
        project: 'dba-inventory-services-prod'
      });
      results.networkingResources.firewallRules = firewallResponse.data.items || [];
      console.log(`Found ${results.networkingResources.firewallRules.length} firewall rules`);
    } catch (error) {
      console.error('Error auditing firewall rules:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve firewall rules',
        recommendation: 'Check compute.firewalls.list permission'
      });
    }

    // Audit Load Balancers
    try {
      for (const region of regions) {
        const forwardingRulesResponse = await compute.forwardingRules.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        if (forwardingRulesResponse.data.items) {
          results.networkingResources.loadBalancers.push(...forwardingRulesResponse.data.items);
        }
      }
      console.log(`Found ${results.networkingResources.loadBalancers.length} load balancers`);
    } catch (error) {
      console.error('Error auditing load balancers:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve load balancer information',
        recommendation: 'Check compute.forwardingRules.list permission'
      });
    }

    // Audit Cloud NAT
    try {
      for (const region of regions) {
        const routersResponse = await compute.routers.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        
        for (const router of routersResponse.data.items || []) {
          const natResponse = await compute.routers.get({
            project: 'dba-inventory-services-prod',
            region: region,
            router: router.name
          });
          
          if (natResponse.data.nats) {
            results.networkingResources.cloudNat.push(...natResponse.data.nats);
          }
        }
      }
      console.log(`Found ${results.networkingResources.cloudNat.length} Cloud NAT configurations`);
    } catch (error) {
      console.error('Error auditing Cloud NAT:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve Cloud NAT information',
        recommendation: 'Check compute.routers.list and compute.routers.get permissions'
      });
    }

    // Audit Cloud DNS
    try {
      const dnsResponse = await dns.managedZones.list({
        project: 'dba-inventory-services-prod'
      });
      results.networkingResources.cloudDns = dnsResponse.data.managedZones || [];
      console.log(`Found ${results.networkingResources.cloudDns.length} Cloud DNS zones`);
    } catch (error) {
      console.error('Error auditing Cloud DNS:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve Cloud DNS information',
        recommendation: 'Check dns.managedZones.list permission'
      });
    }

    // Audit VPN Tunnels
    try {
      for (const region of regions) {
        const vpnTunnelsResponse = await compute.vpnTunnels.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        if (vpnTunnelsResponse.data.items) {
          results.networkingResources.vpnTunnels.push(...vpnTunnelsResponse.data.items);
        }
      }
      console.log(`Found ${results.networkingResources.vpnTunnels.length} VPN tunnels`);
    } catch (error) {
      console.error('Error auditing VPN tunnels:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve VPN tunnel information',
        recommendation: 'Check compute.vpnTunnels.list permission'
      });
    }

    // Audit Interconnect Attachments
    try {
      for (const region of regions) {
        const interconnectResponse = await compute.interconnectAttachments.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        if (interconnectResponse.data.items) {
          results.networkingResources.interconnectAttachments.push(...interconnectResponse.data.items);
        }
      }
      console.log(`Found ${results.networkingResources.interconnectAttachments.length} interconnect attachments`);
    } catch (error) {
      console.error('Error auditing interconnect attachments:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve interconnect attachment information',
        recommendation: 'Check compute.interconnectAttachments.list permission'
      });
    }

    // Audit Cloud Routers
    try {
      for (const region of regions) {
        const routersResponse = await compute.routers.list({
          project: 'dba-inventory-services-prod',
          region: region
        });
        if (routersResponse.data.items) {
          results.networkingResources.cloudRouters.push(...routersResponse.data.items);
        }
      }
      console.log(`Found ${results.networkingResources.cloudRouters.length} Cloud Routers`);
    } catch (error) {
      console.error('Error auditing Cloud Routers:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve Cloud Router information',
        recommendation: 'Check compute.routers.list permission'
      });
    }

    // Audit Routes
    try {
      const routesResponse = await compute.routes.list({
        project: 'dba-inventory-services-prod'
      });
      results.networkingResources.routes = routesResponse.data.items || [];
      console.log(`Found ${results.networkingResources.routes.length} routes`);
    } catch (error) {
      console.error('Error auditing routes:', error.message);
      results.recommendations.push({
        category: 'Networking',
        issue: 'Failed to retrieve route information',
        recommendation: 'Check compute.routes.list permission'
      });
    }

    // Generate recommendations
    generateNetworkingRecommendations(results);

    // Save results
    const resultsPath = path.join(__dirname, 'networking-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Networking audit completed. Results saved to networking-audit-results.json');
  } catch (error) {
    console.error('Error during networking audit:', error);
    throw error;
  }
}

function generateNetworkingRecommendations(results) {
  // Check VPC configurations
  results.networkingResources.vpcs.forEach(vpc => {
    // Check for custom subnet mode
    if (!vpc.autoCreateSubnetworks) {
      results.recommendations.push({
        category: 'Networking',
        issue: 'Custom subnet mode not enabled',
        recommendation: 'Consider using custom subnet mode for better network control',
        resource: vpc.name
      });
    }

    // Check for VPC flow logs
    if (!vpc.enableFlowLogs) {
      results.recommendations.push({
        category: 'Monitoring',
        issue: 'VPC flow logs not enabled',
        recommendation: 'Enable VPC flow logs for better network monitoring',
        resource: vpc.name
      });
    }
  });

  // Check subnet configurations
  results.networkingResources.subnets.forEach(subnet => {
    // Check for Private Google Access
    if (!subnet.privateIpGoogleAccess) {
      results.recommendations.push({
        category: 'Networking',
        issue: 'Private Google Access not enabled',
        recommendation: 'Enable Private Google Access for better security and performance',
        resource: subnet.name,
        region: subnet.region
      });
    }

    // Check for subnet IP range size
    const ipRange = subnet.ipCidrRange;
    const prefixLength = parseInt(ipRange.split('/')[1]);
    if (prefixLength > 24) {
      results.recommendations.push({
        category: 'Networking',
        issue: 'Subnet IP range may be too small',
        recommendation: 'Consider using a larger IP range to accommodate future growth',
        resource: subnet.name,
        region: subnet.region,
        currentSize: `/${prefixLength}`
      });
    }
  });

  // Check firewall rules
  results.networkingResources.firewallRules.forEach(rule => {
    // Check for overly permissive rules
    if (rule.direction === 'INGRESS' && rule.allowed) {
      const hasAllPorts = rule.allowed.some(a => a.ports && a.ports.includes('0-65535'));
      const hasAllProtocols = rule.allowed.some(a => a.IPProtocol === 'all');
      
      if (hasAllPorts || hasAllProtocols) {
        results.recommendations.push({
          category: 'Security',
          issue: 'Overly permissive firewall rule',
          recommendation: 'Restrict port ranges and protocols to only necessary ones',
          resource: rule.name,
          direction: rule.direction
        });
      }
    }

    // Check for source ranges
    if (rule.direction === 'INGRESS' && rule.sourceRanges?.includes('0.0.0.0/0')) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Public access allowed',
        recommendation: 'Restrict source ranges to specific IP addresses or ranges',
        resource: rule.name,
        direction: rule.direction
      });
    }
  });

  // Check load balancer configurations
  results.networkingResources.loadBalancers.forEach(lb => {
    // Check for SSL/TLS configuration
    if (lb.portRange && !lb.sslCertificates) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Load balancer without SSL/TLS',
        recommendation: 'Configure SSL/TLS for secure traffic',
        resource: lb.name,
        region: lb.region
      });
    }

    // Check for health checks
    if (!lb.healthChecks || lb.healthChecks.length === 0) {
      results.recommendations.push({
        category: 'Reliability',
        issue: 'Load balancer without health checks',
        recommendation: 'Configure health checks for better reliability',
        resource: lb.name,
        region: lb.region
      });
    }
  });

  // Check Cloud NAT configurations
  results.networkingResources.cloudNat.forEach(nat => {
    // Check for minimum ports per VM
    if (nat.minPortsPerVm && nat.minPortsPerVm < 64) {
      results.recommendations.push({
        category: 'Networking',
        issue: 'Low minimum ports per VM in Cloud NAT',
        recommendation: 'Increase minimum ports per VM to at least 64 for better performance',
        resource: nat.name
      });
    }
  });

  // Check Cloud DNS configurations
  results.networkingResources.cloudDns.forEach(zone => {
    // Check for DNSSEC
    if (!zone.dnssecConfig?.state || zone.dnssecConfig.state !== 'on') {
      results.recommendations.push({
        category: 'Security',
        issue: 'DNSSEC not enabled',
        recommendation: 'Enable DNSSEC for better security',
        resource: zone.name
      });
    }
  });

  // Check VPN tunnel configurations
  results.networkingResources.vpnTunnels.forEach(tunnel => {
    // Check for IKE version
    if (tunnel.ikeVersion !== 2) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Using IKE version 1',
        recommendation: 'Upgrade to IKE version 2 for better security',
        resource: tunnel.name,
        region: tunnel.region
      });
    }
  });
}

// Run the audit if this script is run directly
if (require.main === module) {
  auditNetworkingResources().catch(error => {
    console.error('Error running networking audit:', error);
    process.exit(1);
  });
}

module.exports = {
  auditNetworkingResources
}; 