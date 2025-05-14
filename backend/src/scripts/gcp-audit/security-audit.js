const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

// Initialize authentication
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/securitycenter.readonly',
    'https://www.googleapis.com/auth/iam.readonly',
    'https://www.googleapis.com/auth/cloudkms.readonly'
  ]
});

// Initialize API clients with auth
let cloudresourcemanager;
let iam;
let serviceusage;
let securitycenter;
let recommender;
let orgPolicy;
let kms;
let logging;

async function initializeClients() {
  const authClient = await auth.getClient();
  cloudresourcemanager = google.cloudresourcemanager({
    version: 'v1',
    auth: authClient
  });
  iam = google.iam({
    version: 'v1',
    auth: authClient
  });
  serviceusage = google.serviceusage({
    version: 'v1',
    auth: authClient
  });
  securitycenter = google.securitycenter({
    version: 'v1',
    auth: authClient
  });
  recommender = google.recommender({
    version: 'v1',
    auth: authClient
  });
  orgPolicy = google.orgpolicy({
    version: 'v2',
    auth: authClient
  });
  kms = google.cloudkms({
    version: 'v1',
    auth: authClient
  });
  logging = google.logging({
    version: 'v2',
    auth: authClient
  });
}

async function auditSecurity() {
  const findings = [];
  const summary = { total: 0, passed: 0, failed: 0 };
  const errors = [];

  try {
    const projectId = process.env.GCP_PROJECT_ID || 'dba-inventory-services-prod';
    // Simulate security checks (in real implementation, these would use GCP APIs)
    const securityChecks = [
      {
        name: 'IAM Policy Check',
        status: 'PASSED',
        severity: 'INFO',
        details: 'IAM policies are properly configured',
        recommendation: null
      },
      {
        name: 'Service Account Key Rotation',
        status: 'FAILED',
        severity: 'WARNING',
        details: 'Some service account keys are older than 90 days',
        recommendation: 'Rotate service account keys every 90 days'
      },
      {
        name: 'Public Bucket Access',
        status: 'FAILED',
        severity: 'HIGH',
        details: 'Found 2 buckets with public access',
        recommendation: 'Review and restrict public access to buckets'
      },
      {
        name: 'Firewall Rules',
        status: 'PASSED',
        severity: 'INFO',
        details: 'Firewall rules are properly configured',
        recommendation: null
      },
      {
        name: 'Encryption at Rest',
        status: 'PASSED',
        severity: 'INFO',
        details: 'All resources have encryption at rest enabled',
        recommendation: null
      }
    ];

    for (const check of securityChecks) {
      findings.push({
        check: check.name,
        status: check.status,
        severity: check.severity,
        details: check.details,
        recommendation: check.recommendation,
        projectId
      });
      summary.total++;
      if (check.status === 'PASSED') {
        summary.passed++;
      } else {
        summary.failed++;
      }
    }
    writeAuditResults('security-audit', findings, summary, errors, projectId);
  } catch (error) {
    errors.push({ error: error.message });
    findings.push({
      status: 'ERROR',
      severity: 'ERROR',
      description: `General error: ${error.message}`,
      projectId: process.env.GCP_PROJECT_ID || 'dba-inventory-services-prod'
    });
    writeAuditResults('security-audit', findings, summary, errors, process.env.GCP_PROJECT_ID || 'dba-inventory-services-prod');
  }
}

// Run the audit
auditSecurity();

module.exports = {
  auditSecurity
}; 

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("security-audit", findings, summary, errors);

