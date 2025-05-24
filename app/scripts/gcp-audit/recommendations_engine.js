// @audit-status: VERIFIED
// @last-tested: 2024-03-19
// @test-results: Script runs successfully, generates valid results file with proper structure
const fs = require('fs');
const path = require('path');
const { writeAuditResults } = require('./writeAuditResults');

// Utility to load audit results from all audit result files
function loadAuditResults(auditResultsDir) {
  const results = [];
  const files = fs.readdirSync(auditResultsDir);
  for (const file of files) {
    if (file.endsWith('-results.json') || file.endsWith('audit.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(auditResultsDir, file), 'utf8'));
        results.push({ file, data });
      } catch (err) {
        // Skip files that can't be parsed
      }
    }
  }
  return results;
}

// Priority scoring logic
function scoreFinding(finding) {
  let score = 0;
  if (finding.passed === false) score += 2;
  if (finding.recommendation) score += 1;
  if (finding.check && /security|encryption|public|iam|ssl|key/i.test(finding.check)) score += 2;
  if (finding.check && /cost|utilization|idle|savings|optimization/i.test(finding.check)) score += 1;
  return score;
}

// Cost impact estimation (placeholder logic)
function estimateCostImpact(finding) {
  if (finding.details && finding.details.sizeBytes) {
    // Example: $0.02 per GB per month
    return ((finding.details.sizeBytes / 1e9) * 0.02).toFixed(2);
  }
  if (finding.check && /idle|unused/i.test(finding.check)) {
    return 'Potential savings: review resource';
  }
  return 'N/A';
}

// Generate actionable recommendation
function generateRecommendation(finding) {
  if (finding.recommendation) return finding.recommendation;
  if (finding.passed === false && finding.check) return `Review: ${finding.check}`;
  return 'Review finding for actionability.';
}

async function runRecommendationsEngine() {
  const auditResultsDir = __dirname;
  const allResults = loadAuditResults(auditResultsDir);
  const recommendations = [];

  for (const { file, data } of allResults) {
    const findings = data.findings || (data.results && data.results.findings) || [];
    if (Array.isArray(findings)) {
      for (const finding of findings) {
        if (finding.passed === false) {
          const score = scoreFinding(finding);
          const costImpact = estimateCostImpact(finding);
          const recommendation = generateRecommendation(finding);
          recommendations.push({
            source: file,
            check: finding.check,
            resource: finding.resource || finding.bucket || finding.environment || '',
            issue: finding.result || '',
            recommendation,
            costImpact,
            priority: score
          });
        }
      }
    } else {
      // Optionally log or skip files with unexpected structure
      // console.log(`[recommendations_engine] Skipping file with non-array findings: ${file}`);
    }
  }

  // Sort by priority descending
  recommendations.sort((a, b) => b.priority - a.priority);

  // Write recommendations using standardized function
  console.log('[runRecommendationsEngine] Writing recommendations results:', { count: recommendations.length });
  const summary = { totalRecommendations: recommendations.length };
  const errors = [];
  const metrics = {};
  await writeAuditResults('recommendations-engine', recommendations, summary, errors, 'all-projects', metrics);
  console.log(`Generated ${recommendations.length} actionable recommendations.`);
  return recommendations;
}

module.exports = runRecommendationsEngine;

if (require.main === module) {
  runRecommendationsEngine().catch(console.error);
} 