const { google } = require('googleapis');
const { getAuthClient, getProjectId } = require('./auth');

async function testAuth() {
  try {
    console.log('Testing GCP authentication...');
    
    // Get auth client and project ID
    const auth = await getAuthClient();
    const projectId = await getProjectId();
    
    // Initialize API clients
    const compute = google.compute({ version: 'v1', auth });
    const storage = google.storage({ version: 'v1', auth });
    const iam = google.iam({ version: 'v1', auth });
    const monitoring = google.monitoring({ version: 'v3', auth });
    const securitycenter = google.securitycenter({ version: 'v1', auth });
    
    // Test Compute Engine API
    try {
      await compute.zones.list({ project: projectId });
      console.log('✓ Compute Engine API access verified');
    } catch (error) {
      console.error('✗ Compute Engine API access failed:', error.message);
    }
    
    // Test Storage API
    try {
      await storage.buckets.list({ project: projectId });
      console.log('✓ Storage API access verified');
    } catch (error) {
      console.error('✗ Storage API access failed:', error.message);
    }
    
    // Test IAM API
    try {
      await iam.projects.serviceAccounts.list({ name: `projects/${projectId}` });
      console.log('✓ IAM API access verified');
    } catch (error) {
      console.error('✗ IAM API access failed:', error.message);
    }
    
    // Test Monitoring API
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      
      await monitoring.projects.timeSeries.list({
        name: `projects/${projectId}`,
        filter: 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
        'interval.startTime': oneHourAgo.toISOString(),
        'interval.endTime': now.toISOString()
      });
      console.log('✓ Monitoring API access verified');
    } catch (error) {
      console.error('✗ Monitoring API access failed:', error.message);
    }
    
    // Test Security Command Center API
    try {
      await securitycenter.organizations.sources.list({
        parent: `projects/${projectId}`
      });
      console.log('✓ Security Command Center API access verified');
    } catch (error) {
      console.error('✗ Security Command Center API access failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error testing authentication:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testAuth().catch(console.error);
}

module.exports = { testAuth }; 