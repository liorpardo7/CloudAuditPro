const { google } = require('googleapis');
const { getAuthClient, getProjectId } = require('./auth');
const { writeAuditResults } = require('./writeAuditResults');

async function verifyChecklist() {
  try {
    console.log('Starting checklist verification...');
    
    // Get auth client and project ID
    const auth = await getAuthClient();
    const projectId = await getProjectId();
    
    // Initialize API clients
    const compute = google.compute({ version: 'v1', auth });
    const storage = google.storage({ version: 'v1', auth });
    const iam = google.iam({ version: 'v1', auth });
    const monitoring = google.monitoring({ version: 'v3', auth });
    const securitycenter = google.securitycenter({ version: 'v1', auth });
    
    const findings = [];
    const summary = { total: 0, passed: 0, failed: 0 };
    const errors = [];
    
    // Check Compute Engine instances
    try {
      const instances = await compute.instances.list({ project: projectId });
        if (instances.data.items) {
        for (const instance of instances.data.items) {
          // Check for public IP
          const hasPublicIP = instance.networkInterfaces?.some(iface => 
            iface.accessConfigs?.some(config => config.natIP)
          );
          
          if (hasPublicIP) {
            findings.push({
              resource: instance.name,
              type: 'COMPUTE_INSTANCE',
              status: 'FAILED',
              severity: 'HIGH',
              description: 'Instance has public IP',
              recommendation: 'Review if public IP is necessary'
            });
            summary.failed++;
          } else {
            summary.passed++;
          }
          summary.total++;
        }
      }
    } catch (error) {
      errors.push({
        resource: 'Compute Engine',
        error: error.message
      });
    }
    
    // Check Storage buckets
    try {
      const buckets = await storage.buckets.list({ project: projectId });
      if (buckets.data.items) {
        for (const bucket of buckets.data.items) {
          // Check for public access
          const iamPolicy = await storage.buckets.getIamPolicy({ bucket: bucket.name });
          const isPublic = iamPolicy.data.bindings?.some(binding => 
            binding.role === 'roles/storage.objectViewer' && 
            binding.members.includes('allUsers')
          );
          
          if (isPublic) {
            findings.push({
              resource: bucket.name,
              type: 'STORAGE_BUCKET',
              status: 'FAILED',
              severity: 'HIGH',
              description: 'Bucket has public access',
              recommendation: 'Review and restrict bucket access'
            });
            summary.failed++;
          } else {
            summary.passed++;
          }
          summary.total++;
        }
      }
    } catch (error) {
      errors.push({
        resource: 'Storage',
        error: error.message
      });
    }

    // Check IAM service accounts
    try {
      const serviceAccounts = await iam.projects.serviceAccounts.list({
        name: `projects/${projectId}`
      });
      
      if (serviceAccounts.data.accounts) {
        for (const sa of serviceAccounts.data.accounts) {
          // Check for service account key age
          const keys = await iam.projects.serviceAccounts.keys.list({
            name: sa.name
          });
          
          if (keys.data.keys) {
            for (const key of keys.data.keys) {
              const keyAge = Date.now() - new Date(key.validAfterTime).getTime();
              const daysOld = Math.floor(keyAge / (1000 * 60 * 60 * 24));
              
              if (daysOld > 90) {
                findings.push({
                  resource: sa.email,
                  type: 'SERVICE_ACCOUNT_KEY',
                  status: 'FAILED',
                  severity: 'MEDIUM',
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
        }
      }
    } catch (error) {
      errors.push({
        resource: 'IAM',
        error: error.message
      });
    }

    // Write results
    await writeAuditResults('checklist-verification', findings, summary, errors, projectId);

    // Print summary
    console.log('\nChecklist Verification Summary:');
    console.log('===============================');
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
    console.error('Error during checklist verification:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyChecklist().catch(console.error);
}

module.exports = { verifyChecklist }; 