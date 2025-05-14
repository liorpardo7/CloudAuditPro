const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

let composer;

async function initializeComposer() {
  const authClient = auth.getAuthClient();
  composer = google.composer({
    version: 'v1',
    auth: authClient
  });
}

async function runComposerDagAudit() {
  try {
    console.log('Starting Composer/Airflow DAG audit...');
    await initializeComposer();
    const projectId = auth.getProjectId();
    
    const results = {
      timestamp: new Date().toISOString(),
      projectId: projectId,
      findings: [],
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        costSavingsPotential: 0
      },
      errors: []
    };

    // List all Composer environments
    try {
      console.log('Listing Composer environments...');
      const environmentsResponse = await composer.projects.locations.environments.list({
        parent: `projects/${projectId}/locations/-`
      });
      const environments = environmentsResponse.data.environments || [];
      console.log(`Found ${environments.length} Composer environments`);

      // Analyze each environment
      for (const environment of environments) {
        console.log(`\nAnalyzing environment: ${environment.name}`);
        
        // 1. DAG Execution Analysis
        try {
          const dagAnalysis = await analyzeDagExecution(environment);
          results.findings.push({
            check: 'DAG Execution Analysis',
            environment: environment.name,
            result: `Analyzed ${dagAnalysis.dags.length} DAGs`,
            passed: dagAnalysis.issues.length === 0,
            details: dagAnalysis
          });
          results.summary.totalChecks++;
          results.summary.passed += dagAnalysis.issues.length === 0 ? 1 : 0;
          results.summary.failed += dagAnalysis.issues.length === 0 ? 0 : 1;
        } catch (err) {
          results.errors.push({ check: 'DAG Execution Analysis', environment: environment.name, error: err.message });
          results.summary.failed++;
          results.summary.totalChecks++;
        }

        // 2. Task Performance Analysis
        try {
          const taskAnalysis = await analyzeTaskPerformance(environment);
          results.findings.push({
            check: 'Task Performance Analysis',
            environment: environment.name,
            result: `Found ${taskAnalysis.issues.length} performance issues`,
            passed: taskAnalysis.issues.length === 0,
            details: taskAnalysis
          });
          results.summary.totalChecks++;
          results.summary.passed += taskAnalysis.issues.length === 0 ? 1 : 0;
          results.summary.failed += taskAnalysis.issues.length === 0 ? 0 : 1;
        } catch (err) {
          results.errors.push({ check: 'Task Performance Analysis', environment: environment.name, error: err.message });
          results.summary.failed++;
          results.summary.totalChecks++;
        }

        // 3. Zombie DAG Detection
        try {
          const zombieAnalysis = await detectZombieDags(environment);
          results.findings.push({
            check: 'Zombie DAG Detection',
            environment: environment.name,
            result: `Found ${zombieAnalysis.zombieDags.length} zombie DAGs`,
            passed: zombieAnalysis.zombieDags.length === 0,
            details: zombieAnalysis
          });
          results.summary.totalChecks++;
          results.summary.passed += zombieAnalysis.zombieDags.length === 0 ? 1 : 0;
          results.summary.failed += zombieAnalysis.zombieDags.length === 0 ? 0 : 1;
        } catch (err) {
          results.errors.push({ check: 'Zombie DAG Detection', environment: environment.name, error: err.message });
          results.summary.failed++;
          results.summary.totalChecks++;
        }

        // 4. Environment Sprawl Analysis
        try {
          const sprawlAnalysis = await analyzeEnvironmentSprawl(environments);
          results.findings.push({
            check: 'Environment Sprawl Analysis',
            environment: environment.name,
            result: `Found ${sprawlAnalysis.consolidationOpportunities.length} consolidation opportunities`,
            passed: sprawlAnalysis.consolidationOpportunities.length === 0,
            details: sprawlAnalysis
          });
          results.summary.totalChecks++;
          results.summary.passed += sprawlAnalysis.consolidationOpportunities.length === 0 ? 1 : 0;
          results.summary.failed += sprawlAnalysis.consolidationOpportunities.length === 0 ? 0 : 1;
        } catch (err) {
          results.errors.push({ check: 'Environment Sprawl Analysis', environment: environment.name, error: err.message });
          results.summary.failed++;
          results.summary.totalChecks++;
        }
      }
    } catch (error) {
      console.error('Error listing Composer environments:', error.message);
      results.errors.push({ check: 'Environment Listing', error: error.message });
    }

    // Write results
    await writeAuditResults('composer-dag-audit-results.json', results);
    return results;

  } catch (error) {
    console.error('Error during Composer/Airflow DAG audit:', error);
    throw error;
  }
}

