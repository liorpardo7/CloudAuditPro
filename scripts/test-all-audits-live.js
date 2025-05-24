#!/usr/bin/env node

/**
 * CloudAuditPro Live Audit Testing Script - Complete System Test
 * 
 * This script tests ALL audit categories with real API calls to verify
 * they return actual data and work correctly in production.
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

async function testAuditCategory(category, expectedChecks = null) {
  const startTime = Date.now();
  log(`\n🔍 Testing ${category} audit...`, 'yellow');
  
  try {
    const response = await fetch('https://local.cloudauditpro.com:3000/api/audits/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMDQ3NjgzNTkzNjQ3NzIwMzY0ODAiLCJlbWFpbCI6ImhhY3ZhbmFAZ21haWwuY29tIiwibmFtZSI6Ikxpb3IgUGFyZG8iLCJyb2xlIjoidXNlciIsImlhdCI6MTc0ODEwODA1NCwiZXhwIjoxNzQ4MTk0NDU0fQ.eaDtBOuJc1LJS1GWfn5VodxTwSFStLkD8Hxfj9GW9iE'
      },
      body: JSON.stringify({
        projectId: 'cloudauditpro',
        category: category
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const executionTime = Date.now() - startTime;
    
    if (data.success) {
      const results = data.results;
      const summary = results.summary || {};
      
      // Determine status based on results
      let status = 'working';
      let hasRealData = false;
      let hasPermissionIssues = false;
      
      if (results.status === 'error') {
        status = 'error';
        hasPermissionIssues = results.findings?.[0]?.description?.includes('Insufficient Permission');
      } else if (results.findings && results.findings.length > 0) {
        hasRealData = results.findings.some(f => 
          f.description && !f.description.includes('0 ') && 
          !f.description.includes('No description available')
        );
        
        hasPermissionIssues = results.findings.some(f => 
          f.description?.includes('Insufficient Permission') ||
          f.error?.includes('Insufficient Permission')
        );
      }
      
      // Status icon and color
      let icon, statusColor;
      if (hasPermissionIssues) {
        icon = '🔐';
        statusColor = 'yellow';
        status = 'permission_needed';
      } else if (hasRealData) {
        icon = '✅';
        statusColor = 'green';
        status = 'working_with_data';
      } else if (status === 'working') {
        icon = '🔄';
        statusColor = 'blue';
        status = 'working_no_data';
      } else {
        icon = '❌';
        statusColor = 'red';
      }
      
      log(`   ${icon} Status: ${status.toUpperCase().replace(/_/g, ' ')}`, statusColor);
      log(`   ⏱️  Execution time: ${executionTime}ms`, 'blue');
      
      if (summary.total_checks || summary.totalChecks) {
        const total = summary.total_checks || summary.totalChecks;
        const passed = summary.passed || 0;
        const failed = summary.failures || summary.failed || 0;
        const warnings = summary.warnings || 0;
        
        log(`   📊 Checks: ${total} total, ${passed} passed, ${failed} failed, ${warnings} warnings`, 'blue');
        
        if (summary.potential_savings || summary.costSavingsPotential) {
          const savings = summary.potential_savings || `$${summary.costSavingsPotential}/month`;
          log(`   💰 Potential savings: ${savings}`, 'green');
        }
      }
      
      if (results.findings && results.findings.length > 0) {
        log(`   🔍 Findings: ${results.findings.length}`, 'blue');
        
        // Show sample findings
        results.findings.slice(0, 3).forEach(finding => {
          const severity = finding.severity || 'info';
          const severityColor = severity === 'high' ? 'red' : severity === 'medium' ? 'yellow' : 'blue';
          log(`     • ${finding.title || finding.check}: ${finding.description || 'No description'}`, severityColor);
        });
        
        if (results.findings.length > 3) {
          log(`     ... and ${results.findings.length - 3} more findings`, 'blue');
        }
      }
      
      return {
        category,
        status,
        success: true,
        executionTime,
        hasRealData,
        hasPermissionIssues,
        findingsCount: results.findings?.length || 0,
        totalChecks: summary.total_checks || summary.totalChecks || 0,
        passed: summary.passed || 0,
        failed: summary.failures || summary.failed || 0,
        warnings: summary.warnings || 0,
        potentialSavings: summary.potential_savings || summary.costSavingsPotential || 0,
        data: results
      };
      
    } else {
      throw new Error(data.error || 'Audit failed');
    }
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return {
      category,
      status: 'error',
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

async function testAllAudits() {
  logHeader('CloudAuditPro Complete Audit System Test');
  
  const auditCategories = [
    'compute',
    'storage', 
    'bigquery',
    'networking',
    'security',
    'cost',
    'monitoring',
    'iam',
    'gke',
    'serverless',
    'data-protection',
    'compliance',
    'resource-utilization',
    'cost-allocation',
    'billing',
    'budget',
    'discount'
  ];
  
  const results = [];
  
  // Test individual categories
  for (const category of auditCategories) {
    const result = await testAuditCategory(category);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test "all" category
  log('\n🔍 Testing "all" category (comprehensive audit)...', 'yellow');
  const allResult = await testAuditCategory('all');
  
  return { individual: results, all: allResult };
}

function generateSummaryReport(testResults) {
  logHeader('Test Summary Report');
  
  const { individual, all } = testResults;
  
  // Individual audit statistics
  const totalAudits = individual.length;
  const workingAudits = individual.filter(r => r.success && r.status.includes('working')).length;
  const permissionIssues = individual.filter(r => r.hasPermissionIssues).length;
  const errorAudits = individual.filter(r => !r.success).length;
  const auditsWithData = individual.filter(r => r.hasRealData).length;
  
  log(`📊 Individual Audit Results:`, 'bright');
  log(`   Total audits tested: ${totalAudits}`, 'blue');
  log(`   ✅ Working audits: ${workingAudits} (${Math.round(workingAudits/totalAudits*100)}%)`, 'green');
  log(`   🔄 Audits with real data: ${auditsWithData} (${Math.round(auditsWithData/totalAudits*100)}%)`, 'green');
  log(`   🔐 Permission issues: ${permissionIssues} (${Math.round(permissionIssues/totalAudits*100)}%)`, 'yellow');
  log(`   ❌ Error audits: ${errorAudits} (${Math.round(errorAudits/totalAudits*100)}%)`, 'red');
  
  // Calculate total metrics
  const totalChecks = individual.reduce((sum, r) => sum + (r.totalChecks || 0), 0);
  const totalFindings = individual.reduce((sum, r) => sum + (r.findingsCount || 0), 0);
  const totalPassed = individual.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = individual.reduce((sum, r) => sum + (r.failed || 0), 0);
  const totalExecutionTime = individual.reduce((sum, r) => sum + (r.executionTime || 0), 0);
  
  log(`\n📈 Aggregate Metrics:`, 'bright');
  log(`   Total checks performed: ${totalChecks}`, 'blue');
  log(`   Total findings generated: ${totalFindings}`, 'blue');
  log(`   Overall pass rate: ${Math.round(totalPassed/(totalPassed+totalFailed)*100)}%`, 'green');
  log(`   Total execution time: ${totalExecutionTime}ms`, 'blue');
  
  // "All" audit results
  if (all.success) {
    log(`\n🔥 "Run All Audits" Results:`, 'bright');
    log(`   Status: ${all.status.toUpperCase().replace(/_/g, ' ')}`, 'green');
    log(`   Execution time: ${all.executionTime}ms`, 'blue');
    log(`   Total findings: ${all.findingsCount || 0}`, 'blue');
    
    if (all.data.results.summary) {
      const summary = all.data.results.summary;
      log(`   Categories run: ${summary.categories_run?.length || 'Unknown'}`, 'blue');
      log(`   Total checks: ${summary.total_checks || 0}`, 'blue');
      log(`   Potential savings: ${summary.potential_savings || '$0/month'}`, 'green');
    }
  }
  
  // Performance analysis
  log(`\n⚡ Performance Analysis:`, 'bright');
  const avgExecutionTime = totalExecutionTime / individual.length;
  log(`   Average execution time: ${Math.round(avgExecutionTime)}ms`, 'blue');
  
  const fastAudits = individual.filter(r => r.executionTime < 2000).length;
  const slowAudits = individual.filter(r => r.executionTime > 5000).length;
  
  log(`   Fast audits (<2s): ${fastAudits}`, 'green');
  log(`   Slow audits (>5s): ${slowAudits}`, slowAudits > 0 ? 'yellow' : 'green');
}

function generateRecommendations(testResults) {
  logHeader('Recommendations & Next Steps');
  
  const { individual } = testResults;
  
  const successRate = individual.filter(r => r.success).length / individual.length;
  const dataRate = individual.filter(r => r.hasRealData).length / individual.length;
  
  if (successRate >= 0.9) {
    log('🎉 EXCELLENT! Audit system is production-ready!', 'green');
  } else if (successRate >= 0.8) {
    log('👍 GOOD! Most audits working, minor issues to resolve.', 'green');
  } else {
    log('⚠️  MODERATE. Several audits need attention.', 'yellow');
  }
  
  // Permission issues
  const permissionAudits = individual.filter(r => r.hasPermissionIssues);
  if (permissionAudits.length > 0) {
    log('\n🔐 OAuth Permission Issues:', 'bright');
    log('   The following audits need broader OAuth scopes:', 'yellow');
    permissionAudits.forEach(audit => {
      log(`     • ${audit.category}`, 'yellow');
    });
    log('   💡 Solution: Re-authenticate with expanded GCP scopes', 'blue');
  }
  
  // Data availability
  if (dataRate < 0.5) {
    log('\n📊 Data Availability:', 'bright');
    log('   Many audits return empty results. This could indicate:', 'yellow');
    log('     • Project has no resources in those categories', 'blue');
    log('     • OAuth scopes insufficient for data access', 'blue');
    log('     • Project permissions not configured correctly', 'blue');
  }
  
  log('\n📋 Action Items:', 'bright');
  log('1. ✅ Fix remaining CSRF token validation for production', 'blue');
  log('2. 🔐 Expand OAuth scopes to include all required GCP APIs', 'blue');
  log('3. 📊 Test with GCP projects that have actual resources', 'blue');
  log('4. 🧪 Implement automated testing pipeline', 'blue');
  log('5. 📈 Add performance monitoring and alerting', 'blue');
}

async function main() {
  try {
    const testResults = await testAllAudits();
    generateSummaryReport(testResults);
    generateRecommendations(testResults);
    
    logHeader('Testing Complete');
    
    const successRate = testResults.individual.filter(r => r.success).length / testResults.individual.length;
    
    if (successRate >= 0.9) {
      log('🎉 SYSTEM READY FOR PRODUCTION!', 'green');
      process.exit(0);
    } else if (successRate >= 0.7) {
      log('👍 System mostly ready, minor fixes needed.', 'yellow');
      process.exit(1);
    } else {
      log('⚠️  System needs more work before production.', 'red');
      process.exit(2);
    }
    
  } catch (error) {
    log(`❌ Testing failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(3);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testAllAudits, testAuditCategory }; 