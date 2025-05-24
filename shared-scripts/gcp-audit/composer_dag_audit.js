const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const axios = require('axios');

async function run(projectId, tokens) {
  const findings = [];
  const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
  const errors = [];
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const composer = google.composer({ version: 'v1', auth: authClient });
    const crm = google.cloudresourcemanager('v1');
    
    // Get valid locations
    let validLocations = [];
    try {
      const response = await composer.projects.locations.list({ name: `projects/${projectId}` });
      validLocations = response.data.locations.map(loc => loc.locationId);
    } catch (error) {
      console.error('Error getting valid locations:', error.message);
      validLocations = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'];
    }
    console.log('Valid locations:', validLocations);
    
    // List all Composer environments across valid locations
    const allEnvironments = [];
    for (const location of validLocations) {
      try {
        console.log(`Listing Composer environments in ${location}...`);
        const environmentsResponse = await composer.projects.locations.environments.list({
          parent: `projects/${projectId}/locations/${location}`
        });
        const environments = environmentsResponse.data.environments || [];
        console.log(`Found ${environments.length} environments in ${location}`);
        allEnvironments.push(...environments);
      } catch (error) {
        console.error(`Error listing environments in ${location}:`, error.message);
        errors.push({
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
        const webserverUrl = environment.config?.airflowUri;
        if (!webserverUrl) {
          throw new Error('No Airflow webserver URL found for environment');
        }
        console.log(`\nAnalyzing environment: ${environment.name}`);
        console.log(`Airflow webserver URL: ${webserverUrl}`);
        // Get IAP ID token (if needed, implement with tokens)
        // 1. List DAGs
        const dagsData = await callAirflowApi(webserverUrl, '/dags', idToken);
        const dags = dagsData.dags || [];
        findings.push({
          check: 'DAG Listing',
          environment: environment.name,
          result: `Found ${dags.length} DAGs`,
          passed: true,
          details: dags.map(d => d.dag_id)
        });
        summary.totalChecks++;
        summary.passed++;
        // 2. Analyze each DAG
        for (const dag of dags) {
          // DAG Runs
          let dagRuns = [];
          try {
            const dagRunsData = await callAirflowApi(webserverUrl, `/dags/${dag.dag_id}/dagRuns`, idToken);
            dagRuns = dagRunsData.dag_runs || [];
          } catch (err) {
            errors.push({
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
            errors.push({
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
              findings.push({
                check: 'Zombie DAG Detection',
                environment: environment.name,
                dag: dag.dag_id,
                result: `Last run ${Math.floor(daysSinceLastRun)} days ago`,
                passed: false,
                recommendation: 'Consider removing or updating DAG'
              });
              summary.failed++;
            } else {
              findings.push({
                check: 'Zombie DAG Detection',
                environment: environment.name,
                dag: dag.dag_id,
                result: `Last run ${Math.floor(daysSinceLastRun)} days ago`,
                passed: true
              });
              summary.passed++;
            }
            summary.totalChecks++;
          }
          // Example: Long-running tasks
          for (const task of tasks) {
            if (task.duration && task.duration > 3600) {
              findings.push({
                check: 'Long-running Task',
                environment: environment.name,
                dag: dag.dag_id,
                task: task.task_id,
                duration: task.duration,
                passed: false,
                recommendation: 'Optimize task or split into smaller tasks'
              });
              summary.failed++;
              summary.totalChecks++;
            }
            if (task.retries && task.retries > 3) {
              findings.push({
                check: 'High Retry Count',
                environment: environment.name,
                dag: dag.dag_id,
                task: task.task_id,
                retryCount: task.retries,
                passed: false,
                recommendation: 'Investigate task failures and improve error handling'
              });
              summary.failed++;
              summary.totalChecks++;
            }
          }
        }
      } catch (error) {
        console.error(`Error analyzing environment ${environment.name}:`, error.message);
        errors.push({
          check: 'Environment Analysis',
          environment: environment.name,
          error: error.message
        });
      }
    }

    await writeAuditResults('composer-dag-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (error) {
    console.error('Error running Composer DAG audit:', error);
    throw error;
  }
}

module.exports = { run }; 