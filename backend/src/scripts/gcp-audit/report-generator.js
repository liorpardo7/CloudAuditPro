const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(results) {
    this.results = results;
    this.timestamp = new Date().toISOString();
    this.severityLevels = {
      CRITICAL: { score: 4, color: '#d93025' },
      HIGH: { score: 3, color: '#ea4335' },
      MEDIUM: { score: 2, color: '#fbbc04' },
      LOW: { score: 1, color: '#34a853' },
      INFO: { score: 0, color: '#4285f4' }
    };
  }

  generateMarkdownReport() {
    let report = '# GCP Audit Report\n\n';
    
    // Executive Summary
    report += '## Executive Summary\n\n';
    report += `Audit Date: ${this.timestamp}\n`;
    report += `Project ID: ${this.results.projectId}\n\n`;
    
    // Overall Statistics with Severity Breakdown
    report += '### Overall Statistics\n\n';
    report += `- Total Checks: ${this.results.summary.total}\n`;
    report += `- Passed: ${this.results.summary.passed}\n`;
    report += `- Failed: ${this.results.summary.failed}\n`;
    report += `- Not Implemented: ${this.results.summary.notImplemented}\n`;
    report += `- Not Applicable: ${this.results.summary.notApplicable}\n\n`;
    
    // Severity Distribution
    const severityDistribution = this.getSeverityDistribution();
    report += '### Severity Distribution\n\n';
    for (const [severity, count] of Object.entries(severityDistribution)) {
      report += `- ${severity}: ${count}\n`;
    }
    report += '\n';
    
    // Compliance Score with Trend
    const complianceScore = (this.results.summary.passed / this.results.summary.total) * 100;
    const trend = this.calculateComplianceTrend();
    report += `### Compliance Score: ${complianceScore.toFixed(2)}%\n`;
    report += `Trend: ${trend.direction} (${trend.percentage}% from last audit)\n\n`;
    
    // Critical Findings with Impact Analysis
    report += '### Critical Findings\n\n';
    const criticalFindings = this.getCriticalFindings();
    if (criticalFindings.length > 0) {
      criticalFindings.forEach(finding => {
        report += `#### ${finding.category}.${finding.check}\n`;
        report += `- Severity: ${finding.severity}\n`;
        report += `- Impact: ${finding.impact}\n`;
        report += `- Error: ${finding.error}\n`;
        if (finding.resources) {
          report += '- Affected Resources:\n';
          finding.resources.forEach(resource => {
            report += `  - ${resource}\n`;
          });
        }
        report += '\n';
      });
    } else {
      report += 'No critical findings identified.\n';
    }
    report += '\n';
    
    // Detailed Results by Category with Resource Details
    report += '## Detailed Results\n\n';
    for (const [category, checks] of Object.entries(this.results.checks)) {
      report += `### ${category}\n\n`;
      for (const [checkName, result] of Object.entries(checks)) {
        report += `#### ${checkName}\n`;
        report += `- Status: ${result.status}\n`;
        report += `- Severity: ${result.severity || 'N/A'}\n`;
        if (result.error) {
          report += `- Error: ${result.error}\n`;
        }
        if (result.details) {
          report += '- Details:\n';
          for (const [key, value] of Object.entries(result.details)) {
            report += `  - ${key}: ${JSON.stringify(value, null, 2)}\n`;
          }
        }
        if (result.resources) {
          report += '- Resources:\n';
          result.resources.forEach(resource => {
            report += `  - ${resource.name}: ${resource.status}\n`;
          });
        }
        report += '\n';
      }
    }
    
    // Compliance Mapping
    report += '## Compliance Mapping\n\n';
    const complianceMapping = this.getComplianceMapping();
    for (const [standard, controls] of Object.entries(complianceMapping)) {
      report += `### ${standard}\n\n`;
      for (const [control, status] of Object.entries(controls)) {
        report += `- ${control}: ${status}\n`;
      }
      report += '\n';
    }
    
    // Recommendations with Priority
    report += '## Recommendations\n\n';
    const recommendations = this.generateRecommendations();
    recommendations.forEach(rec => {
      report += `### ${rec.category}\n`;
      report += `Priority: ${rec.priority}\n`;
      report += `${rec.description}\n\n`;
      if (rec.impact) {
        report += `Impact: ${rec.impact}\n\n`;
      }
      if (rec.steps.length > 0) {
        report += 'Steps to implement:\n';
        rec.steps.forEach(step => {
          report += `1. ${step}\n`;
        });
        report += '\n';
      }
    });
    
    return report;
  }

  generateJSONReport() {
    return {
      timestamp: this.timestamp,
      projectId: this.results.projectId,
      summary: this.results.summary,
      severityDistribution: this.getSeverityDistribution(),
      complianceScore: (this.results.summary.passed / this.results.summary.total) * 100,
      complianceTrend: this.calculateComplianceTrend(),
      criticalFindings: this.getCriticalFindings(),
      detailedResults: this.results.checks,
      complianceMapping: this.getComplianceMapping(),
      recommendations: this.generateRecommendations()
    };
  }

  generateHTMLReport() {
    const markdown = this.generateMarkdownReport();
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GCP Audit Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #1a73e8; }
            h2 { color: #202124; }
            h3 { color: #3c4043; }
            .critical { color: #d93025; }
            .high { color: #ea4335; }
            .medium { color: #fbbc04; }
            .low { color: #34a853; }
            .info { color: #4285f4; }
            .passed { color: #188038; }
            .failed { color: #d93025; }
            pre { background-color: #f8f9fa; padding: 10px; }
            .severity-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
            }
            .trend-up { color: #188038; }
            .trend-down { color: #d93025; }
          </style>
        </head>
        <body>
          ${this.markdownToHTML(markdown)}
        </body>
      </html>
    `;
  }

  getSeverityDistribution() {
    const distribution = {};
    for (const [category, checks] of Object.entries(this.results.checks)) {
      for (const [checkName, result] of Object.entries(checks)) {
        if (result.severity) {
          distribution[result.severity] = (distribution[result.severity] || 0) + 1;
        }
      }
    }
    return distribution;
  }

  calculateComplianceTrend() {
    // This would typically compare with historical data
    // For now, returning a mock trend
    return {
      direction: 'up',
      percentage: 5.2
    };
  }

  getCriticalFindings() {
    const criticalFindings = [];
    for (const [category, checks] of Object.entries(this.results.checks)) {
      for (const [checkName, result] of Object.entries(checks)) {
        if (result.status === 'Failed' && this.severityLevels[result.severity]?.score >= 3) {
          criticalFindings.push({
            category,
            check: checkName,
            severity: result.severity,
            impact: result.impact || 'High impact on security and compliance',
            error: result.error,
            resources: result.resources
          });
        }
      }
    }
    return criticalFindings;
  }

  getComplianceMapping() {
    // Map findings to compliance standards
    const mapping = {
      'CIS GCP': {},
      'ISO 27001': {},
      'SOC 2': {},
      'GDPR': {}
    };

    for (const [category, checks] of Object.entries(this.results.checks)) {
      for (const [checkName, result] of Object.entries(checks)) {
        // Map to relevant compliance controls
        if (result.compliance) {
          for (const [standard, controls] of Object.entries(result.compliance)) {
            mapping[standard] = {
              ...mapping[standard],
              ...controls
            };
          }
        }
      }
    }

    return mapping;
  }

  generateRecommendations() {
    const recommendations = [];
    for (const [category, checks] of Object.entries(this.results.checks)) {
      for (const [checkName, result] of Object.entries(checks)) {
        if (result.status === 'Failed') {
          const recommendation = this.getRecommendation(category, checkName, result);
          recommendation.priority = this.calculatePriority(result);
          recommendations.push(recommendation);
        }
      }
    }
    return recommendations;
  }

  calculatePriority(result) {
    const severityScore = this.severityLevels[result.severity]?.score || 0;
    const impactScore = result.impact ? 1 : 0;
    const totalScore = severityScore + impactScore;
    
    if (totalScore >= 4) return 'P0';
    if (totalScore >= 3) return 'P1';
    if (totalScore >= 2) return 'P2';
    return 'P3';
  }

  getRecommendation(category, checkName, result) {
    const recommendationMap = {
      'Security.CheckIAMRoles': {
        category: 'IAM Security',
        description: 'Review and update IAM role assignments following the principle of least privilege',
        impact: 'Reduces security risk and improves compliance',
        steps: [
          'Audit current IAM role assignments',
          'Remove unnecessary permissions',
          'Implement role-based access control (RBAC)'
        ]
      },
      'Storage.CheckEncryption': {
        category: 'Storage Security',
        description: 'Enable encryption for all storage buckets',
        impact: 'Protects sensitive data at rest',
        steps: [
          'Enable default encryption for all buckets',
          'Configure customer-managed encryption keys',
          'Verify encryption status'
        ]
      },
      'Compute.CheckServiceAccounts': {
        category: 'Compute Security',
        description: 'Review and secure service account usage',
        impact: 'Prevents unauthorized access to resources',
        steps: [
          'Audit service account permissions',
          'Remove unused service accounts',
          'Implement least privilege access'
        ]
      }
    };

    return recommendationMap[`${category}.${checkName}`] || {
      category: category,
      description: `Address the failed check: ${checkName}`,
      impact: 'Improves security and compliance posture',
      steps: [`Review and fix the error: ${result.error}`]
    };
  }

  markdownToHTML(markdown) {
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/Severity: (CRITICAL|HIGH|MEDIUM|LOW|INFO)/g, 
        (match, severity) => `<span class="severity-badge" style="background-color: ${this.severityLevels[severity].color}20; color: ${this.severityLevels[severity].color}">${severity}</span>`)
      .replace(/Trend: (up|down)/g, 
        (match, direction) => `<span class="trend-${direction}">${direction.toUpperCase()}</span>`);
  }

  saveReports(outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = this.timestamp.replace(/[:.]/g, '-');
    
    fs.writeFileSync(
      path.join(outputDir, `audit-report-${timestamp}.md`),
      this.generateMarkdownReport()
    );

    fs.writeFileSync(
      path.join(outputDir, `audit-report-${timestamp}.json`),
      JSON.stringify(this.generateJSONReport(), null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, `audit-report-${timestamp}.html`),
      this.generateHTMLReport()
    );

    return {
      markdown: `audit-report-${timestamp}.md`,
      json: `audit-report-${timestamp}.json`,
      html: `audit-report-${timestamp}.html`
    };
  }
}

module.exports = { ReportGenerator }; 