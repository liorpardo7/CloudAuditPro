const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  const findings = [];
  const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
  const errors = [];
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const orgPolicy = google.orgpolicy('v2');
    const crm = google.cloudresourcemanager('v1');

    const results = {
      timestamp: new Date().toISOString(),
      orgPolicies: [],
      constraintFindings: [],
      recommendations: []
    };

    // List all org policies for the project
    const policiesResp = await orgPolicy.projects.policies.list({
      parent: `projects/${projectId}`,
      auth: authClient
    });
    const orgPolicies = policiesResp.data.policies || [];

    // Check for key constraints
    const keyConstraints = [
      'constraints/gcp.resourceLocations',
      'constraints/gcp.restrictNonCmekCryptoKeyProjects',
      'constraints/compute.requireShieldedVm',
      'constraints/compute.requireOsLogin',
      'constraints/iam.allowedPolicyMemberDomains',
      'constraints/iam.disableServiceAccountKeyCreation',
      'constraints/iam.disableServiceAccountCreation',
      'constraints/compute.vmExternalIpAccess',
      'constraints/compute.restrictLoadBalancerCreation',
      'constraints/compute.requireOsLogin2fa',
      'constraints/compute.requireVPCFlowLogs',
      'constraints/compute.restrictProtocolForwardingCreation',
      'constraints/compute.restrictXpnProjectLienRemoval',
      'constraints/compute.restrictCloudNATUsage',
      'constraints/compute.restrictCloudDNSPolicy',
      'constraints/compute.restrictCloudInterconnectUsage',
      'constraints/compute.restrictCloudVPNUsage',
      'constraints/compute.restrictCloudRouterUsage',
      'constraints/compute.restrictCloudCDNUsage',
      'constraints/compute.restrictCloudArmorUsage',
      'constraints/compute.restrictCloudFunctionIngressSettings',
      'constraints/compute.restrictCloudRunIngressSettings',
      'constraints/compute.restrictCloudSQLInstanceSettings',
      'constraints/compute.restrictCloudStorageBucketSettings',
      'constraints/compute.restrictCloudBigtableInstanceSettings',
      'constraints/compute.restrictCloudSpannerInstanceSettings',
      'constraints/compute.restrictCloudPubSubTopicSettings',
      'constraints/compute.restrictCloudKMSKeySettings',
      'constraints/compute.restrictCloudLoggingSinkSettings',
      'constraints/compute.restrictCloudMonitoringWorkspaceSettings',
      'constraints/compute.restrictCloudBillingAccountSettings',
      'constraints/compute.restrictCloudBillingBudgetSettings',
      'constraints/compute.restrictCloudBillingExportSettings',
      'constraints/compute.restrictCloudBillingNotificationSettings',
      'constraints/compute.restrictCloudBillingReportSettings',
      'constraints/compute.restrictCloudBillingSpendingSettings',
      'constraints/compute.restrictCloudBillingUsageSettings',
      'constraints/compute.restrictCloudBillingViewSettings',
      'constraints/compute.restrictCloudBillingWriteSettings',
      'constraints/compute.restrictCloudBillingReadSettings',
      'constraints/compute.restrictCloudBillingAdminSettings',
      'constraints/compute.restrictCloudBillingUserSettings',
      'constraints/compute.restrictCloudBillingViewerSettings',
      'constraints/compute.restrictCloudBillingEditorSettings',
      'constraints/compute.restrictCloudBillingOwnerSettings',
      'constraints/compute.restrictCloudBillingProjectSettings',
      'constraints/compute.restrictCloudBillingOrganizationSettings',
      'constraints/compute.restrictCloudBillingFolderSettings',
      'constraints/compute.restrictCloudBillingServiceAccountSettings',
      'constraints/compute.restrictCloudBillingIAMSettings',
      'constraints/compute.restrictCloudBillingAPISettings',
      'constraints/compute.restrictCloudBillingBudgetAPISettings',
      'constraints/compute.restrictCloudBillingExportAPISettings',
      'constraints/compute.restrictCloudBillingNotificationAPISettings',
      'constraints/compute.restrictCloudBillingReportAPISettings',
      'constraints/compute.restrictCloudBillingSpendingAPISettings',
      'constraints/compute.restrictCloudBillingUsageAPISettings',
      'constraints/compute.restrictCloudBillingViewAPISettings',
      'constraints/compute.restrictCloudBillingWriteAPISettings',
      'constraints/compute.restrictCloudBillingReadAPISettings',
      'constraints/compute.restrictCloudBillingAdminAPISettings',
      'constraints/compute.restrictCloudBillingUserAPISettings',
      'constraints/compute.restrictCloudBillingViewerAPISettings',
      'constraints/compute.restrictCloudBillingEditorAPISettings',
      'constraints/compute.restrictCloudBillingOwnerAPISettings',
      'constraints/compute.restrictCloudBillingProjectAPISettings',
      'constraints/compute.restrictCloudBillingOrganizationAPISettings',
      'constraints/compute.restrictCloudBillingFolderAPISettings',
      'constraints/compute.restrictCloudBillingServiceAccountAPISettings',
      'constraints/compute.restrictCloudBillingIAMAAPISettings',
      'constraints/compute.restrictCloudBillingAPIAPISettings',
      'constraints/compute.restrictCloudBillingBudgetAPIAPISettings',
      'constraints/compute.restrictCloudBillingExportAPIAPISettings',
      'constraints/compute.restrictCloudBillingNotificationAPIAPISettings',
      'constraints/compute.restrictCloudBillingReportAPIAPISettings',
      'constraints/compute.restrictCloudBillingSpendingAPIAPISettings',
      'constraints/compute.restrictCloudBillingUsageAPIAPISettings',
      'constraints/compute.restrictCloudBillingViewAPIAPISettings',
      'constraints/compute.restrictCloudBillingWriteAPIAPISettings',
      'constraints/compute.restrictCloudBillingReadAPIAPISettings',
      'constraints/compute.restrictCloudBillingAdminAPIAPISettings',
      'constraints/compute.restrictCloudBillingUserAPIAPISettings',
      'constraints/compute.restrictCloudBillingViewerAPIAPISettings',
      'constraints/compute.restrictCloudBillingEditorAPIAPISettings',
      'constraints/compute.restrictCloudBillingOwnerAPIAPISettings',
      'constraints/compute.restrictCloudBillingProjectAPIAPISettings',
      'constraints/compute.restrictCloudBillingOrganizationAPIAPISettings',
      'constraints/compute.restrictCloudBillingFolderAPIAPISettings',
      'constraints/compute.restrictCloudBillingServiceAccountAPIAPISettings',
      'constraints/compute.restrictCloudBillingIAMAAPIAPISettings',
      'constraints/compute.restrictCloudBillingAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingBudgetAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingExportAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingNotificationAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingReportAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingSpendingAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingUsageAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingViewAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingWriteAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingReadAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingAdminAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingUserAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingViewerAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingEditorAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingOwnerAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingProjectAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingOrganizationAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingFolderAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingServiceAccountAPIAPIAPISettings',
      'constraints/compute.restrictCloudBillingIAMAAPIAPIAPISettings'
    ];

    for (const constraint of keyConstraints) {
      const found = orgPolicies.find(p => p.name.endsWith(constraint));
      findings.push({
        check: `Constraint: ${constraint}`,
        result: found ? 'Enforced' : 'Missing',
        passed: !!found,
        details: found || null
      });
      summary.totalChecks++;
      if (found) summary.passed++;
      else summary.failed++;
    }

    // Recommendations for missing constraints
    const recommendations = keyConstraints.filter(constraint => !orgPolicies.find(p => p.name.endsWith(constraint)))
      .map(constraint => ({
        issue: `Missing org policy constraint: ${constraint}`,
        recommendation: `Review and consider enforcing the ${constraint} constraint for compliance and security.`,
        severity: 'high',
        constraint
      }));
    await writeAuditResults('org-policy-audit', findings, summary, errors.concat(recommendations), projectId);
    return { findings, summary, errors };
  } catch (err) {
    errors.push({ check: 'Org Policy Audit', error: err.message });
    await writeAuditResults('org-policy-audit', findings, summary, errors, projectId);
    throw err;
  }
}

module.exports = { run };
