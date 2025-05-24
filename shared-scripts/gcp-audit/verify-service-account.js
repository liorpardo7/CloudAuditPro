const { google } = require('googleapis');
const { getAuthClient, getProjectId } = require('./auth');
const { writeAuditResults } = require('./writeAuditResults');

async function verifyServiceAccount() {
  try {
    console.log('Verifying service account...');
    
    // Get auth client and project ID
    const auth = await getAuthClient();
    const projectId = await getProjectId();
    
    // Initialize API clients
    const iam = google.iam({ version: 'v1', auth });
    const resourceManager = google.cloudresourcemanager({ version: 'v1', auth });
    
    const findings = [];
    const summary = { total: 0, passed: 0, failed: 0 };
    const errors = [];
    
    // Get service account info
    try {
      const serviceAccount = await iam.projects.serviceAccounts.get({
        name: `projects/${projectId}/serviceAccounts/dba-inventory-services-prod@${projectId}.iam.gserviceaccount.com`
      });
      
      // Check service account details
      if (!serviceAccount.data.displayName) {
        findings.push({
          resource: serviceAccount.data.email,
          type: 'SERVICE_ACCOUNT',
          status: 'FAILED',
          severity: 'LOW',
          description: 'Service account has no display name',
          recommendation: 'Add a descriptive display name'
        });
        summary.failed++;
      } else {
        summary.passed++;
      }
      summary.total++;
      
      if (!serviceAccount.data.description) {
        findings.push({
          resource: serviceAccount.data.email,
          type: 'SERVICE_ACCOUNT',
          status: 'FAILED',
          severity: 'LOW',
          description: 'Service account has no description',
          recommendation: 'Add a description explaining the service account\'s purpose'
        });
        summary.failed++;
      } else {
        summary.passed++;
      }
      summary.total++;
      
      // Check service account keys
      const keys = await iam.projects.serviceAccounts.keys.list({
        name: serviceAccount.data.name
      });
      
      if (keys.data.keys) {
        for (const key of keys.data.keys) {
          const keyAge = Date.now() - new Date(key.validAfterTime).getTime();
          const daysOld = Math.floor(keyAge / (1000 * 60 * 60 * 24));
          
          if (daysOld > 90) {
            findings.push({
              resource: serviceAccount.data.email,
              type: 'SERVICE_ACCOUNT_KEY',
              status: 'FAILED',
              severity: 'HIGH',
              description: `Service account key is ${daysOld} days old`,
              recommendation: 'Rotate service account key every 90 days'
            });
            summary.failed++;
          } else {
            summary.passed++;
          }
          summary.total++;
        }
      }
      
      // Check IAM policy
      const policy = await resourceManager.projects.getIamPolicy({
        resource: projectId,
        requestBody: {
          options: {
            requestedPolicyVersion: 3
          }
        }
      });
      
      // Check for required roles
      const requiredRoles = [
        'roles/iam.serviceAccountUser',
        'roles/iam.serviceAccountTokenCreator',
        'roles/cloudasset.viewer',
        'roles/cloudbilling.viewer',
        'roles/compute.viewer',
        'roles/container.viewer',
        'roles/dns.reader',
        'roles/iam.securityReviewer',
        'roles/logging.viewer',
        'roles/monitoring.viewer',
        'roles/securitycenter.viewer',
        'roles/storage.objectViewer'
      ];
      
      for (const role of requiredRoles) {
        const hasRole = policy.data.bindings.some(binding => 
          binding.role === role && 
          binding.members.some(member => 
            member.startsWith('serviceAccount:') && 
            member.includes(serviceAccount.data.email)
          )
        );
        
        if (!hasRole) {
          findings.push({
            resource: serviceAccount.data.email,
            type: 'SERVICE_ACCOUNT_ROLE',
            status: 'FAILED',
            severity: 'HIGH',
            description: `Missing required role: ${role}`,
            recommendation: `Grant the ${role} role to the service account`
          });
          summary.failed++;
      } else {
          summary.passed++;
        }
        summary.total++;
      }
      
    } catch (error) {
      errors.push({
        resource: 'Service Account',
        error: error.message
      });
    }
    
    // Write results
    await writeAuditResults('service-account-verification', findings, summary, errors, projectId);
    
    // Print summary
    console.log('\nService Account Verification Summary:');
    console.log('===================================');
    console.log(`Total checks: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(error => {
        console.log(`- ${error.resource}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Error verifying service account:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyServiceAccount().catch(console.error);
}

module.exports = { verifyServiceAccount }; 