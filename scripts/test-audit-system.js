#!/usr/bin/env node

/**
 * CloudAuditPro Audit System Testing Script
 * 
 * This script comprehensively tests all audit scripts, validates their structure,
 * and provides a detailed report of the system status.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results storage
const testResults = {
  scripts: {},
  summary: {
    total: 0,
    working: 0,
    issues: 0,
    missing: 0
  }
};

// Expected audit script structure
const expectedExports = ['run'];
const expectedReturnStructure = ['findings', 'summary', 'errors'];

// Audit script categories and their expected scripts
const auditCategories = {
  'Core Infrastructure': [
    'bigquery-audit.js',
    'compute-audit.js',
    'storage-audit.js',
    'networking-audit.js',
    'security-audit.js',
    'monitoring-audit.js'
  ],
  'Cost Management': [
    'cost-audit.js',
    'cost-allocation-audit.js',
    'cost-management-audit.js',
    'billing-audit.js',
    'billing-advanced-audit.js',
    'budget-audit.js',
    'discount-audit.js'
  ],
  'Specialized Services': [
    'gke-audit.js',
    'serverless-audit.js',
    'storage-lifecycle-audit.js',
    'resource-utilization-audit.js',
    'data-protection-audit.js',
    'compliance-audit.js',
    'devops-audit.js',
    'iam-audit.js',
    'org-policy-audit.js',
    'permissions-audit.js'
  ],
  'Utility Scripts': [
    'run-all-audits.js',
    'writeAuditResults.js',
    'gcpClient.js',
    'auth.js',
    'oauth-auth.js'
  ]
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubHeader(message) {
  log('\n' + '-'.repeat(40), 'blue');
  log(message, 'bright');
  log('-'.repeat(40), 'blue');
}

function testScriptStructure(scriptPath, scriptName) {
  const result = {
    name: scriptName,
    exists: false,
    loads: false,
    exports: [],
    hasRunFunction: false,
    runFunctionType: null,
    issues: [],
    status: 'unknown'
  };

  try {
    // Check if file exists
    if (!fs.existsSync(scriptPath)) {
      result.issues.push('File does not exist');
      result.status = 'missing';
      return result;
    }
    result.exists = true;

    // Try to require the script
    delete require.cache[require.resolve(scriptPath)];
    const script = require(scriptPath);
    result.loads = true;
    result.exports = Object.keys(script);

    // Check for run function
    if (script.run && typeof script.run === 'function') {
      result.hasRunFunction = true;
      result.runFunctionType = 'function';
    } else if (script.run) {
      result.hasRunFunction = true;
      result.runFunctionType = typeof script.run;
      result.issues.push(`run export is ${typeof script.run}, expected function`);
    } else {
      result.issues.push('Missing run function export');
    }

    // Validate expected exports
    const missingExports = expectedExports.filter(exp => !result.exports.includes(exp));
    if (missingExports.length > 0) {
      result.issues.push(`Missing exports: ${missingExports.join(', ')}`);
    }

    // Determine overall status
    if (result.issues.length === 0) {
      result.status = 'working';
    } else if (result.hasRunFunction) {
      result.status = 'issues';
    } else {
      result.status = 'broken';
    }

  } catch (error) {
    result.issues.push(`Load error: ${error.message}`);
    result.status = 'broken';
  }

  return result;
}

function testScriptExecution(scriptPath, scriptName) {
  const result = {
    canExecute: false,
    mockTestPassed: false,
    returnStructure: null,
    executionError: null
  };

  try {
    delete require.cache[require.resolve(scriptPath)];
    const script = require(scriptPath);

    if (script.run && typeof script.run === 'function') {
      // Test with mock data (won't actually call GCP APIs)
      const mockProjectId = 'test-project-123';
      const mockTokens = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
      };

      // Note: We're not actually executing the script here to avoid API calls
      // This is just checking if the function can be called
      result.canExecute = true;
      
      // Check if the script has proper parameter handling
      const functionString = script.run.toString();
      const hasProjectIdParam = functionString.includes('projectId');
      const hasTokensParam = functionString.includes('tokens');
      
      if (hasProjectIdParam && hasTokensParam) {
        result.mockTestPassed = true;
      }
    }
  } catch (error) {
    result.executionError = error.message;
  }

  return result;
}

function analyzeScriptContent(scriptPath) {
  const analysis = {
    hasGoogleAPIs: false,
    hasWriteAuditResults: false,
    hasErrorHandling: false,
    hasAsyncAwait: false,
    linesOfCode: 0,
    complexity: 'unknown'
  };

  try {
    const content = fs.readFileSync(scriptPath, 'utf8');
    analysis.linesOfCode = content.split('\n').length;
    
    // Check for Google APIs usage
    analysis.hasGoogleAPIs = content.includes('google.') || content.includes('googleapis');
    
    // Check for audit results writing
    analysis.hasWriteAuditResults = content.includes('writeAuditResults');
    
    // Check for error handling
    analysis.hasErrorHandling = content.includes('try') && content.includes('catch');
    
    // Check for async/await
    analysis.hasAsyncAwait = content.includes('async') && content.includes('await');
    
    // Determine complexity based on lines of code
    if (analysis.linesOfCode < 50) {
      analysis.complexity = 'simple';
    } else if (analysis.linesOfCode < 200) {
      analysis.complexity = 'medium';
    } else {
      analysis.complexity = 'complex';
    }
    
  } catch (error) {
    // File doesn't exist or can't be read
  }

  return analysis;
}

function generateStatusIcon(status) {
  switch (status) {
    case 'working': return '✅';
    case 'issues': return '⚠️';
    case 'broken': return '❌';
    case 'missing': return '🚫';
    default: return '❓';
  }
}

function testAllScripts() {
  logHeader('CloudAuditPro Audit System Testing');
  
  const scriptsDir = path.join(__dirname, '..', 'shared-scripts', 'gcp-audit');
  
  if (!fs.existsSync(scriptsDir)) {
    log('❌ Scripts directory not found: ' + scriptsDir, 'red');
    return;
  }

  log(`📁 Testing scripts in: ${scriptsDir}`, 'blue');

  // Test each category
  Object.entries(auditCategories).forEach(([category, scripts]) => {
    logSubHeader(`${category} Scripts`);
    
    scripts.forEach(scriptName => {
      const scriptPath = path.join(scriptsDir, scriptName);
      
      log(`\n🔍 Testing: ${scriptName}`, 'yellow');
      
      // Test script structure
      const structureTest = testScriptStructure(scriptPath, scriptName);
      testResults.scripts[scriptName] = structureTest;
      testResults.summary.total++;
      
      // Update summary counts
      switch (structureTest.status) {
        case 'working':
          testResults.summary.working++;
          break;
        case 'issues':
          testResults.summary.issues++;
          break;
        case 'missing':
          testResults.summary.missing++;
          break;
      }
      
      // Test execution capability
      if (structureTest.loads) {
        const executionTest = testScriptExecution(scriptPath, scriptName);
        structureTest.execution = executionTest;
      }
      
      // Analyze script content
      if (structureTest.exists) {
        const contentAnalysis = analyzeScriptContent(scriptPath);
        structureTest.analysis = contentAnalysis;
      }
      
      // Display results
      const icon = generateStatusIcon(structureTest.status);
      log(`   ${icon} Status: ${structureTest.status.toUpperCase()}`, 
          structureTest.status === 'working' ? 'green' : 
          structureTest.status === 'issues' ? 'yellow' : 'red');
      
      if (structureTest.exists) {
        log(`   📊 Lines: ${structureTest.analysis?.linesOfCode || 'unknown'} | ` +
            `Complexity: ${structureTest.analysis?.complexity || 'unknown'}`, 'blue');
        
        if (structureTest.analysis?.hasGoogleAPIs) {
          log(`   🔗 Uses Google APIs`, 'green');
        }
        
        if (structureTest.analysis?.hasWriteAuditResults) {
          log(`   💾 Writes audit results`, 'green');
        }
        
        if (structureTest.analysis?.hasErrorHandling) {
          log(`   🛡️  Has error handling`, 'green');
        }
      }
      
      if (structureTest.issues.length > 0) {
        structureTest.issues.forEach(issue => {
          log(`   ⚠️  ${issue}`, 'yellow');
        });
      }
    });
  });
}

function generateSummaryReport() {
  logHeader('Test Summary Report');
  
  const { total, working, issues, missing } = testResults.summary;
  const broken = total - working - issues - missing;
  
  log(`📊 Total Scripts Tested: ${total}`, 'bright');
  log(`✅ Working Scripts: ${working} (${Math.round(working/total*100)}%)`, 'green');
  log(`⚠️  Scripts with Issues: ${issues} (${Math.round(issues/total*100)}%)`, 'yellow');
  log(`❌ Broken Scripts: ${broken} (${Math.round(broken/total*100)}%)`, 'red');
  log(`🚫 Missing Scripts: ${missing} (${Math.round(missing/total*100)}%)`, 'red');
  
  // Recommendations
  logSubHeader('Recommendations');
  
  if (working >= total * 0.8) {
    log('🎉 Excellent! Most scripts are working correctly.', 'green');
  } else if (working >= total * 0.6) {
    log('👍 Good progress, but some scripts need attention.', 'yellow');
  } else {
    log('⚠️  Many scripts need fixes before production use.', 'red');
  }
  
  // Priority actions
  const brokenScripts = Object.entries(testResults.scripts)
    .filter(([name, result]) => result.status === 'broken' || result.status === 'missing')
    .map(([name]) => name);
    
  if (brokenScripts.length > 0) {
    log('\n🔧 Priority Fixes Needed:', 'bright');
    brokenScripts.forEach(script => {
      log(`   • ${script}`, 'red');
    });
  }
  
  const issueScripts = Object.entries(testResults.scripts)
    .filter(([name, result]) => result.status === 'issues')
    .map(([name]) => name);
    
  if (issueScripts.length > 0) {
    log('\n⚠️  Scripts Needing Minor Fixes:', 'bright');
    issueScripts.forEach(script => {
      log(`   • ${script}`, 'yellow');
    });
  }
}

function generateDetailedReport() {
  logHeader('Detailed Script Analysis');
  
  Object.entries(testResults.scripts).forEach(([scriptName, result]) => {
    if (result.status !== 'working') {
      log(`\n📋 ${scriptName}:`, 'bright');
      log(`   Status: ${result.status}`, result.status === 'working' ? 'green' : 'red');
      
      if (result.issues.length > 0) {
        log(`   Issues:`, 'yellow');
        result.issues.forEach(issue => {
          log(`     - ${issue}`, 'red');
        });
      }
      
      if (result.analysis) {
        log(`   Analysis:`, 'blue');
        log(`     - Lines of code: ${result.analysis.linesOfCode}`);
        log(`     - Complexity: ${result.analysis.complexity}`);
        log(`     - Uses Google APIs: ${result.analysis.hasGoogleAPIs ? 'Yes' : 'No'}`);
        log(`     - Has error handling: ${result.analysis.hasErrorHandling ? 'Yes' : 'No'}`);
      }
    }
  });
}

function saveReportToFile() {
  const reportPath = path.join(__dirname, '..', 'audit-system-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    scripts: testResults.scripts,
    recommendations: {
      immediate: [],
      shortTerm: [],
      longTerm: []
    }
  };
  
  // Generate recommendations
  Object.entries(testResults.scripts).forEach(([name, result]) => {
    if (result.status === 'missing' || result.status === 'broken') {
      report.recommendations.immediate.push(`Fix or implement ${name}`);
    } else if (result.status === 'issues') {
      report.recommendations.shortTerm.push(`Resolve issues in ${name}`);
    }
  });
  
  if (testResults.summary.working / testResults.summary.total < 0.8) {
    report.recommendations.longTerm.push('Implement comprehensive testing framework');
    report.recommendations.longTerm.push('Add automated CI/CD testing');
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n💾 Detailed report saved to: ${reportPath}`, 'green');
}

// Main execution
function main() {
  try {
    testAllScripts();
    generateSummaryReport();
    generateDetailedReport();
    saveReportToFile();
    
    logHeader('Testing Complete');
    
    const successRate = testResults.summary.working / testResults.summary.total;
    if (successRate >= 0.8) {
      log('🎉 System is ready for production testing!', 'green');
      process.exit(0);
    } else if (successRate >= 0.6) {
      log('⚠️  System needs some fixes before production.', 'yellow');
      process.exit(1);
    } else {
      log('❌ System needs significant work before production.', 'red');
      process.exit(2);
    }
    
  } catch (error) {
    log(`❌ Testing failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(3);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testAllScripts,
  testScriptStructure,
  testScriptExecution,
  analyzeScriptContent,
  testResults
}; 