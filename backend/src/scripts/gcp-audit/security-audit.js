const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

// Initialize authentication
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/securitycenter.readonly',
    'https://www.googleapis.com/auth/iam.readonly',
    'https://www.googleapis.com/auth/cloudkms.readonly'
  ]
});

// Initialize API clients with auth
let cloudresourcemanager;
let iam;
let serviceusage;
let securitycenter;
let recommender;
let orgPolicy;
let kms;
let logging;

async function initializeClients() {
  const authClient = await auth.getClient();
  cloudresourcemanager = google.cloudresourcemanager({
    version: 'v1',
    auth: authClient
  });
  iam = google.iam({
    version: 'v1',
    auth: authClient
  });
  serviceusage = google.serviceusage({
    version: 'v1',
    auth: authClient
  });
  securitycenter = google.securitycenter({
    version: 'v1',
    auth: authClient
  });
  recommender = google.recommender({
    version: 'v1',
    auth: authClient
  });
  orgPolicy = google.orgpolicy({
    version: 'v2',
    auth: authClient
  });
  kms = google.cloudkms({
    version: 'v1',
    auth: authClient
  });
  logging = google.logging({
    version: 'v2',
    auth: authClient
  });
}

async function auditSecuritySettings() {
  try {
    console.log('Starting security audit...');
    await initializeClients();
    
    const results = {
      timestamp: new Date().toISOString(),
      projectId: 'dba-inventory-services-prod',
      securitySettings: {
        iamPolicies: [],
        serviceAccounts: [],
        organizationPolicies: [],
        enabledApis: [],
        securityFindings: [],
        securityRecommendations: [],
        keyManagement: [],
        auditLogs: []
      },
      recommendations: []
    };

    // Get IAM policy
    try {
      const iamPolicyResponse = await cloudresourcemanager.projects.getIamPolicy({
        resource: 'projects/dba-inventory-services-prod',
        options: {
          requestedPolicyVersion: 3
        }
      });
      results.securitySettings.iamPolicies = iamPolicyResponse.data;
      console.log('Retrieved IAM policy');
    } catch (error) {
      console.error('Error getting IAM policy:', error.message);
      results.recommendations.push({
        category: 'IAM',
        issue: 'Failed to retrieve IAM policy',
        recommendation: 'Check resourcemanager.projects.getIamPolicy permission'
      });
    }

    // List service accounts
    try {
      const serviceAccountsResponse = await iam.projects.serviceAccounts.list({
        name: 'projects/dba-inventory-services-prod'
      });
      results.securitySettings.serviceAccounts = serviceAccountsResponse.data.accounts || [];
      console.log(`Found ${results.securitySettings.serviceAccounts.length} service accounts`);
    } catch (error) {
      console.error('Error listing service accounts:', error.message);
      results.recommendations.push({
        category: 'IAM',
        issue: 'Failed to list service accounts',
        recommendation: 'Check iam.serviceAccounts.list permission'
      });
    }

    // List enabled APIs
    try {
      const enabledApisResponse = await serviceusage.services.list({
        parent: 'projects/dba-inventory-services-prod',
        filter: 'state:ENABLED'
      });
      results.securitySettings.enabledApis = enabledApisResponse.data.services || [];
      console.log(`Found ${results.securitySettings.enabledApis.length} enabled APIs`);
    } catch (error) {
      console.error('Error listing enabled APIs:', error.message);
      results.recommendations.push({
        category: 'API',
        issue: 'Failed to list enabled APIs',
        recommendation: 'Check serviceusage.services.list permission'
      });
    }

    // Check if Organization Policy API is enabled
    const orgPolicyApiEnabled = results.securitySettings.enabledApis.some(
      api => api.name === 'orgpolicy.googleapis.com'
    );

    if (orgPolicyApiEnabled) {
      try {
        const orgPoliciesResponse = await orgPolicy.projects.policies.list({
          parent: 'projects/dba-inventory-services-prod'
        });
        results.securitySettings.organizationPolicies = orgPoliciesResponse.data.policies || [];
        console.log(`Found ${results.securitySettings.organizationPolicies.length} organization policies`);
      } catch (error) {
        console.error('Error getting organization policies:', error.message);
        results.recommendations.push({
          category: 'Organization Policy',
          issue: 'Failed to retrieve organization policies',
          recommendation: 'Check orgpolicy.policies.list permission'
        });
      }
    } else {
      results.recommendations.push({
        category: 'Organization Policy',
        issue: 'Organization Policy API not enabled',
        recommendation: 'Enable the Organization Policy API in the project'
      });
    }

    // Get Security Command Center findings
    try {
      const findingsResponse = await securitycenter.projects.sources.findings.list({
        parent: 'projects/dba-inventory-services-prod/sources/-'
      });
      results.securitySettings.securityFindings = findingsResponse.data.findings || [];
      console.log(`Found ${results.securitySettings.securityFindings.length} security findings`);
    } catch (error) {
      console.error('Error getting security findings:', error.message);
      results.recommendations.push({
        category: 'Security',
        issue: 'Failed to retrieve security findings',
        recommendation: 'Check securitycenter.findings.list permission'
      });
    }

    // Get security recommendations
    try {
      const recommendationsResponse = await recommender.projects.locations.recommenders.recommendations.list({
        parent: 'projects/dba-inventory-services-prod/locations/-/recommenders/security-recommender'
      });
      results.securitySettings.securityRecommendations = recommendationsResponse.data.recommendations || [];
      console.log(`Found ${results.securitySettings.securityRecommendations.length} security recommendations`);
    } catch (error) {
      console.error('Error getting security recommendations:', error.message);
      results.recommendations.push({
        category: 'Security',
        issue: 'Failed to retrieve security recommendations',
        recommendation: 'Check recommender.recommendations.list permission'
      });
    }

    // Get Cloud KMS key information
    try {
      const keysResponse = await kms.projects.locations.keyRings.cryptoKeys.list({
        parent: 'projects/dba-inventory-services-prod/locations/-'
      });
      results.securitySettings.keyManagement = keysResponse.data.cryptoKeys || [];
      console.log(`Found ${results.securitySettings.keyManagement.length} KMS keys`);
    } catch (error) {
      console.error('Error getting KMS keys:', error.message);
      results.recommendations.push({
        category: 'Security',
        issue: 'Failed to retrieve KMS key information',
        recommendation: 'Check cloudkms.cryptoKeys.list permission'
      });
    }

    // Get audit logs configuration
    try {
      const sinksResponse = await logging.projects.sinks.list({
        parent: 'projects/dba-inventory-services-prod'
      });
      results.securitySettings.auditLogs = sinksResponse.data.sinks || [];
      console.log(`Found ${results.securitySettings.auditLogs.length} audit log sinks`);
    } catch (error) {
      console.error('Error getting audit logs:', error.message);
      results.recommendations.push({
        category: 'Security',
        issue: 'Failed to retrieve audit log configuration',
        recommendation: 'Check logging.sinks.list permission'
      });
    }

    // Generate recommendations
    generateSecurityRecommendations(results);

    // Save results
    const resultsPath = path.join(__dirname, 'security-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Security audit completed. Results saved to security-audit-results.json');
  } catch (error) {
    console.error('Error during security audit:', error);
    throw error;
  }
}

