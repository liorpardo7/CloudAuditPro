const { writeAuditResults } = require('./writeAuditResults');
// run-full-gcp-checklist-audit.js
// Script to run all GCP audit checklist items and output a timestamped results file

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getAuthClient, getProjectId } = require('./auth');

const CHECKLIST_PATH = path.resolve(__dirname, '../../../../GCP_AUDIT_CHECKLIST.md');
const CREDENTIALS_PATH = path.join(__dirname, 'dba-inventory-services-prod-8a97ca8265b5.json');
const OUTPUT_DIR = __dirname;

// Map checklist items to audit scripts (expand as needed)
const AUDIT_SCRIPT_MAP = {
  'VM Instance Inventory': 'compute-audit.js',
  'Cloud SQL Optimization': 'resource-utilization-audit.js',
  'BigQuery Analysis': 'bigquery-audit.js',
  'Storage Lifecycle Management': 'storage-lifecycle-audit.js',
  'Advanced Monitoring': 'monitoring-audit.js',
  'Budget Management': 'budget-audit.js',
  'Discount Management': 'discount-audit.js',
  'Cost Allocation': 'cost-allocation-audit.js',
  'Data Residency': 'data-protection-audit.js',
  'Advanced Security Analysis': 'security-audit.js',
  'Network Security': 'networking-audit.js',
  'Advanced Storage Management': 'storage-audit.js',
  // Add more mappings as needed
};

// Add a mapping from sub-items to result keys for compute audit
const COMPUTE_SUBITEMS_MAP = {
  'List all VM instances (`compute.instances.list`)': results => results.computeResources?.vms?.length > 0,
  'Check instance types and sizes (`compute.machineTypes.list`)': results => results.computeResources?.machineTypes?.length > 0,
  'Verify machine family usage (`compute.machineTypes.list`)': results => results.computeResources?.machineTypes?.length > 0,
  'Review instance labels and tags (`compute.instances.list`)': results => results.computeResources?.vms?.some(vm => vm.labels && Object.keys(vm.labels).length > 0),
  'Check for deprecated machine types (`compute.machineTypes.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Deprecated machine type')),
  'Verify instance naming conventions (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Invalid instance naming convention')),
  'Check for underutilized instances (`monitoring.timeSeries.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Low CPU utilization')),
  'Review instance scheduling (`compute.instances.list`)': results => results.computeResources?.vms?.some(vm => vm.scheduling),
  'Verify preemptible/spot instance usage (`compute.instances.list`)': results => results.computeResources?.vms?.some(vm => vm.scheduling?.preemptible),
  'Check for right-sized instances (`compute.instances.list`, `monitoring.timeSeries.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Low CPU utilization')),
  'Review CPU and memory utilization patterns (`monitoring.timeSeries.list`)': results => results.computeResources?.utilizationMetrics?.length > 0,
  'Check for idle instances during non-business hours (`monitoring.timeSeries.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('idle during non-business hours')),
  'Verify instance reservations (`compute.reservations.list`)': results => results.computeResources?.reservations?.length > 0,
  'Check for sustained use discounts (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Automatic restart disabled')),
  'Verify OS patch levels (`compute.instances.list`, `compute.images.list`)': results => results.computeResources?.diskImages?.length > 0,
  'Check for secure boot enabled (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Secure Boot')),
  'Review service account usage (`compute.instances.list`, `iam.serviceAccounts.get`)': results => results.computeResources?.vms?.some(vm => vm.serviceAccounts && vm.serviceAccounts.length > 0),
  'Verify disk encryption (`compute.disks.list`)': results => results.computeResources?.vms?.some(vm => vm.disks && vm.disks.length > 0),
  'Check for Shielded VM features (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Shielded VM')),
  'Verify integrity monitoring (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Integrity monitoring')),
  'Review OS login configuration (`compute.instances.list`)': results => results.computeResources?.vms?.some(vm => vm.metadata?.items?.some(item => item.key === 'enable-oslogin')),
  'Check for confidential computing (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('Confidential computing')),
  'Verify VM metadata security (`compute.instances.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('SSH keys in instance metadata')),
};

