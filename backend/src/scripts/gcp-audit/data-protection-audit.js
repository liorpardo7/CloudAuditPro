const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('../../config/gcp-service-account.json');

// Initialize auth client
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/dlp.readonly'
  ]
});

// Initialize the DLP API client with auth
const dlp = google.dlp({
  version: 'v2',
  auth: auth
});

// Initialize other clients with auth
const storage = new Storage({
  credentials: credentials
});

// Initialize Resource Manager client
const resourceManager = google.cloudresourcemanager({
  version: 'v1',
  auth: auth
});

async function auditDataProtection(projectId = 'dba-inventory-services-prod') {
  const results = {
    timestamp: new Date().toISOString(),
    projectId: projectId,
    dataProtection: {
      dataClassification: {},
      privacyControls: {}
    }
  };

  try {
    // Data Classification Checks
    console.log('Checking data classification...');
    const [inspectTemplates] = await dlp.projects.locations.inspectTemplates.list({
      parent: `projects/${projectId}`,
    });
    
    results.dataProtection.dataClassification.inspectTemplates = inspectTemplates.map(template => ({
      name: template.name,
      displayName: template.displayName,
      description: template.description,
      createTime: template.createTime,
      updateTime: template.updateTime
    }));

    // Privacy Controls Checks
    console.log('Checking privacy controls...');
    const [projects] = await resourceManager.projects.list();
    
    results.dataProtection.privacyControls.projects = await Promise.all(projects.map(async (project) => {
      const [iamPolicy] = await resourceManager.projects.getIamPolicy({
        resource: project.projectId,
      });

      return {
        projectId: project.projectId,
        name: project.name,
        labels: project.labels,
        iamPolicy: iamPolicy
      };
    }));

    // Save results
    const resultsPath = path.join(__dirname, 'data-protection-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Data protection audit completed successfully');
    return results;

  } catch (error) {
    console.error('Error in data protection audit:', error);
    throw error;
  }
}

// Run the audit
auditDataProtection().catch(console.error); 