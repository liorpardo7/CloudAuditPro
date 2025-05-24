const { google } = require('googleapis');
const { getAuthClient, getProjectId } = require('./auth');

async function verifyPermissions() {
  try {
    console.log('Verifying GCP permissions...');
    
    // Get auth client and project ID
    const auth = await getAuthClient();
    const projectId = await getProjectId();
    
    // Initialize API clients
    const iam = google.iam({ version: 'v1', auth });
    const resourceManager = google.cloudresourcemanager({ version: 'v1', auth });
    
    // Get IAM policy
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
    
    const missingRoles = [];
    const foundRoles = [];
    
    for (const role of requiredRoles) {
      const hasRole = policy.data.bindings.some(binding => 
        binding.role === role && 
        binding.members.some(member => 
          member.startsWith('serviceAccount:') && 
          member.includes('dba-inventory-services-prod')
        )
      );
      
      if (hasRole) {
        foundRoles.push(role);
      } else {
        missingRoles.push(role);
      }
    }
    
    // Print results
    console.log('\nPermission Verification Results:');
    console.log('===============================');
    
    if (foundRoles.length > 0) {
      console.log('\nFound Roles:');
      foundRoles.forEach(role => console.log(`✓ ${role}`));
    }
    
    if (missingRoles.length > 0) {
      console.log('\nMissing Roles:');
      missingRoles.forEach(role => console.log(`✗ ${role}`));
      console.log('\nPlease grant the missing roles to the service account.');
    } else {
      console.log('\nAll required roles are present!');
    }
    
  } catch (error) {
    console.error('Error verifying permissions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyPermissions().catch(console.error);
}

module.exports = { verifyPermissions }; 