// Add a mapping from sub-items to result keys for storage audit
const STORAGE_SUBITEMS_MAP = {
  'List all buckets (`storage.buckets.list`)': results => results.storageResources?.buckets?.length > 0,
  'Check bucket locations (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.location),
  'Review storage classes (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.storageClass),
  'Verify bucket labels (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.labels && Object.keys(b.labels).length > 0),
  'Check for bucket versioning (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.versioning),
  'Review bucket lifecycle rules (`storage.buckets.get`)': results => results.storageResources?.lifecycleRules?.length > 0,
  'Verify bucket retention policies (`storage.buckets.get`)': results => results.storageResources?.retentionPolicies?.length > 0,
  'Check for bucket logging (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.logging),
  'Check IAM policies (`storage.buckets.getIamPolicy`)': results => results.storageResources?.bucketIamPolicies?.length > 0,
  'Verify bucket permissions (`storage.buckets.getIamPolicy`)': results => results.storageResources?.bucketIamPolicies?.length > 0,
  'Review public access (`storage.buckets.getIamPolicy`)': results => results.storageResources?.bucketIamPolicies?.some(p => JSON.stringify(p.policy).includes('allUsers')),
  'Check for uniform bucket access (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.iamConfiguration?.uniformBucketLevelAccess),
  'Verify bucket encryption (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.encryption),
  'Check for bucket lock (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.retentionPolicy),
  'Review bucket CORS configuration (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.cors),
  'Verify bucket access logs (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.logging),
  'Review lifecycle rules (`storage.buckets.get`)': results => results.storageResources?.lifecycleRules?.length > 0,
  'Check versioning status (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.versioning),
  'Verify retention policies (`storage.buckets.get`)': results => results.storageResources?.retentionPolicies?.length > 0,
  'Review object metadata (`storage.objects.list`)': results => results.storageResources?.objectCounts?.length > 0,
  'Check for object immutability (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.retentionPolicy),
  'Review storage class transitions (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.lifecycle),
  'Verify object access patterns (`storage.objects.list`)': results => results.storageResources?.objectCounts?.length > 0,
  'Check for bucket cost optimization (`storage.buckets.get`)': results => results.storageResources?.buckets?.some(b => b.storageClass),
};

