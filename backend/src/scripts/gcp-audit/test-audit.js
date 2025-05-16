const path = require('path');
const fs = require('fs').promises;

async function testAudit(scriptName) {
  console.log(`\n🔍 Testing ${scriptName}...`);
  
  try {
    // Import the audit script
    const scriptPath = path.join(__dirname, scriptName);
    const audit = require(scriptPath);
    
    // Run the audit - handle both function and object exports
    console.log('Running audit...');
    const results = typeof audit === 'function' 
      ? await audit()
      : await audit.audit();
    
    // Verify results file exists
    const dashName = scriptName.replace('.js', '').replace(/_/g, '-');
    let resultsFileName = `${dashName}-audit-results.json`;
    let resultsPath = path.join(__dirname, resultsFileName);
    let resultsContent;
    try {
      resultsContent = await fs.readFile(resultsPath, 'utf8');
    } catch (err) {
      // Try fallback to -results.json if -audit-results.json not found
      resultsFileName = `${dashName}-results.json`;
      resultsPath = path.join(__dirname, resultsFileName);
      resultsContent = await fs.readFile(resultsPath, 'utf8');
    }
    
    try {
      const parsedResults = JSON.parse(resultsContent);
      
      // Write a short text header with test results and timestamp
      const header = `# Test Results for ${scriptName}\n# Timestamp: ${new Date().toISOString()}\n# Summary: ${JSON.stringify(parsedResults.summary)}\n\n`;
      await fs.writeFile(resultsPath, header + resultsContent, 'utf8');
      
      console.log('\n✅ Results file created successfully');
      console.log('📊 Results summary:');
      console.log(JSON.stringify(parsedResults.summary, null, 2));
      
      // Validate results structure
      const requiredFields = ['findings', 'summary', 'errors', 'timestamp'];
      const missingFields = requiredFields.filter(field => !(field in parsedResults));
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
      } else {
        console.log('✅ Results structure is valid');
      }
      
      return {
        success: true,
        results: parsedResults,
        errors: []
      };
    } catch (error) {
      console.error('❌ Error reading results file:', error.message);
      return {
        success: false,
        error: `Failed to read results file: ${error.message}`
      };
    }
  } catch (error) {
    console.error('❌ Error running audit:', error);
    return {
      success: false,
      error: `Failed to run audit: ${error.message}`
    };
  }
}

// If run directly, test the specified script
if (require.main === module) {
  const scriptName = process.argv[2];
  if (!scriptName) {
    console.error('Please provide a script name to test');
    process.exit(1);
  }
  
  testAudit(scriptName)
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testAudit; 