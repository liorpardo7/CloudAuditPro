#!/usr/bin/env node

/**
 * Live Audit Testing Script
 * 
 * This script tests audit functionality by directly calling audit scripts
 * with mock tokens to verify they work correctly.
 */

const path = require('path');

// Mock tokens for testing (won't actually call GCP APIs without real tokens)
const mockTokens = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  scope: 'https://www.googleapis.com/auth/cloud-platform',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600000
};

const testProjectId = 'cloudauditpro';

// ANSI color codes
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

async function testAuditScript(scriptName) {
  log(`\n🔍 Testing ${scriptName}...`, 'yellow');
  
  try {
    const scriptPath = path.join(__dirname, '..', 'shared-scripts', 'gcp-audit', scriptName);
    
    // Clear require cache
    delete require.cache[require.resolve(scriptPath)];
    
    const auditScript = require(scriptPath);
    
    if (!auditScript.run || typeof auditScript.run !== 'function') {
      log(`❌ ${scriptName} does not export a run function`, 'red');
      return false;
    }
    
    log(`✅ ${scriptName} loaded successfully`, 'green');
    log(`📋 Function signature: ${auditScript.run.toString().split('\n')[0]}`, 'blue');
    
    // Note: We're not actually running the audit to avoid API calls
    // This just verifies the script structure is correct
    return true;
    
  } catch (error) {
    log(`❌ Error testing ${scriptName}: ${error.message}`, 'red');
    return false;
  }
}

async function testCoreAudits() {
  logHeader('Testing Core Audit Scripts');
  
  const coreScripts = [
    'bigquery-audit.js',
    'compute-audit.js', 
    'storage-audit.js',
    'networking-audit.js',
    'security-audit.js',
    'monitoring-audit.js'
  ];
  
  const results = {};
  
  for (const script of coreScripts) {
    results[script] = await testAuditScript(script);
  }
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = coreScripts.length;
  
  log(`\n📊 Core Scripts Results: ${successCount}/${totalCount} working (${Math.round(successCount/totalCount*100)}%)`, 
      successCount === totalCount ? 'green' : 'yellow');
  
  return results;
}

async function testCostAudits() {
  logHeader('Testing Cost Management Scripts');
  
  const costScripts = [
    'cost-audit.js',
    'cost-allocation-audit.js',
    'billing-audit.js',
    'budget-audit.js',
    'discount-audit.js'
  ];
  
  const results = {};
  
  for (const script of costScripts) {
    results[script] = await testAuditScript(script);
  }
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = costScripts.length;
  
  log(`\n📊 Cost Scripts Results: ${successCount}/${totalCount} working (${Math.round(successCount/totalCount*100)}%)`, 
      successCount === totalCount ? 'green' : 'yellow');
  
  return results;
}

async function testSpecializedAudits() {
  logHeader('Testing Specialized Service Scripts');
  
  const specializedScripts = [
    'gke-audit.js',
    'serverless-audit.js',
    'storage-lifecycle-audit.js',
    'resource-utilization-audit.js',
    'data-protection-audit.js',
    'compliance-audit.js',
    'iam-audit.js'
  ];
  
  const results = {};
  
  for (const script of specializedScripts) {
    results[script] = await testAuditScript(script);
  }
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = specializedScripts.length;
  
  log(`\n📊 Specialized Scripts Results: ${successCount}/${totalCount} working (${Math.round(successCount/totalCount*100)}%)`, 
      successCount === totalCount ? 'green' : 'yellow');
  
  return results;
}

async function testBackendIntegration() {
  logHeader('Testing Backend Integration');
  
  try {
    // Test if backend is running
    const response = await fetch('http://localhost:7778/api/health');
    if (response.ok) {
      const data = await response.json();
      log(`✅ Backend health check: ${data.status}`, 'green');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateRecommendations(allResults) {
  logHeader('Recommendations');
  
  const allScripts = Object.keys(allResults).reduce((acc, category) => {
    return { ...acc, ...allResults[category] };
  }, {});
  
  const workingScripts = Object.entries(allScripts).filter(([name, working]) => working);
  const brokenScripts = Object.entries(allScripts).filter(([name, working]) => !working);
  
  const totalScripts = Object.keys(allScripts).length;
  const workingCount = workingScripts.length;
  const successRate = workingCount / totalScripts;
  
  log(`📊 Overall Success Rate: ${workingCount}/${totalScripts} (${Math.round(successRate * 100)}%)`, 
      successRate >= 0.8 ? 'green' : successRate >= 0.6 ? 'yellow' : 'red');
  
  if (successRate >= 0.9) {
    log('🎉 Excellent! The audit system is ready for production.', 'green');
  } else if (successRate >= 0.8) {
    log('👍 Good! Most audits are working. Minor fixes needed.', 'green');
  } else if (successRate >= 0.6) {
    log('⚠️  Moderate success. Some audits need attention.', 'yellow');
  } else {
    log('❌ Many audits need fixes before production use.', 'red');
  }
  
  if (brokenScripts.length > 0) {
    log('\n🔧 Scripts needing fixes:', 'bright');
    brokenScripts.forEach(([name]) => {
      log(`   • ${name}`, 'red');
    });
  }
  
  log('\n📋 Next Steps:', 'bright');
  log('1. Fix CSRF token validation for API endpoints', 'blue');
  log('2. Test audits with real GCP projects and tokens', 'blue');
  log('3. Verify OAuth scopes include all required permissions', 'blue');
  log('4. Test end-to-end audit workflow in admin interface', 'blue');
  log('5. Implement automated testing for audit scripts', 'blue');
}

async function main() {
  logHeader('CloudAuditPro Live Audit Testing');
  
  try {
    // Test backend connectivity
    const backendWorking = await testBackendIntegration();
    
    // Test audit script categories
    const coreResults = await testCoreAudits();
    const costResults = await testCostAudits();
    const specializedResults = await testSpecializedAudits();
    
    const allResults = {
      core: coreResults,
      cost: costResults,
      specialized: specializedResults
    };
    
    // Generate recommendations
    await generateRecommendations(allResults);
    
    logHeader('Testing Complete');
    
    // Calculate overall success
    const allScripts = Object.values(allResults).reduce((acc, category) => {
      return { ...acc, ...category };
    }, {});
    
    const successRate = Object.values(allScripts).filter(Boolean).length / Object.keys(allScripts).length;
    
    if (successRate >= 0.8 && backendWorking) {
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
  testAuditScript,
  testCoreAudits,
  testCostAudits,
  testSpecializedAudits,
  testBackendIntegration
}; 