// Add a mapping from sub-items to result keys for networking audit
const NETWORKING_SUBITEMS_MAP = {
  // VPC
  'List all VPCs (`compute.networks.list`)': results => results.networkingResources?.vpcs?.length > 0,
  'Check subnet configurations (`compute.subnetworks.list`)': results => results.networkingResources?.subnets?.length > 0,
  'Review routing tables (`compute.routes.list`)': results => results.networkingResources?.routes?.length > 0,
  'Verify network labels (`compute.networks.list`)': results => results.networkingResources?.vpcs?.some(vpc => vpc.labels && Object.keys(vpc.labels).length > 0),
  'Check for VPC peering (`compute.networks.list`)': results => results.networkingResources?.vpcs?.some(vpc => vpc.peerings && vpc.peerings.length > 0),
  'Review network topology (`compute.networks.get`)': results => results.networkingResources?.vpcs?.length > 0,
  'Verify network performance (`compute.networks.get`)': results => results.networkingResources?.vpcs?.length > 0,
  'Check for network cost optimization (`compute.networks.get`)': results => results.networkingResources?.vpcs?.length > 0,
  // Network Security
  'Check firewall rules (`compute.firewalls.list`)': results => results.networkingResources?.firewallRules?.length > 0,
  'Review VPC flow logs (`compute.networks.get`)': results => results.networkingResources?.subnets?.some(s => s.logConfig && s.logConfig.enable),
  'Verify private Google access (`compute.subnetworks.get`)': results => results.networkingResources?.subnets?.some(s => s.privateIpGoogleAccess),
  'Check for VPC service controls (`compute.networks.get`)': results => results.networkingResources?.vpcs?.some(vpc => vpc.enableVpcServiceControls),
  'Verify network encryption (`compute.networks.get`)': results => results.networkingResources?.vpcs?.some(vpc => vpc.enableEncryption),
  'Check for network segmentation (`compute.networks.get`)': results => results.networkingResources?.vpcs?.length > 1,
  'Review network access policies (`compute.networks.get`)': results => results.networkingResources?.vpcs?.length > 0,
  'Verify network security posture (`compute.networks.get`)': results => results.networkingResources?.vpcs?.length > 0,
  // Load Balancing
  'List all load balancers (`compute.forwardingRules.list`)': results => results.networkingResources?.loadBalancers?.length > 0,
  'Check load balancer types (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.some(lb => lb.loadBalancingScheme),
  'Review backend services (`compute.backendServices.list`)': results => results.networkingResources?.loadBalancers?.some(lb => lb.backendService),
  'Verify health checks (`compute.healthChecks.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('health check')),
  'Check for load balancer redundancy (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.length > 1,
  'Review load balancer performance (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.length > 0,
  'Verify load balancer scaling (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.some(lb => lb.autoscaling),
  'Check for load balancer cost optimization (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.length > 0,
  'Check SSL certificates (`compute.sslCertificates.list`)': results => results.networkingResources?.sslCertificates?.length > 0,
  'Review security policies (`compute.securityPolicies.list`)': results => results.networkingResources?.securityPolicies?.length > 0,
  'Verify WAF configurations (`compute.securityPolicies.get`)': results => results.networkingResources?.securityPolicies?.some(p => p.wafConfig),
  'Check for DDoS protection (`compute.securityPolicies.get`)': results => results.networkingResources?.securityPolicies?.some(p => p.ddosProtection),
  'Verify TLS configuration (`compute.sslCertificates.get`)': results => results.networkingResources?.sslCertificates?.some(cert => cert.type === 'TLS'),
  'Check for SSL policies (`compute.sslPolicies.list`)': results => results.networkingResources?.sslPolicies?.length > 0,
  'Review load balancer access logs (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.some(lb => lb.logging),
  'Verify load balancer security posture (`compute.forwardingRules.get`)': results => results.networkingResources?.loadBalancers?.length > 0,
  // Cloud DNS
  'List all DNS zones (`dns.managedZones.list`)': results => results.networkingResources?.cloudDns?.length > 0,
  'Check DNS records (`dns.resourceRecordSets.list`)': results => results.networkingResources?.cloudDns?.some(zone => zone.resourceRecordSets && zone.resourceRecordSets.length > 0),
  'Review DNSSEC status (`dns.managedZones.get`)': results => results.networkingResources?.cloudDns?.some(zone => zone.dnssecConfig),
  'Verify DNS policies (`dns.policies.list`)': results => results.networkingResources?.dnsPolicies?.length > 0,
  'Check for DNS redundancy (`dns.managedZones.get`)': results => results.networkingResources?.cloudDns?.length > 1,
  'Review DNS performance (`dns.managedZones.get`)': results => results.networkingResources?.cloudDns?.length > 0,
  'Verify DNS security settings (`dns.managedZones.get`)': results => results.networkingResources?.cloudDns?.some(zone => zone.dnssecConfig),
  'Check for DNS cost optimization (`dns.managedZones.get`)': results => results.networkingResources?.cloudDns?.length > 0,
};