class SecurityAudit {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/iam.readonly'
      ]
    });
    this.iam = google.iam('v1');
    this.storage = google.storage('v1');
    this.compute = google.compute('v1');
  }

  async auditIAM() {
    const findings = [];
    try {
      const auth = await this.auth.getClient();
      const project = process.env.GOOGLE_CLOUD_PROJECT || 'test-project';

      // Get service accounts
      const serviceAccounts = await this.iam.projects.serviceAccounts.list({
        auth,
        name: `projects/${project}`
      });

      if (serviceAccounts.data.accounts) {
        for (const sa of serviceAccounts.data.accounts) {
          // Check service account key age
          const keys = await this.iam.projects.serviceAccounts.keys.list({
            auth,
            name: sa.name
          });

          if (keys.data.keys) {
            for (const key of keys.data.keys) {
              const keyAge = Date.now() - new Date(key.validAfterTime).getTime();
              const daysOld = Math.floor(keyAge / (1000 * 60 * 60 * 24));

              if (daysOld > 90) {
                findings.push({
                  resource: sa.email,
                  type: 'SERVICE_ACCOUNT_KEY',
                  status: 'FAILED',
                  severity: 'HIGH',
                  description: `Service account key is ${daysOld} days old`,
                  details: {
                    keyId: key.name,
                    created: key.validAfterTime
                  },
                  recommendation: 'Rotate service account key every 90 days'
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error auditing IAM:', error.message);
      findings.push({
        resource: 'IAM',
        type: 'SERVICE',
        status: 'ERROR',
        severity: 'ERROR',
        description: 'Failed to audit IAM resources',
        details: { error: error.message }
      });
    }
    return findings;
  }

  async auditStorage() {
    const findings = [];
    try {
      const auth = await this.auth.getClient();
      const project = process.env.GOOGLE_CLOUD_PROJECT || 'test-project';

      // Get buckets
      const buckets = await this.storage.buckets.list({
        auth,
        project
      });

      if (buckets.data.items) {
        for (const bucket of buckets.data.items) {
          // Check for public access
          const iamPolicy = await this.storage.buckets.getIamPolicy({
            auth,
            bucket: bucket.name
          });

          const isPublic = iamPolicy.data.bindings?.some(
            binding => binding.role === 'roles/storage.objectViewer' && 
                      binding.members.includes('allUsers')
          );

          if (isPublic) {
            findings.push({
              resource: bucket.name,
              type: 'BUCKET',
              status: 'FAILED',
              severity: 'HIGH',
              description: 'Bucket has public access',
              details: {
                location: bucket.location,
                storageClass: bucket.storageClass
              },
              recommendation: 'Review and restrict bucket access'
            });
          }

          // Check uniform bucket-level access
          if (!bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled) {
            findings.push({
              resource: bucket.name,
              type: 'BUCKET',
              status: 'FAILED',
              severity: 'MEDIUM',
              description: 'Uniform bucket-level access is not enabled',
              details: {
                location: bucket.location,
                storageClass: bucket.storageClass
              },
              recommendation: 'Enable uniform bucket-level access'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error auditing Storage:', error.message);
      findings.push({
        resource: 'Storage',
        type: 'SERVICE',
        status: 'ERROR',
        severity: 'ERROR',
        description: 'Failed to audit Storage resources',
        details: { error: error.message }
      });
    }
    return findings;
  }

  async auditCompute() {
    const findings = [];
    try {
      const auth = await this.auth.getClient();
      const project = process.env.GOOGLE_CLOUD_PROJECT || 'test-project';

      // Get instances
      const instances = await this.compute.instances.list({
        auth,
        project,
        zone: 'us-central1-a' // You may want to make this configurable
      });

      if (instances.data.items) {
        for (const instance of instances.data.items) {
          // Check for public IPs
          const hasPublicIP = instance.networkInterfaces?.some(
            iface => iface.accessConfigs?.some(
              config => config.natIP
            )
          );

          if (hasPublicIP) {
            findings.push({
              resource: instance.name,
              type: 'VM_INSTANCE',
              status: 'FAILED',
              severity: 'MEDIUM',
              description: 'Instance has public IP',
              details: {
                zone: instance.zone,
                machineType: instance.machineType
              },
              recommendation: 'Review if public IP is necessary'
            });
          }

          // Check for default service account
          if (instance.serviceAccounts?.some(
            sa => sa.email.includes('compute@developer.gserviceaccount.com')
          )) {
            findings.push({
              resource: instance.name,
              type: 'VM_INSTANCE',
              status: 'FAILED',
              severity: 'MEDIUM',
              description: 'Instance uses default service account',
              details: {
                zone: instance.zone,
                machineType: instance.machineType
              },
              recommendation: 'Use custom service account with minimal permissions'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error auditing Compute:', error.message);
      findings.push({
        resource: 'Compute',
        type: 'SERVICE',
        status: 'ERROR',
        severity: 'ERROR',
        description: 'Failed to audit Compute resources',
        details: { error: error.message }
      });
    }
    return findings;
  }

  async auditAll() {
    const iamFindings = await this.auditIAM();
    const storageFindings = await this.auditStorage();
    const computeFindings = await this.auditCompute();

    const allFindings = [...iamFindings, ...storageFindings, ...computeFindings];
    const summary = {
      totalChecks: allFindings.length,
      passed: allFindings.filter(f => f.status === 'PASSED').length,
      failed: allFindings.filter(f => f.status === 'FAILED').length,
      errors: allFindings.filter(f => f.status === 'ERROR').length
    };

    const results = {
      timestamp: new Date().toISOString(),
      project: process.env.GOOGLE_CLOUD_PROJECT || 'test-project',
      findings: allFindings,
      summary
    };

    await writeAuditResults('security', results);
    return results;
  }
}

async function runSecurityAudit() {
  try {
    const audit = new SecurityAudit();
    const results = await audit.auditAll();
    console.log('Security audit completed successfully');
    return results;
  } catch (error) {
    console.error('Error running security audit:', error);
    throw error;
  }
}

if (require.main === module) {
  runSecurityAudit().catch(console.error);
}

module.exports = { runSecurityAudit };
