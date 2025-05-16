const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

async function runBigQueryAudit() {
  const findings = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    costSavingsPotential: 0
  };
  const errors = [];

  try {
    const authClient = auth.getAuthClient();
    const projectId = auth.getProjectId();
    const bigquery = google.bigquery({ version: 'v2', auth: authClient });

    // 1. Check for stale partitioning
    try {
      const datasetsResp = await bigquery.datasets.list({
        projectId: projectId
      });
      const datasets = datasetsResp.data.datasets || [];
      const stalePartitioning = [];
      
      for (const dataset of datasets) {
        const tablesResp = await bigquery.tables.list({
          projectId: projectId,
          datasetId: dataset.datasetReference.datasetId
        });
        const tables = tablesResp.data.tables || [];
        
        for (const table of tables) {
          const tableInfo = await bigquery.tables.get({
            projectId: projectId,
            datasetId: dataset.datasetReference.datasetId,
            tableId: table.tableReference.tableId
          });
          
          if (tableInfo.data.timePartitioning) {
            const lastModified = new Date(tableInfo.data.lastModifiedTime);
            const now = new Date();
            const daysSinceModified = (now - lastModified) / (1000 * 60 * 60 * 24);
            
            if (daysSinceModified > 90) { // Consider partitions stale after 90 days
              stalePartitioning.push({
                dataset: dataset.datasetReference.datasetId,
                table: table.tableReference.tableId,
                lastModified: tableInfo.data.lastModifiedTime,
                daysSinceModified: Math.floor(daysSinceModified)
              });
            }
          }
        }
      }
      
      findings.push({
        check: 'Stale Partitioning',
        result: `${stalePartitioning.length} tables with stale partitioning`,
        passed: stalePartitioning.length === 0,
        details: stalePartitioning
      });
      summary.totalChecks++;
      summary.passed += stalePartitioning.length === 0 ? 1 : 0;
      summary.failed += stalePartitioning.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Stale Partitioning', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 2. Identify deprecated UDFs
    try {
      const datasetsResp = await bigquery.datasets.list({
        projectId: projectId
      });
      const datasets = datasetsResp.data.datasets || [];
      const deprecatedUDFs = [];
      
      for (const dataset of datasets) {
        const routinesResp = await bigquery.routines.list({
          projectId: projectId,
          datasetId: dataset.datasetReference.datasetId
        });
        const routines = routinesResp.data.routines || [];
        
        for (const routine of routines) {
          if (routine.routineType === 'SCALAR_FUNCTION' && routine.language === 'SQL') {
            const routineInfo = await bigquery.routines.get({
              projectId: projectId,
              datasetId: dataset.datasetReference.datasetId,
              routineId: routine.routineReference.routineId
            });
            
            if (routineInfo.data.deprecationStatus) {
              deprecatedUDFs.push({
                dataset: dataset.datasetReference.datasetId,
                routine: routine.routineReference.routineId,
                deprecationStatus: routineInfo.data.deprecationStatus
              });
            }
          }
        }
      }
      
      findings.push({
        check: 'Deprecated UDFs',
        result: `${deprecatedUDFs.length} deprecated UDFs found`,
        passed: deprecatedUDFs.length === 0,
        details: deprecatedUDFs
      });
      summary.totalChecks++;
      summary.passed += deprecatedUDFs.length === 0 ? 1 : 0;
      summary.failed += deprecatedUDFs.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Deprecated UDFs', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 3. Query optimization analysis
    try {
      const jobsResp = await bigquery.jobs.list({
        projectId: projectId,
        maxResults: 100,
        stateFilter: 'DONE'
      });
      const jobs = jobsResp.data.jobs || [];
      const queryOptimization = jobs.map(job => ({
        jobId: job.id,
        query: job.configuration.query.query,
        bytesProcessed: job.statistics.totalBytesProcessed,
        slotMs: job.statistics.totalSlotMs,
        cacheHit: job.statistics.query.cacheHit
      }));
      
      findings.push({
        check: 'Query Optimization',
        result: `${queryOptimization.length} recent queries analyzed`,
        passed: queryOptimization.length > 0,
        details: queryOptimization
      });
      summary.totalChecks++;
      summary.passed += queryOptimization.length > 0 ? 1 : 0;
      summary.failed += queryOptimization.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Query Optimization', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 4. BigQuery cost optimization
    try {
      const datasetsResp = await bigquery.datasets.list({
        projectId: projectId
      });
      const datasets = datasetsResp.data.datasets || [];
      const costOptimization = [];
      
      for (const dataset of datasets) {
        const tablesResp = await bigquery.tables.list({
          projectId: projectId,
          datasetId: dataset.datasetReference.datasetId
        });
        const tables = tablesResp.data.tables || [];
        
        for (const table of tables) {
          const tableInfo = await bigquery.tables.get({
            projectId: projectId,
            datasetId: dataset.datasetReference.datasetId,
            tableId: table.tableReference.tableId
          });
          
          if (tableInfo.data.numBytes > 1024 * 1024 * 1024) { // Tables larger than 1GB
            costOptimization.push({
              dataset: dataset.datasetReference.datasetId,
              table: table.tableReference.tableId,
              sizeBytes: tableInfo.data.numBytes,
              rowCount: tableInfo.data.numRows,
              lastModified: tableInfo.data.lastModifiedTime
            });
          }
        }
      }
      
      findings.push({
        check: 'Cost Optimization',
        result: `${costOptimization.length} large tables identified`,
        passed: costOptimization.length === 0,
        details: costOptimization
      });
      summary.totalChecks++;
      summary.passed += costOptimization.length === 0 ? 1 : 0;
      summary.failed += costOptimization.length === 0 ? 0 : 1;
  } catch (err) {
      errors.push({ check: 'Cost Optimization', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 5. Dataset access controls review
    try {
      const datasetsResp = await bigquery.datasets.list({
        projectId: projectId
      });
      const datasets = datasetsResp.data.datasets || [];
      const accessControls = [];
      
      for (const dataset of datasets) {
        const datasetInfo = await bigquery.datasets.get({
          projectId: projectId,
          datasetId: dataset.datasetReference.datasetId
        });
        
        accessControls.push({
          dataset: dataset.datasetReference.datasetId,
          access: datasetInfo.data.access,
          defaultTableExpirationMs: datasetInfo.data.defaultTableExpirationMs,
          labels: datasetInfo.data.labels
        });
      }
      
      findings.push({
        check: 'Dataset Access Controls',
        result: `${accessControls.length} datasets reviewed`,
        passed: accessControls.length > 0,
        details: accessControls
      });
      summary.totalChecks++;
      summary.passed += accessControls.length > 0 ? 1 : 0;
      summary.failed += accessControls.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Dataset Access Controls', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // 6. BigQuery job monitoring
    try {
      const jobsResp = await bigquery.jobs.list({
        projectId: projectId,
        maxResults: 100,
        stateFilter: 'RUNNING'
      });
      const jobs = jobsResp.data.jobs || [];
      const jobMonitoring = jobs.map(job => ({
        jobId: job.id,
        state: job.status.state,
        errorResult: job.status.errorResult,
        startTime: job.statistics.startTime,
        endTime: job.statistics.endTime,
        totalBytesProcessed: job.statistics.totalBytesProcessed,
        totalSlotMs: job.statistics.totalSlotMs
      }));
      
      findings.push({
        check: 'Job Monitoring',
        result: `${jobMonitoring.length} running jobs`,
        passed: jobMonitoring.length > 0,
        details: jobMonitoring
      });
      summary.totalChecks++;
      summary.passed += jobMonitoring.length > 0 ? 1 : 0;
      summary.failed += jobMonitoring.length > 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Job Monitoring', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

  } catch (err) {
    errors.push({ check: 'BigQuery Audit', error: err.message });
  }

  writeAuditResults('bigquery-audit', findings, summary, errors, projectId);
}

runBigQueryAudit(); 