// Add a mapping from sub-items to result keys for billing audit
const BILLING_SUBITEMS_MAP = {
  'List all billing accounts (`billing.accounts.list`)': results => results.billingAccounts?.length > 0,
  'Check for committed use discounts (`compute.commitments.list`)': results => results.committedUseDiscounts?.length > 0,
  'Review budget alerts (`billing.budgets.get`)': results => results.budgets?.some(b => b.alerts && b.alerts.length > 0),
  'Detect idle resources (`monitoring.timeSeries.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('idle')),
  'Review cost allocation tags (`billing.accounts.get`)': results => results.costAllocationTags?.length > 0,
  'Identify projects/services with high/abnormal spend (`billing.accounts.get`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('high/abnormal spend')),
};

// Add a mapping from sub-items to result keys for resource utilization audit
const UTILIZATION_SUBITEMS_MAP = {
  'Find idle/underutilized VMs (`monitoring.timeSeries.list`)': results => results.idleVMs?.length > 0,
  'Find unused disks (`compute.disks.list`)': results => results.idleDisks?.length > 0,
  'Find underutilized databases (`sql.instances.list`)': results => results.idleDatabases?.length > 0,
  'Recommend resizing or deleting underused resources (`compute.instances.delete`)': results => results.recommendations?.some(r => r.recommendation && r.recommendation.includes('resize') || r.recommendation.includes('delete')),
  'Estimate potential monthly savings for each finding': results => results.recommendations?.some(r => r.estimatedSavings),
};

// Add a mapping from sub-items to result keys for storage lifecycle audit
const STORAGE_LIFECYCLE_SUBITEMS_MAP = {
  'Detect unused buckets (`storage.buckets.list`)': results => results.unusedBuckets?.length > 0,
  'Find old snapshots (`compute.snapshots.list`)': results => results.oldSnapshots?.length > 0,
  'Identify cold data (`storage.objects.list`)': results => results.coldData?.length > 0,
  'Recommend storage class transitions (`storage.buckets.get`)': results => results.recommendations?.some(r => r.recommendation && r.recommendation.includes('storage class transition')),
  'Recommend lifecycle policies (`storage.buckets.get`)': results => results.lifecyclePolicies?.length > 0,
  'Highlight buckets with no lifecycle or retention policies': results => results.recommendations?.some(r => r.issue && r.issue.includes('no lifecycle or retention policies')),
};

// Add a mapping from sub-items to result keys for security audit
const SECURITY_SUBITEMS_MAP = {
  'Audit IAM/service account permissions (`iam.serviceAccounts.list`)': results => results.iamFindings?.length > 0,
  'Check for key rotation (`iam.serviceAccountKeys.list`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('key rotation')),
  'Detect public buckets (`storage.buckets.getIamPolicy`)': results => results.publicBuckets?.length > 0,
  'Detect open firewall rules (`compute.firewalls.list`)': results => results.openFirewalls?.length > 0,
  'Check for encryption at rest (`compute.disks.get`, `storage.buckets.get`)': results => results.encryptionFindings?.length > 0,
  'Check for compliance with standards (GDPR, HIPAA, etc.)': results => results.recommendations?.some(r => r.issue && r.issue.includes('compliance')),
  'Output severity/priority for each finding': results => results.recommendations?.some(r => r.severity),
};

// Add mapping from sub-items to result keys for GKE audit
const GKE_SUBITEMS_MAP = {
  'List all GKE clusters (`container.clusters.list`)': results => results.clusters?.length > 0,
  'Check for private clusters (`container.clusters.get`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('private clusters')),
  // ...add more as needed
};

// Add mapping for Disk audit
const DISK_SUBITEMS_MAP = {
  'List all persistent disks (`compute.disks.list`)': results => results.disks?.length > 0,
  'Check for encryption (`compute.disks.get`)': results => results.encryptionFindings?.length > 0,
  // ...add more as needed
};

// Add mapping for IAM audit
const IAM_SUBITEMS_MAP = {
  'List all IAM policies (`resourcemanager.projects.getIamPolicy`)': results => results.iamPolicies?.length > 0,
  'Check for role separation (`resourcemanager.projects.getIamPolicy`)': results => results.recommendations?.some(r => r.issue && r.issue.includes('role separation')),
  // ...add more as needed
};