function generateSecurityRecommendations(results) {
  // Check IAM policies
  const bindings = results.securitySettings.iamPolicies.bindings || [];
  bindings.forEach(binding => {
    // Check for public access
    if (binding.members.includes('allUsers') || binding.members.includes('allAuthenticatedUsers')) {
      results.recommendations.push({
        category: 'IAM',
        issue: 'Public access granted',
        recommendation: 'Remove public access and use specific user/service account access',
        role: binding.role
      });
    }

    // Check for overly permissive roles
    if (binding.role === 'roles/owner' || binding.role === 'roles/editor') {
      results.recommendations.push({
        category: 'IAM',
        issue: 'Overly permissive role assignment',
        recommendation: 'Use more specific roles following the principle of least privilege',
        role: binding.role
      });
    }

    // Check for service account user role
    if (binding.role === 'roles/iam.serviceAccountUser') {
      results.recommendations.push({
        category: 'IAM',
        issue: 'Service account user role detected',
        recommendation: 'Review and restrict service account user access',
        role: binding.role
      });
    }
  });

  // Check service accounts
  results.securitySettings.serviceAccounts.forEach(account => {
    // Check for disabled service accounts
    if (account.disabled) {
      results.recommendations.push({
        category: 'IAM',
        issue: 'Disabled service account found',
        recommendation: 'Review and either enable or delete the service account',
        resource: account.email
      });
    }

    // Check for service account keys
    if (account.keys && account.keys.length > 0) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Service account with user-managed keys',
        recommendation: 'Consider using workload identity federation instead of keys',
        resource: account.email
      });
    }
  });

  // Check organization policies
  results.securitySettings.organizationPolicies.forEach(policy => {
    // Check for domain restriction
    if (policy.name.includes('constraints/iam.allowedPolicyMemberDomains')) {
      if (!policy.spec?.rules?.some(rule => rule.enforce)) {
        results.recommendations.push({
          category: 'Security',
          issue: 'Domain restriction not enforced',
          recommendation: 'Enforce domain restriction for better security',
          policy: policy.name
        });
      }
    }

    // Check for VM external IP access
    if (policy.name.includes('constraints/compute.vmExternalIpAccess')) {
      if (!policy.spec?.rules?.some(rule => rule.enforce)) {
        results.recommendations.push({
          category: 'Security',
          issue: 'VM external IP access not restricted',
          recommendation: 'Restrict VM external IP access',
          policy: policy.name
        });
      }
    }
  });

  // Check security findings
  results.securitySettings.securityFindings.forEach(finding => {
    if (finding.severity === 'HIGH' || finding.severity === 'CRITICAL') {
      results.recommendations.push({
        category: 'Security',
        issue: `High severity finding: ${finding.category}`,
        recommendation: finding.recommendation || 'Review and remediate the finding',
        resource: finding.resourceName
      });
    }
  });

  // Check KMS keys
  results.securitySettings.keyManagement.forEach(key => {
    // Check for key rotation
    if (!key.rotationPeriod) {
      results.recommendations.push({
        category: 'Security',
        issue: 'KMS key rotation not configured',
        recommendation: 'Configure automatic key rotation',
        resource: key.name
      });
    }

    // Check for key protection level
    if (key.versionTemplate?.protectionLevel !== 'HSM') {
      results.recommendations.push({
        category: 'Security',
        issue: 'KMS key not using HSM protection',
        recommendation: 'Consider using HSM protection for sensitive keys',
        resource: key.name
      });
    }
  });

  // Check audit logs
  if (results.securitySettings.auditLogs.length === 0) {
    results.recommendations.push({
      category: 'Security',
      issue: 'No audit log sinks configured',
      recommendation: 'Configure audit log sinks for better security monitoring'
    });
  } else {
    // Check for export to BigQuery
    const hasBigQueryExport = results.securitySettings.auditLogs.some(
      sink => sink.destination?.includes('bigquery.googleapis.com')
    );
    
    if (!hasBigQueryExport) {
      results.recommendations.push({
        category: 'Security',
        issue: 'No BigQuery export configured for audit logs',
        recommendation: 'Configure BigQuery export for better log analysis'
      });
    }
  }
}

// Run the audit if this script is run directly
if (require.main === module) {
  auditSecuritySettings().catch(error => {
    console.error('Error running security audit:', error);
    process.exit(1);
  });
}

module.exports = {
  auditSecuritySettings
}; 