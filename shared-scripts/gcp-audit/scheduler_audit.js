// @audit-status: VERIFIED
// @last-tested: 2024-03-19
// @test-results: Script runs successfully, generates valid results file with proper structure
const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');

async function run(projectId, tokens) {
  const findings = [];
  const errors = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0
  };
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    // Initialize Cloud Scheduler API
    const scheduler = google.cloudscheduler({ version: 'v1', auth: authClient });
    // List all valid locations
    const locationsResponse = await scheduler.projects.locations.list({
      name: `projects/${projectId}`
    });
    const locations = (locationsResponse.data.locations || []).map(loc => loc.locationId);
    console.log(`Found locations: ${locations.join(', ')}`);
    // List all jobs in all locations
    let jobs = [];
    for (const location of locations) {
      try {
        const jobsResponse = await scheduler.projects.locations.jobs.list({
          parent: `projects/${projectId}/locations/${location}`
        });
        jobs = jobs.concat(jobsResponse.data.jobs || []);
      } catch (error) {
        console.error(`Error listing jobs in location ${location}:`, error.message);
        errors.push({
          location,
          error: error.message
        });
      }
    }
    console.log(`Found ${jobs.length} Cloud Scheduler jobs`);
    // Audit each job
    for (const job of jobs) {
      try {
        // Check job configuration
        const jobConfig = job.httpTarget || job.pubsubTarget || job.appEngineHttpTarget;
        // Check schedule frequency
        const schedule = job.schedule;
        if (schedule) {
          const frequency = analyzeScheduleFrequency(schedule);
          findings.push({
            check: 'Schedule Frequency',
            resource: job.name,
            result: frequency.analysis,
            passed: frequency.isOptimal,
            recommendation: frequency.recommendation
          });
          summary.totalChecks++;
          frequency.isOptimal ? summary.passed++ : summary.failed++;
        }
        // Check retry configuration
        if (jobConfig && jobConfig.retryConfig) {
          const retryAnalysis = analyzeRetryConfig(jobConfig.retryConfig);
          findings.push({
            check: 'Retry Configuration',
            resource: job.name,
            result: retryAnalysis.analysis,
            passed: retryAnalysis.isOptimal,
            recommendation: retryAnalysis.recommendation
          });
          summary.totalChecks++;
          retryAnalysis.isOptimal ? summary.passed++ : summary.failed++;
        }
        // Check target configuration
        if (jobConfig) {
          const targetAnalysis = analyzeTargetConfig(jobConfig);
          findings.push({
            check: 'Target Configuration',
            resource: job.name,
            result: targetAnalysis.analysis,
            passed: targetAnalysis.isOptimal,
            recommendation: targetAnalysis.recommendation
          });
          summary.totalChecks++;
          targetAnalysis.isOptimal ? summary.passed++ : summary.failed++;
        }
        // Check timezone configuration
        if (job.timeZone) {
          const timezoneAnalysis = analyzeTimezone(job.timeZone);
          findings.push({
            check: 'Timezone Configuration',
            resource: job.name,
            result: timezoneAnalysis.analysis,
            passed: timezoneAnalysis.isOptimal,
            recommendation: timezoneAnalysis.recommendation
          });
          summary.totalChecks++;
          timezoneAnalysis.isOptimal ? summary.passed++ : summary.failed++;
        }
      } catch (error) {
        console.error(`Error auditing job ${job.name}:`, error.message);
        errors.push({
          job: job.name,
          error: error.message
        });
      }
    }
    // Write results
    await writeAuditResults('scheduler-audit', findings, summary, errors, projectId);
    return {
      findings,
      summary,
      errors
    };
  } catch (error) {
    console.error('Error running scheduler audit:', error);
    errors.push({
      type: 'Fatal Error',
      error: error.message
    });
    await writeAuditResults('scheduler-audit', findings, summary, errors, projectId);
    throw error;
  }
}

function analyzeScheduleFrequency(schedule) {
  // Parse cron expression
  const parts = schedule.split(' ');
  const minute = parts[0];
  const hour = parts[1];
  
  // Check for very frequent schedules (< 5 minutes)
  if (minute.includes('*/') && parseInt(minute.split('*/')[1]) < 5) {
    return {
      analysis: 'Very frequent schedule detected',
      isOptimal: false,
      recommendation: 'Consider using Cloud Tasks or Pub/Sub for high-frequency jobs'
    };
  }
  
  // Check for irregular schedules
  if (minute.includes(',') || hour.includes(',')) {
    return {
      analysis: 'Irregular schedule pattern detected',
      isOptimal: true,
      recommendation: 'Ensure irregular patterns are intentional'
    };
  }
  
  return {
    analysis: 'Standard schedule pattern',
    isOptimal: true,
    recommendation: 'Schedule pattern is appropriate'
  };
}

function analyzeRetryConfig(retryConfig) {
  const maxRetries = retryConfig.maxRetries || 0;
  const maxBackoffDuration = retryConfig.maxBackoffDuration || '0s';
  const minBackoffDuration = retryConfig.minBackoffDuration || '0s';
  
  // Check for excessive retries
  if (maxRetries > 5) {
    return {
      analysis: 'High retry count configured',
      isOptimal: false,
      recommendation: 'Consider reducing retry count and implementing better error handling'
    };
  }
  
  // Check for aggressive backoff
  const maxBackoff = parseInt(maxBackoffDuration);
  if (maxBackoff < 60) {
    return {
      analysis: 'Aggressive retry backoff',
      isOptimal: false,
      recommendation: 'Consider increasing max backoff duration to reduce system load'
    };
  }
  
  return {
    analysis: 'Standard retry configuration',
    isOptimal: true,
    recommendation: 'Retry configuration is appropriate'
  };
}

function analyzeTargetConfig(targetConfig) {
  // Check for HTTP target
  if (targetConfig.uri) {
    if (!targetConfig.uri.startsWith('https://')) {
      return {
        analysis: 'Non-HTTPS endpoint configured',
        isOptimal: false,
        recommendation: 'Use HTTPS endpoints for secure communication'
      };
    }
  }
  
  // Check for Pub/Sub target
  if (targetConfig.topicName) {
    if (!targetConfig.attributes) {
      return {
        analysis: 'Pub/Sub target without attributes',
        isOptimal: false,
        recommendation: 'Consider adding attributes for better message tracking'
      };
    }
  }
  
  return {
    analysis: 'Standard target configuration',
    isOptimal: true,
    recommendation: 'Target configuration is appropriate'
  };
}

function analyzeTimezone(timezone) {
  // Check for non-UTC timezone
  if (timezone !== 'UTC') {
    return {
      analysis: 'Non-UTC timezone configured',
      isOptimal: false,
      recommendation: 'Consider using UTC for consistency across regions'
    };
  }
  
  return {
    analysis: 'UTC timezone configured',
    isOptimal: true,
    recommendation: 'Timezone configuration is appropriate'
  };
}

module.exports = { run }; 