// Add mapping for Org Policy audit
const ORG_POLICY_SUBITEMS_MAP = {
  'List all organization policies (`orgpolicy.policy.get`)': results => results.orgPolicies?.length > 0,
  // ...add more as needed
};

// Add mapping for Security Center audit
const SCC_SUBITEMS_MAP = {
  'Check security findings (`securitycenter.findings.list`)': results => results.findings?.length > 0,
  // ...add more as needed
};

// Add mapping for Billing Advanced audit
const BILLING_ADV_SUBITEMS_MAP = {
  'Check for cost anomaly detection (`billing.accounts.get`)': results => results.anomalyFindings?.length > 0,
  // ...add more as needed
};

// Add mapping for Compliance audit
const COMPLIANCE_SUBITEMS_MAP = {
  'Check for GDPR compliance (`securitycenter.findings.list`)': results => results.regulatoryFindings?.some(f => f.compliance === 'GDPR'),
  // ...add more as needed
};

// Add mapping for DevOps audit
const DEVOPS_SUBITEMS_MAP = {
  'List all build configurations (`cloudbuild.builds.list`)': results => results.findings?.some(f => f.category === 'Cloud Build'),
  // ...add more as needed
};

// Add mapping for Monitoring audit
const MONITORING_SUBITEMS_MAP = {
  'Check monitoring dashboards (`monitoring.dashboards.list`)': results => results.dashboards?.length > 0,
  // ...add more as needed
};

// Add mapping for Cost Allocation audit
const COST_ALLOC_SUBITEMS_MAP = {
  'Resource tagging compliance (cost-allocation-audit.js)': results => results.taggingFindings?.length > 0,
  // ...add more as needed
};

// Add mapping for Data Protection audit
const DATA_PROT_SUBITEMS_MAP = {
  'Data location compliance (data-protection-audit.js)': results => results.residencyFindings?.length > 0,
  // ...add more as needed
};

// Add mapping for Storage Advanced audit
const STORAGE_ADV_SUBITEMS_MAP = {
  'Bucket versioning verification (storage-audit.js)': results => results.versioningFindings?.length > 0,
  // ...add more as needed
};

// Map of scripts that need attention
const PROBLEMATIC_SCRIPTS = {
  'cost-management-audit.js': {
    issue: 'projectId not defined',
    category: 'Cost Management',
    priority: 'high'
  },
  'billing-audit.js': {
    issue: 'projectId not defined',
    category: 'Billing',
    priority: 'high'
  }
};

// Map of scripts with JSON parsing issues
const JSON_PARSING_ISSUES = [
  'scheduler_audit.js',
  'composer_dag_audit.js',
  'cross_project_audit.js',
  'advanced_audits.js'
];

// Map of scripts with missing results
const MISSING_RESULTS = [
  'label_consistency.js'
];

