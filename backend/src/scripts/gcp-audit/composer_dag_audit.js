const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { getAuthClient, getProjectId } = require('./auth');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

let composer;

async function initializeComposer() {
  const authClient = await getAuthClient();
  composer = google.composer({
    version: 'v1',
    auth: authClient
  });
}

async function getValidLocations() {
  try {
    const response = await composer.projects.locations.list({
      name: `projects/${await getProjectId()}`
    });
    return response.data.locations.map(loc => loc.locationId);
  } catch (error) {
    console.error('Error getting valid locations:', error.message);
    // Return default locations if API call fails
    return ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'];
  }
}

async function getAirflowWebserverUrl(environment) {
  // Composer 2: config.airflowUri
  return environment.config?.airflowUri;
}

async function getIapIdToken(targetAudience) {
  // Use google-auth-library to get an ID token for IAP
  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(targetAudience);
  const headers = await client.getRequestHeaders();
  return headers.Authorization;
}

async function callAirflowApi(webserverUrl, endpoint, idToken) {
  const url = `${webserverUrl}/api/v1${endpoint}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    throw new Error(`Airflow API call failed: ${error.message}`);
  }
}

async function runComposerDagAudit() {
  const results = {
    timestamp: new Date().toISOString(),
    projectId: null,
    findings: [],
    summary: {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      costSavingsPotential: 0
    },
    errors: []
  };

  try {
    console.log('Starting Composer/Airflow DAG audit...');
    await initializeComposer();
    results.projectId = await getProjectId();
    
    // Get valid locations
    const validLocations = await getValidLocations();
    console.log('Valid locations:', validLocations);
    
    // List all Composer environments across valid locations
    const allEnvironments = [];
    for (const location of validLocations) {
      try {
        console.log(`Listing Composer environments in ${location}...`);
        const environmentsResponse = await composer.projects.locations.environments.list({
          parent: `projects/${results.projectId}/locations/${location}`
        });
        const environments = environmentsResponse.data.environments || [];
        console.log(`Found ${environments.length} environments in ${location}`);
        allEnvironments.push(...environments);
      } catch (error) {
        console.error(`Error listing environments in ${location}:`, error.message);
        results.errors.push({
          check: 'Environment Listing',
          location,
          error: error.message
        });
      }
    }

    console.log(`Total environments found: ${allEnvironments.length}`);

    // Analyze each environment using Airflow REST API
    for (const environment of allEnvironments) {
      try {
        const webserverUrl = await getAirflowWebserverUrl(environment);
        if (!webserverUrl) {
          throw new Error('No Airflow webserver URL found for environment');
        }
        console.log(`\nAnalyzing environment: ${environment.name}`);
        console.log(`Airflow webserver URL: ${webserverUrl}`);
        // Get IAP ID token
        const idToken = await getIapIdToken(webserverUrl);
        // 1. List DAGs
        const dagsData = await callAirflowApi(webserverUrl, '/dags', idToken);
        const dags = dagsData.dags || [];
        results.findings.push({
          check: 'DAG Listing',
          environment: environment.name,
          result: `Found ${dags.length} DAGs`,
          passed: true,
          details: dags.map(d => d.dag_id)
        });
        results.summary.totalChecks++;
        results.summary.passed++;
        // 2. Analyze each DAG
        for (const dag of dags) {
          // DAG Runs
          let dagRuns = [];
          try {
            const dagRunsData = await callAirflowApi(webserverUrl, `/dags/${dag.dag_id}/dagRuns`, idToken);
            dagRuns = dagRunsData.dag_runs || [];
          } catch (err) {
            results.errors.push({
              check: 'DAG Runs',
              dag: dag.dag_id,
              error: err.message
            });
          }
          // Tasks
          let tasks = [];
          try {
            const tasksData = await callAirflowApi(webserverUrl, `/dags/${dag.dag_id}/tasks`, idToken);
            tasks = tasksData.tasks || [];
          } catch (err) {
            results.errors.push({
              check: 'DAG Tasks',
              dag: dag.dag_id,
              error: err.message
            });
          }
          // Analyze DAG: check for meaningful output, zombie DAGs, long-running tasks, high retry counts
          // Example: Zombie DAG detection
          if (dagRuns.length > 0) {
            const lastRun = dagRuns[0];
            const lastRunDate = new Date(lastRun.start_date);
            const now = new Date();
            const daysSinceLastRun = (now - lastRunDate) / (1000 * 60 * 60 * 24);
            if (daysSinceLastRun > 60) {
              results.findings.push({
                check: 'Zombie DAG Detection',
                environment: environment.name,
                dag: dag.dag_id,
                result: `Last run ${Math.floor(daysSinceLastRun)} days ago`,
                passed: false,
                recommendation: 'Consider removing or updating DAG'
              });
              results.summary.failed++;
            } else {
              results.findings.push({
                check: 'Zombie DAG Detection',
                environment: environment.name,
                dag: dag.dag_id,
                result: `Last run ${Math.floor(daysSinceLastRun)} days ago`,
                passed: true
              });
              results.summary.passed++;
            }
            results.summary.totalChecks++;
          }
          // Example: Long-running tasks
          for (const task of tasks) {
            if (task.duration && task.duration > 3600) {
              results.findings.push({
                check: 'Long-running Task',
                environment: environment.name,
                dag: dag.dag_id,
                task: task.task_id,
                duration: task.duration,
                passed: false,
                recommendation: 'Optimize task or split into smaller tasks'
              });
              results.summary.failed++;
              results.summary.totalChecks++;
            }
            if (task.retries && task.retries > 3) {
              results.findings.push({
                check: 'High Retry Count',
                environment: environment.name,
                dag: dag.dag_id,
                task: task.task_id,
                retryCount: task.retries,
                passed: false,
                recommendation: 'Investigate task failures and improve error handling'
              });
              results.summary.failed++;
              results.summary.totalChecks++;
            }
          }
        }
      } catch (err) {
        console.error(`Error analyzing environment ${environment.name}:`, err.message);
        results.errors.push({
          check: 'Environment Analysis',
          environment: environment.name,
          error: err.message
        });
      }
    }

    // Write results
    await writeAuditResults('composer-dag-audit', results.findings, results.summary, results.errors, results.projectId);
    return results;

  } catch (error) {
    console.error('Error during Composer/Airflow DAG audit:', error);
    results.errors.push({
      type: 'Fatal Error',
      error: error.message
    });
    await writeAuditResults('composer-dag-audit', results.findings, results.summary, results.errors, await getProjectId());
    throw error;
  }
}

// Run the audit
runComposerDagAudit().catch(console.error); 