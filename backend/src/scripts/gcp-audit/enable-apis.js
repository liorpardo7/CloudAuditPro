const { google } = require('googleapis');
const gcpClient = require('./gcpClient');

const REQUIRED_APIS = [
  'compute.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'orgpolicy.googleapis.com',
  'serviceusage.googleapis.com',
  'container.googleapis.com',
  'cloudfunctions.googleapis.com',
  'bigquery.googleapis.com',
  'storage.googleapis.com',
  'monitoring.googleapis.com',
  'logging.googleapis.com',
  'iam.googleapis.com',
  'dlp.googleapis.com',
  'cloudsql.googleapis.com'
];

async function enableApis() {
  try {
    const authClient = await gcpClient.getAuthClient();
    const projectId = await gcpClient.getProjectId();
    const serviceUsage = google.serviceusage({ version: 'v1', auth: authClient });

    console.log(`Enabling APIs for project ${projectId}...`);

    for (const api of REQUIRED_APIS) {
      try {
        console.log(`Enabling ${api}...`);
        await serviceUsage.services.enable({
          name: `projects/${projectId}/services/${api}`
        });
        console.log(`Successfully enabled ${api}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`${api} is already enabled`);
        } else {
          console.error(`Error enabling ${api}:`, error.message);
        }
      }
    }

    console.log('API enablement process complete');
  } catch (error) {
    console.error('Error in API enablement process:', error);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  enableApis().catch(console.error);
}

module.exports = { enableApis }; 