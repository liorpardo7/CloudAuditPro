const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(results) {
    this.results = results;
    this.timestamp = new Date().toISOString();
  }

  generateMarkdownReport() {
    let report = '# GCP Audit Report\n\n';
    
    // Executive Summary
    report += '## Executive Summary\n\n';
    report += `Audit Date: ${this.timestamp}\n`;
    report += `Project ID: ${this.results.projectId}\n\n`;
    
    // Overall Statistics
    report += '### Overall Statistics\n\n';
    report += `- Total Checks: ${this.results.summary.total}\n`;
    report += `- Passed: ${this.results.summary.passed}\n`;
    report += `- Failed: ${this.results.summary.failed}\n`;
    report += `- Not Implemented: ${this.results.summary.notImplemented}\n`;
    report += `- Not Applicable: ${this.results.summary.notApplicable}\n\n`;
    
    // Compliance Score
    const complianceScore = (this.results.summary.passed / this.results.summary.total) * 100;
    report += `### Compliance Score: ${complianceScore.toFixed(2)}%\n\n`;
    
    // Critical Findings
    report += '### Critical Findings\n\n';
    const criticalFindings = this.getCriticalFindings();
    if (criticalFindings.length > 0) {
      criticalFindings.forEach(finding => {
        report += `- ${finding.category}.${finding.check}: ${finding.error}\n`;
      });
    } else {
      report += 'No critical findings identified.\n';
    }
    report += '\n';
    
    // Detailed Results by Category
    report += '## Detailed Results\n\n';
    for (const [category, checks] of Object.entries(this.results.checks)) {
      report += `### ${category}\n\n`;
      for (const [checkName, result] of Object.entries(checks)) {
        report += `#### ${checkName}\n`;
        report += `- Status: ${result.status}\n`;
        if (result.error) {
          report += `- Error: ${result.error}\n`;
        }
        if (result.details) {
          report += `- Details: ${JSON.stringify(result.details, null, 2)}\n`;
        }
        report += '\n';
      }
    }
    
    // Recommendations
    report += '## Recommendations\n\n';
    const recommendations = this.generateRecommendations();
    recommendations.forEach(rec => {
      report += `### ${rec.category}\n`;
      report += `${rec.description}\n\n`;
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
      complianceScore: (this.results.summary.passed / this.results.summary.total) * 100,
      criticalFindings: this.getCriticalFindings(),
      detailedResults: this.results.checks,
      recommendations: this.generateRecommendations()
    };
  }

  generateHTMLReport() {
    // Convert markdown to HTML
    const markdown = this.generateMarkdownReport();
    // Basic HTML wrapper
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
            .passed { color: #188038; }
            .failed { color: #d93025; }
            pre { background-color: #f8f9fa; padding: 10px; }
          </style>
        </head>
        <body>
          ${this.markdownToHTML(markdown)}
        </body>
      </html>
    `;
  }

  getCriticalFindings() {
    const criticalFindings = [];
    for (const [category, checks] of Object.entries(this.results.checks)) {
      for (const [checkName, result] of Object.entries(checks)) {
        if (result.status === 'Failed') {
          criticalFindings.push({
            category,
            check: checkName,
            error: result.error
          });
        }
      }
    }
    return criticalFindings;
  }

  generateRecommendations() {
    const recommendations = [];
    for (const [category, checks] of Object.entries(this.results.checks)) {
      for (const [checkName, result] of Object.entries(checks)) {
        if (result.status === 'Failed') {
          recommendations.push(this.getRecommendation(category, checkName, result));
        }
      }
    }
    return recommendations;
  }

  getRecommendation(category, checkName, result) {
    // Add specific recommendations based on the check and error
    const recommendationMap = {
      'Security.CheckIAMRoles': {
        category: 'IAM Security',
        description: 'Review and update IAM role assignments following the principle of least privilege',
        steps: [
          'Audit current IAM role assignments',
          'Remove unnecessary permissions',
          'Implement role-based access control (RBAC)'
        ]
      },
      // Add more specific recommendations here
    };

    return recommendationMap[`${category}.${checkName}`] || {
      category: category,
      description: `Address the failed check: ${checkName}`,
      steps: [`Review and fix the error: ${result.error}`]
    };
  }

  markdownToHTML(markdown) {
    // Basic markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>');
  }

  saveReports(outputDir) {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = this.timestamp.replace(/[:.]/g, '-');
    
    // Save Markdown report
    fs.writeFileSync(
      path.join(outputDir, `audit-report-${timestamp}.md`),
      this.generateMarkdownReport()
    );

    // Save JSON report
    fs.writeFileSync(
      path.join(outputDir, `audit-report-${timestamp}.json`),
      JSON.stringify(this.generateJSONReport(), null, 2)
    );

    // Save HTML report
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