const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  const findings = [];
  const summary = { totalChecks: 0, passed: 0, failed: 0, warnings: 0, costSavingsPotential: 0 };
  const errors = [];
  
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    
    // Initialize APIs
    const storage = google.storage({ version: 'v1', auth: authClient });
    const monitoring = google.monitoring({ version: 'v3', auth: authClient });
    const iam = google.iam({ version: 'v1', auth: authClient });

    // 1. Bucket Inventory
    console.log('Starting bucket inventory...');
    try {
      const bucketsResp = await storage.buckets.list({ project: projectId });
      const buckets = bucketsResp.data.items || [];
      
      findings.push({
        check: 'Bucket Inventory',
        result: `Found ${buckets.length} storage buckets`,
        passed: true,
        details: buckets.map(bucket => ({
          name: bucket.name,
          location: bucket.location,
          storageClass: bucket.storageClass,
          createdAt: bucket.timeCreated,
          metageneration: bucket.metageneration,
          labels: bucket.labels
        }))
      });
      summary.totalChecks++;
      summary.passed++;

      // 2. Check bucket security and IAM policies
      console.log('Checking bucket security...');
      for (const bucket of buckets) {
        try {
          // Check bucket IAM policy
          const iamPolicyResp = await storage.buckets.getIamPolicy({ bucket: bucket.name });
          const policy = iamPolicyResp.data;
          
          // Check for public access
          const hasPublicAccess = policy.bindings?.some(binding => 
            binding.members?.includes('allUsers') || binding.members?.includes('allAuthenticatedUsers')
          );
          
          if (hasPublicAccess) {
            findings.push({
              check: 'Bucket Security',
              result: `Bucket ${bucket.name} has public access`,
              passed: false,
              resource: bucket.name,
              severity: 'high',
              recommendation: 'Review and restrict public access to bucket'
            });
            summary.failed++;
          } else {
            findings.push({
              check: 'Bucket Security',
              result: `Bucket ${bucket.name} has secure access controls`,
              passed: true,
              resource: bucket.name
            });
            summary.passed++;
          }
          summary.totalChecks++;

          // Check encryption
          const bucketDetails = await storage.buckets.get({ bucket: bucket.name });
          const encryption = bucketDetails.data.encryption;
          
          if (!encryption || !encryption.defaultKmsKeyName) {
            findings.push({
              check: 'Bucket Encryption',
              result: `Bucket ${bucket.name} uses default encryption (not CMEK)`,
              passed: false,
              resource: bucket.name,
              severity: 'medium',
              recommendation: 'Consider using Customer-Managed Encryption Keys (CMEK) for better security'
            });
            summary.warnings++;
          } else {
            findings.push({
              check: 'Bucket Encryption',
              result: `Bucket ${bucket.name} uses CMEK encryption`,
              passed: true,
              resource: bucket.name
            });
            summary.passed++;
          }
          summary.totalChecks++;

          // Check lifecycle management
          const hasLifecycle = bucketDetails.data.lifecycle && bucketDetails.data.lifecycle.rule;
          if (!hasLifecycle || bucketDetails.data.lifecycle.rule.length === 0) {
            findings.push({
              check: 'Lifecycle Management',
              result: `Bucket ${bucket.name} has no lifecycle rules`,
              passed: false,
              resource: bucket.name,
              severity: 'medium',
              recommendation: 'Configure lifecycle rules to automatically manage object storage classes and deletion'
            });
            summary.warnings++;
          } else {
            findings.push({
              check: 'Lifecycle Management',
              result: `Bucket ${bucket.name} has ${bucketDetails.data.lifecycle.rule.length} lifecycle rules`,
              passed: true,
              resource: bucket.name,
              details: bucketDetails.data.lifecycle.rule
            });
            summary.passed++;
          }
          summary.totalChecks++;

          // Check versioning
          const versioning = bucketDetails.data.versioning;
          if (!versioning || !versioning.enabled) {
            findings.push({
              check: 'Object Versioning',
              result: `Bucket ${bucket.name} has versioning disabled`,
              passed: false,
              resource: bucket.name,
              severity: 'low',
              recommendation: 'Enable versioning for data protection and recovery'
            });
            summary.warnings++;
          } else {
            findings.push({
              check: 'Object Versioning',
              result: `Bucket ${bucket.name} has versioning enabled`,
              passed: true,
              resource: bucket.name
            });
            summary.passed++;
          }
          summary.totalChecks++;

          // Check storage class optimization opportunities
          const objectsResp = await storage.objects.list({ bucket: bucket.name, maxResults: 100 });
          const objects = objectsResp.data.items || [];
          
          let optimizationOpportunities = 0;
          for (const obj of objects) {
            const lastModified = new Date(obj.updated);
            const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
            
            // Check if object should be moved to cheaper storage class
            if (obj.storageClass === 'STANDARD' && daysSinceModified > 30) {
              optimizationOpportunities++;
            }
          }
          
          if (optimizationOpportunities > 0) {
            findings.push({
              check: 'Storage Class Optimization',
              result: `Bucket ${bucket.name} has ${optimizationOpportunities} objects that could use cheaper storage classes`,
              passed: false,
              resource: bucket.name,
              severity: 'low',
              recommendation: 'Consider moving older objects to Nearline, Coldline, or Archive storage',
              costSavings: `$${(optimizationOpportunities * 0.01).toFixed(2)}/month estimated savings`
            });
            summary.warnings++;
            summary.costSavingsPotential += optimizationOpportunities * 0.01;
          } else {
            findings.push({
              check: 'Storage Class Optimization',
              result: `Bucket ${bucket.name} storage classes appear optimized`,
              passed: true,
              resource: bucket.name
            });
            summary.passed++;
          }
          summary.totalChecks++;

        } catch (bucketError) {
          errors.push({ 
            check: `Bucket Analysis (${bucket.name})`, 
            error: bucketError.message 
          });
          summary.failed++;
          summary.totalChecks++;
        }
      }

      // 3. Cross-bucket analysis
      console.log('Performing cross-bucket analysis...');
      if (buckets.length > 1) {
        // Check for consistent labeling
        const bucketsWithoutLabels = buckets.filter(bucket => !bucket.labels || Object.keys(bucket.labels).length === 0);
        if (bucketsWithoutLabels.length > 0) {
          findings.push({
            check: 'Bucket Labeling Consistency',
            result: `${bucketsWithoutLabels.length} buckets missing labels`,
            passed: false,
            severity: 'low',
            recommendation: 'Add consistent labels to all buckets for better organization and cost tracking',
            details: bucketsWithoutLabels.map(b => b.name)
          });
          summary.warnings++;
        } else {
          findings.push({
            check: 'Bucket Labeling Consistency',
            result: 'All buckets have labels',
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;

        // Check for location optimization
        const locations = [...new Set(buckets.map(bucket => bucket.location))];
        if (locations.length > 2) {
          findings.push({
            check: 'Location Optimization',
            result: `Buckets spread across ${locations.length} regions: ${locations.join(', ')}`,
            passed: false,
            severity: 'low',
            recommendation: 'Consider consolidating buckets to fewer regions to reduce egress costs',
            details: { regions: locations, bucketCount: buckets.length }
          });
          summary.warnings++;
        } else {
          findings.push({
            check: 'Location Optimization',
            result: `Buckets efficiently distributed across ${locations.length} regions`,
            passed: true
          });
          summary.passed++;
        }
        summary.totalChecks++;
      }

    } catch (err) {
      errors.push({ check: 'Storage Audit', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }

    // Calculate final summary
    summary.warnings = findings.filter(f => f.severity === 'medium' || f.severity === 'low').length;
    
    console.log('Storage audit completed:', summary);
    await writeAuditResults('storage-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
    
  } catch (err) {
    console.error('Error in storage audit:', err);
    errors.push({ check: 'Storage Audit - Critical Error', error: err.message });
    summary.failed++;
    summary.totalChecks++;
    await writeAuditResults('storage-audit', findings, summary, errors, projectId);
    throw err;
  }
}

module.exports = { run };

// Run the audit if this file is executed directly
if (require.main === module) {
  const projectId = process.argv[2];
  const tokensJson = process.argv[3];
  
  if (!projectId || !tokensJson) {
    console.error('Usage: node storage-audit.js <projectId> <tokensJson>');
    process.exit(1);
  }
  
  try {
    const tokens = JSON.parse(tokensJson);
    run(projectId, tokens).catch(console.error);
  } catch (error) {
    console.error('Error parsing tokens:', error);
    process.exit(1);
  }
}
