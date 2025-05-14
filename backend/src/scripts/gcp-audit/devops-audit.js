const { writeAuditResults } = require('./writeAuditResults');
const { CloudBuildClient } = require('@google-cloud/cloudbuild');
const { CloudDeployClient } = require('@google-cloud/deploy');
const { ArtifactRegistryClient } = require('@google-cloud/artifact-registry');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { writeFileSync } = require('fs');
const path = require('path');

class DevOpsAuditor {
  constructor(projectId) {
    this.projectId = projectId;
    this.cloudBuildClient = new CloudBuildClient();
    this.cloudDeployClient = new CloudDeployClient();
    this.artifactRegistryClient = new ArtifactRegistryClient();
    this.secretManagerClient = new SecretManagerServiceClient();
    this.findings = [];
  }

  async runAudit() {
    console.log('Starting DevOps audit...');
    
    try {
      await this.auditCloudBuild();
      await this.auditDeployments();
      await this.auditArtifactRegistry();
      await this.auditSecrets();
      
      this.generateReport();
    } catch (error) {
      console.error('Error during DevOps audit:', error);
      throw error;
    }
  }

  async auditCloudBuild() {
    console.log('Auditing Cloud Build configurations...');
    
    try {
      const [builds] = await this.cloudBuildClient.listBuilds({
        projectId: this.projectId,
      });

      for (const build of builds) {
        // Check build configuration
        this.checkBuildConfiguration(build);
        
        // Check build triggers
        if (build.buildTriggerId) {
          await this.checkBuildTrigger(build.buildTriggerId);
        }
        
        // Check build security
        this.checkBuildSecurity(build);
      }
    } catch (error) {
      console.error('Error auditing Cloud Build:', error);
      this.findings.push({
        category: 'Cloud Build',
        severity: 'ERROR',
        message: `Failed to audit Cloud Build: ${error.message}`,
      });
    }
  }

  async auditDeployments() {
    console.log('Auditing Cloud Deploy configurations...');
    
    try {
      const [deliveryPipelines] = await this.cloudDeployClient.listDeliveryPipelines({
        parent: `projects/${this.projectId}/locations/-`,
      });

      for (const pipeline of deliveryPipelines) {
        // Check pipeline configuration
        this.checkPipelineConfiguration(pipeline);
        
        // Check release configuration
        await this.checkReleases(pipeline.name);
        
        // Check deployment security
        this.checkDeploymentSecurity(pipeline);
      }
    } catch (error) {
      console.error('Error auditing Cloud Deploy:', error);
      this.findings.push({
        category: 'Cloud Deploy',
        severity: 'ERROR',
        message: `Failed to audit Cloud Deploy: ${error.message}`,
      });
    }
  }

  async auditArtifactRegistry() {
    console.log('Auditing Artifact Registry...');
    
    try {
      const [repositories] = await this.artifactRegistryClient.listRepositories({
        parent: `projects/${this.projectId}/locations/-`,
      });

      for (const repo of repositories) {
        // Check repository configuration
        this.checkRepositoryConfiguration(repo);
        
        // Check artifact security
        this.checkArtifactSecurity(repo);
      }
    } catch (error) {
      console.error('Error auditing Artifact Registry:', error);
      this.findings.push({
        category: 'Artifact Registry',
        severity: 'ERROR',
        message: `Failed to audit Artifact Registry: ${error.message}`,
      });
    }
  }

  async auditSecrets() {
    console.log('Auditing Secret Manager...');
    
    try {
      const [secrets] = await this.secretManagerClient.listSecrets({
        parent: `projects/${this.projectId}`,
      });

      for (const secret of secrets) {
        // Check secret configuration
        this.checkSecretConfiguration(secret);
        
        // Check secret access
        await this.checkSecretAccess(secret.name);
      }
    } catch (error) {
      console.error('Error auditing Secret Manager:', error);
      this.findings.push({
        category: 'Secret Manager',
        severity: 'ERROR',
        message: `Failed to audit Secret Manager: ${error.message}`,
      });
    }
  }

