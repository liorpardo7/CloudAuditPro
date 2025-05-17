// @audit-status: VERIFIED
// @last-tested: 2024-03-19
// @test-results: Script runs successfully, generates valid results file with proper structure
const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');

async function run(projectId, tokens) {
  const findings = [];
  const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
  const errors = [];
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    // Initialize APIs
    const pubsub = google.pubsub({ version: 'v1', auth: authClient });
    // List all topics
    try {
      const topicsResponse = await pubsub.projects.topics.list({
        auth: authClient,
        project: `projects/${projectId}`
      });
      const topics = topicsResponse.data.topics || [];
      // Audit each topic
      for (const topic of topics) {
        const topicName = topic.name.split('/').pop();
        // Check topic IAM policy
        try {
          const iamResponse = await pubsub.projects.topics.getIamPolicy({
            auth: authClient,
            resource: topic.name
          });
          findings.push({
            check: 'Topic IAM Policy',
            resource: topicName,
            result: 'IAM policy retrieved',
            passed: true,
            details: iamResponse.data
          });
          summary.totalChecks++;
          summary.passed++;
        } catch (err) {
          errors.push({ check: 'Topic IAM Policy', resource: topicName, error: err.message });
          summary.failed++;
          summary.totalChecks++;
        }
        // Get topic subscriptions
        try {
          const subscriptionsResponse = await pubsub.projects.topics.subscriptions.list({
            auth: authClient,
            topic: topic.name
          });
          const subscriptions = subscriptionsResponse.data.subscriptions || [];
          // Audit each subscription
          for (const subscription of subscriptions) {
            const subName = subscription.split('/').pop();
            // Get subscription details
            const subResponse = await pubsub.projects.subscriptions.get({
              auth: authClient,
              name: subscription
            });
            const subDetails = subResponse.data;
            // Check for dead letter queue
            if (!subDetails.deadLetterPolicy) {
              findings.push({
                check: 'Dead Letter Queue',
                resource: subName,
                result: 'No dead letter queue configured',
                passed: false,
                recommendation: 'Configure dead letter queue to handle failed message delivery'
              });
              summary.failed++;
            } else {
              findings.push({
                check: 'Dead Letter Queue',
                resource: subName,
                result: 'Dead letter queue configured',
                passed: true,
                details: subDetails.deadLetterPolicy
              });
              summary.passed++;
            }
            summary.totalChecks++;
            // Check message retention
            if (subDetails.messageRetentionDuration) {
              const retentionHours = parseInt(subDetails.messageRetentionDuration.replace('s', '')) / 3600;
              if (retentionHours > 7) {
                findings.push({
                  check: 'Message Retention',
                  resource: subName,
                  result: `Message retention set to ${retentionHours} hours`,
                  passed: false,
                  recommendation: 'Consider reducing message retention to save costs'
                });
                summary.failed++;
              } else {
                findings.push({
                  check: 'Message Retention',
                  resource: subName,
                  result: `Message retention set to ${retentionHours} hours`,
                  passed: true
                });
                summary.passed++;
              }
              summary.totalChecks++;
            }
            // Check for push endpoint configuration
            if (subDetails.pushConfig) {
              findings.push({
                check: 'Push Configuration',
                resource: subName,
                result: 'Push endpoint configured',
                passed: true,
                details: {
                  pushEndpoint: subDetails.pushConfig.pushEndpoint,
                  attributes: subDetails.pushConfig.attributes
                }
              });
              summary.passed++;
            } else {
              findings.push({
                check: 'Push Configuration',
                resource: subName,
                result: 'Pull subscription',
                passed: true
              });
              summary.passed++;
            }
            summary.totalChecks++;
            // Check for message ordering
            if (subDetails.enableMessageOrdering) {
              findings.push({
                check: 'Message Ordering',
                resource: subName,
                result: 'Message ordering enabled',
                passed: true
              });
              summary.passed++;
            } else {
              findings.push({
                check: 'Message Ordering',
                resource: subName,
                result: 'Message ordering disabled',
                passed: true
              });
              summary.passed++;
            }
            summary.totalChecks++;
          }
        } catch (err) {
          errors.push({ check: 'Subscription Audit', resource: topicName, error: err.message });
          summary.failed++;
          summary.totalChecks++;
        }
      }
    } catch (err) {
      errors.push({ check: 'Topic List', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // Write results
    await writeAuditResults('pubsub-audit', findings, summary, errors, projectId);
    return { findings, summary, errors, projectId, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error running Pub/Sub audit:', error);
    errors.push({ check: 'PubSub Audit', error: error.message });
    await writeAuditResults('pubsub-audit', findings, summary, errors, projectId);
    return { findings: [], summary: {}, errors: [{ error: error.message }], projectId, timestamp: new Date().toISOString() };
  }
}

module.exports = { run }; 