async function analyzeDagExecution(environment) {
  const dags = [];
  const issues = [];
  
  try {
    // Get DAGs from the environment
    const dagsResponse = await composer.projects.locations.environments.dags.list({
      parent: environment.name
    });
    
    for (const dag of dagsResponse.data.dags || []) {
      const dagInfo = {
        name: dag.name,
        schedule: dag.schedule,
        lastRun: dag.lastRun,
        nextRun: dag.nextRun,
        hasMeaningfulOutput: false,
        issues: []
      };

      // Check for meaningful output
      const tasksResponse = await composer.projects.locations.environments.dags.tasks.list({
        parent: dag.name
      });
      
      const tasks = tasksResponse.data.tasks || [];
      let hasOutput = false;
      
      for (const task of tasks) {
        // Check if task produces output (e.g., BigQuery writes, file creation)
        if (task.operator && (
          task.operator.includes('BigQuery') ||
          task.operator.includes('File') ||
          task.operator.includes('Storage')
        )) {
          hasOutput = true;
          break;
        }
      }
      
      if (!hasOutput) {
        dagInfo.issues.push('No meaningful output detected');
        issues.push({
          dag: dag.name,
          issue: 'No meaningful output',
          recommendation: 'Review DAG purpose or add output tasks'
        });
      }
      
      dags.push(dagInfo);
    }
  } catch (error) {
    console.error('Error analyzing DAG execution:', error.message);
    throw error;
  }

  return {
    environment: environment.name,
    dags,
    issues
  };
}

async function analyzeTaskPerformance(environment) {
  const issues = [];
  
  try {
    // Get DAG runs
    const runsResponse = await composer.projects.locations.environments.dagRuns.list({
      parent: environment.name
    });
    
    for (const run of runsResponse.data.dagRuns || []) {
      // Get tasks for this run
      const tasksResponse = await composer.projects.locations.environments.dagRuns.tasks.list({
        parent: run.name
      });
      
      for (const task of tasksResponse.data.tasks || []) {
        // Check for long-running tasks
        if (task.duration && task.duration > 3600) { // >1 hour
          issues.push({
            dag: run.dagId,
            task: task.taskId,
            issue: 'Long-running task',
            duration: task.duration,
            recommendation: 'Optimize task or split into smaller tasks'
          });
        }
        
        // Check for high retry counts
        if (task.retryCount > 3) {
          issues.push({
            dag: run.dagId,
            task: task.taskId,
            issue: 'High retry count',
            retryCount: task.retryCount,
            recommendation: 'Investigate task failures and improve error handling'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing task performance:', error.message);
    throw error;
  }

  return {
    environment: environment.name,
    issues
  };
}

async function detectZombieDags(environment) {
  const zombieDags = [];
  
  try {
    // Get DAGs
    const dagsResponse = await composer.projects.locations.environments.dags.list({
      parent: environment.name
    });
    
    for (const dag of dagsResponse.data.dags || []) {
      // Get last run
      const runsResponse = await composer.projects.locations.environments.dagRuns.list({
        parent: environment.name,
        filter: `dag_id=${dag.name}`,
        orderBy: 'start_date desc',
        pageSize: 1
      });
      
      const lastRun = runsResponse.data.dagRuns?.[0];
      if (lastRun) {
        const lastRunDate = new Date(lastRun.startDate);
        const now = new Date();
        const daysSinceLastRun = (now - lastRunDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastRun > 60) { // >60 days since last run
          zombieDags.push({
            name: dag.name,
            lastRun: lastRun.startDate,
            daysSinceLastRun: Math.floor(daysSinceLastRun),
            recommendation: 'Consider removing or updating DAG'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error detecting zombie DAGs:', error.message);
    throw error;
  }

  return {
    environment: environment.name,
    zombieDags
  };
}

async function analyzeEnvironmentSprawl(environments) {
  const consolidationOpportunities = [];
  
  try {
    // Group environments by region
    const environmentsByRegion = environments.reduce((acc, env) => {
      const region = env.location;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(env);
      return acc;
    }, {});
    
    // Check for consolidation opportunities
    for (const [region, envs] of Object.entries(environmentsByRegion)) {
      if (envs.length > 1) {
        // Compare environment configurations
        const configs = envs.map(env => ({
          name: env.name,
          config: env.config,
          dagCount: env.dagCount || 0
        }));
        
        // Look for similar configurations
        for (let i = 0; i < configs.length; i++) {
          for (let j = i + 1; j < configs.length; j++) {
            if (areConfigsSimilar(configs[i].config, configs[j].config)) {
              consolidationOpportunities.push({
                region,
                environments: [configs[i].name, configs[j].name],
                dagCounts: [configs[i].dagCount, configs[j].dagCount],
                recommendation: 'Consider consolidating these environments'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing environment sprawl:', error.message);
    throw error;
  }

  return {
    consolidationOpportunities
  };
}

function areConfigsSimilar(config1, config2) {
  // Compare key configuration parameters
  return (
    config1.softwareConfig?.airflowConfigOverrides === config2.softwareConfig?.airflowConfigOverrides &&
    config1.softwareConfig?.pythonVersion === config2.softwareConfig?.pythonVersion &&
    config1.softwareConfig?.imageVersion === config2.softwareConfig?.imageVersion
  );
}

module.exports = {
  runComposerDagAudit
}; 