  checkBuildConfiguration(build) {
    // Check build timeout
    if (build.timeout?.seconds > 3600) {
      this.findings.push({
        category: 'Cloud Build',
        severity: 'WARNING',
        message: `Build ${build.id} has a timeout greater than 1 hour`,
        resource: build.id,
      });
    }

    // Check build steps
    for (const step of build.steps || []) {
      if (step.allowFailure) {
        this.findings.push({
          category: 'Cloud Build',
          severity: 'INFO',
          message: `Build ${build.id} has steps that can fail without stopping the build`,
          resource: build.id,
        });
      }
    }
  }

  checkBuildSecurity(build) {
    // Check for sensitive information in build logs
    if (build.logsBucket) {
      this.findings.push({
        category: 'Cloud Build',
        severity: 'INFO',
        message: `Build ${build.id} has logs stored in ${build.logsBucket}`,
        resource: build.id,
      });
    }

    // Check for service account usage
    if (build.serviceAccount) {
      this.findings.push({
        category: 'Cloud Build',
        severity: 'INFO',
        message: `Build ${build.id} uses service account ${build.serviceAccount}`,
        resource: build.id,
      });
    }
  }

  checkPipelineConfiguration(pipeline) {
    // Check pipeline configuration
    if (!pipeline.description) {
      this.findings.push({
        category: 'Cloud Deploy',
        severity: 'WARNING',
        message: `Pipeline ${pipeline.name} has no description`,
        resource: pipeline.name,
      });
    }

    // Check target configuration
    for (const target of pipeline.targets || []) {
      if (!target.requireApproval) {
        this.findings.push({
          category: 'Cloud Deploy',
          severity: 'WARNING',
          message: `Pipeline ${pipeline.name} has target ${target.name} without approval requirement`,
          resource: pipeline.name,
        });
      }
    }
  }

  checkRepositoryConfiguration(repo) {
    // Check repository configuration
    if (!repo.kmsKeyName) {
      this.findings.push({
        category: 'Artifact Registry',
        severity: 'WARNING',
        message: `Repository ${repo.name} has no KMS key configured`,
        resource: repo.name,
      });
    }

    // Check IAM configuration
    if (!repo.iamPolicy) {
      this.findings.push({
        category: 'Artifact Registry',
        severity: 'WARNING',
        message: `Repository ${repo.name} has no IAM policy configured`,
        resource: repo.name,
      });
    }
  }

  checkSecretConfiguration(secret) {
    // Check secret rotation
    if (!secret.rotation) {
      this.findings.push({
        category: 'Secret Manager',
        severity: 'WARNING',
        message: `Secret ${secret.name} has no rotation policy configured`,
        resource: secret.name,
      });
    }

    // Check secret labels
    if (!secret.labels) {
      this.findings.push({
        category: 'Secret Manager',
        severity: 'INFO',
        message: `Secret ${secret.name} has no labels configured`,
        resource: secret.name,
      });
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      projectId: this.projectId,
      findings: this.findings,
      summary: {
        total: this.findings.length,
        bySeverity: this.findings.reduce((acc, finding) => {
          acc[finding.severity] = (acc[finding.severity] || 0) + 1;
          return acc;
        }, {}),
        byCategory: this.findings.reduce((acc, finding) => {
          acc[finding.category] = (acc[finding.category] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    const reportPath = path.join(__dirname, 'devops-audit-results.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`DevOps audit report generated at ${reportPath}`);
  }
}

// Export the auditor class
module.exports = DevOpsAuditor;

// If running directly
if (require.main === module) {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error('Please provide a project ID');
    process.exit(1);
  }

  const auditor = new DevOpsAuditor(projectId);
  auditor.runAudit()
    .then(() => console.log('DevOps audit completed'))
    .catch(error => {
      console.error('DevOps audit failed:', error);
      process.exit(1);
    });
} 

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("devops-audit", findings, summary, errors);