function parseChecklist() {
  const content = fs.readFileSync(CHECKLIST_PATH, 'utf-8');
  const lines = content.split('\n');
  const items = [];
  let currentCategory = null;
  for (let line of lines) {
    // Category
    const catMatch = line.match(/^##+\s+(.+)/);
    if (catMatch && !catMatch[1].includes('Status Legend')) {
      currentCategory = catMatch[1].trim();
      continue;
    }
    // Item
    const itemMatch = line.match(/^- \[.\] (.+)$/);
    if (itemMatch && currentCategory) {
      items.push({ category: currentCategory, item: itemMatch[1].trim() });
    }
    // Subitem (indented)
    const subItemMatch = line.match(/^\s+- \[.\] (.+)$/);
    if (subItemMatch && currentCategory) {
      items.push({ category: currentCategory, item: subItemMatch[1].trim() });
    }
    // Markdown list (for new sections)
    const starMatch = line.match(/^\* \[.\] (.+)$/);
    if (starMatch && currentCategory) {
      items.push({ category: currentCategory, item: starMatch[1].trim() });
    }
  }
  return items;
}

async function runAuditScript(scriptName, projectId, tokens) {
  try {
    console.log(`\n=== Running ${scriptName} ===`);
    console.log(`Started at: ${new Date().toISOString()}`);
    const scriptPath = path.join(__dirname, scriptName);
    const scriptModule = require(scriptPath);
    if (typeof scriptModule.run !== 'function') {
      throw new Error(`Script ${scriptName} does not export a run(projectId, tokens) function.`);
    }
    const result = await scriptModule.run(projectId, tokens);
    return { status: '✓', error: null, result };
  } catch (err) {
    return { status: '✗', error: err.message, result: null };
  }
}

async function main() {
  // Load tokens and projectId from a config file or environment
  // For demonstration, assume tokens are loaded from oauth-tokens.json and projectId from selected-projects.json
  const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'oauth-tokens.json'), 'utf-8'));
  const selectedProjects = JSON.parse(fs.readFileSync(path.join(__dirname, 'selected-projects.json'), 'utf-8'));
  const projectId = Array.isArray(selectedProjects) ? selectedProjects[0] : selectedProjects;

  const results = {
    timestamp: new Date().toISOString(),
    projectId,
    problematicScripts: {},
    jsonParsingIssues: {},
    missingResults: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      notImplemented: 0
    }
  };

  // Run problematic scripts
  for (const [script, info] of Object.entries(PROBLEMATIC_SCRIPTS)) {
    results.summary.total++;
    console.log(`\nRunning problematic script: ${script}`);
    const result = await runAuditScript(script, projectId, tokens);
    results.problematicScripts[script] = {
      ...info,
      result,
      timestamp: new Date().toISOString()
    };
    if (result.status === '✓') results.summary.passed++;
    else results.summary.failed++;
  }

  // Check JSON parsing issues
  for (const script of JSON_PARSING_ISSUES) {
    results.summary.total++;
    console.log(`\nChecking JSON parsing for: ${script}`);
    const result = await runAuditScript(script, projectId, tokens);
    results.jsonParsingIssues[script] = {
      result,
      timestamp: new Date().toISOString()
    };
    if (result.status === '✓') results.summary.passed++;
    else results.summary.failed++;
  }

  // Check missing results
  for (const script of MISSING_RESULTS) {
    results.summary.total++;
    console.log(`\nChecking missing results for: ${script}`);
    const result = await runAuditScript(script, projectId, tokens);
    results.missingResults[script] = {
      result,
      timestamp: new Date().toISOString()
    };
    if (result.status === '✓') results.summary.passed++;
    else results.summary.failed++;
  }

  // Calculate pass rate
  results.summary.passRate = 
    `${((results.summary.passed / results.summary.total) * 100).toFixed(2)}%`;

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPathTimestamped = path.join(OUTPUT_DIR, `focused-audit-results-${timestamp}.json`);
  const outPathPublic = path.resolve(__dirname, '../../../../public/focused-audit-results.json');
  fs.writeFileSync(outPathTimestamped, JSON.stringify(results, null, 2));
  fs.writeFileSync(outPathPublic, JSON.stringify(results, null, 2));

  console.log('\nFocused audit complete!');
  console.log('Results saved to:', outPathTimestamped);
  console.log('\nSummary:');
  console.log(`Total Checks: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Pass Rate: ${results.summary.passRate}`);

  // Write final results
  const findings = [];
  const summary = {
    totalChecks: results.summary.total,
    passed: results.summary.passed,
    failed: results.summary.failed,
    costSavingsPotential: 0
  };
  const errors = Object.entries(results.problematicScripts)
    .filter(([_, info]) => info.result.status === '✗')
    .map(([script, info]) => ({
      check: script,
      error: info.result.error
    }));

  writeAuditResults("focused-gcp-checklist-audit", findings, summary, errors, results.projectId);
}

main().catch(console.error); 
