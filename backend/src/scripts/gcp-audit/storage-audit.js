const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const credentials = require('./dba-inventory-services-prod-8a97ca8265b5.json');

// Initialize authentication
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Initialize the Storage API client with auth
let storage;

async function initializeStorage() {
  const authClient = await auth.getClient();
  storage = google.storage({
    version: 'v1',
    auth: authClient
  });
}

async function auditStorageResources() {
  try {
    console.log('Starting storage audit...');
    await initializeStorage();
    
    const results = {
      timestamp: new Date().toISOString(),
      projectId: 'dba-inventory-services-prod',
      storageResources: {
        buckets: [],
        bucketIamPolicies: [],
        lifecycleRules: [],
        retentionPolicies: [],
        objectCounts: [],
        storageClasses: []
      },
      recommendations: []
    };

    // List all buckets
    try {
      console.log('Listing buckets...');
      const bucketsResponse = await storage.buckets.list({
        project: 'dba-inventory-services-prod'
      });
      results.storageResources.buckets = bucketsResponse.data.items || [];
      console.log(`Found ${results.storageResources.buckets.length} buckets`);
    } catch (error) {
      console.error('Error listing buckets:', error.message);
      results.recommendations.push({
        category: 'Storage',
        issue: 'Failed to list buckets',
        recommendation: 'Check storage.buckets.list permission'
      });
    }

    // Audit each bucket
    for (const bucket of results.storageResources.buckets) {
      console.log(`\nAuditing bucket: ${bucket.name}`);
      try {
        // Get bucket IAM policy
        console.log('Getting IAM policy...');
        const iamPolicyResponse = await storage.buckets.getIamPolicy({
          bucket: bucket.name
        });
        results.storageResources.bucketIamPolicies.push({
          bucketName: bucket.name,
          policy: iamPolicyResponse.data
        });
        console.log('IAM policy retrieved successfully');
      } catch (error) {
        console.error(`Error getting IAM policy for bucket ${bucket.name}:`, error.message);
        results.recommendations.push({
          category: 'Storage',
          issue: `Failed to get IAM policy for bucket ${bucket.name}`,
          recommendation: 'Check storage.buckets.getIamPolicy permission'
        });
      }

      try {
        // Get bucket metadata for additional checks
        const metadataResponse = await storage.buckets.get({
          bucket: bucket.name
        });
        const meta = metadataResponse.data;
        // Public Access Prevention
        bucket.publicAccessPrevention = meta.iamConfiguration?.publicAccessPrevention || 'unspecified';
        // Bucket Policy Only
        bucket.bucketPolicyOnly = meta.iamConfiguration?.bucketPolicyOnly?.enabled || false;
        // Object-level logging (logging.logBucket)
        bucket.objectLevelLogging = !!meta.logging?.logBucket;
        // Bucket Lock (retentionPolicy.isLocked)
        bucket.retentionPolicyLocked = !!meta.retentionPolicy?.isLocked;
      } catch (error) {
        console.error(`Error getting metadata for bucket ${bucket.name}:`, error.message);
      }

      try {
        // Get bucket lifecycle rules
        console.log('Getting lifecycle rules...');
        const lifecycleResponse = await storage.buckets.get({
          bucket: bucket.name,
          fields: 'lifecycle'
        });
        if (lifecycleResponse.data.lifecycle) {
          results.storageResources.lifecycleRules.push({
            bucketName: bucket.name,
            rules: lifecycleResponse.data.lifecycle.rule
          });
        }
        console.log('Lifecycle rules retrieved successfully');
      } catch (error) {
        console.error(`Error getting lifecycle rules for bucket ${bucket.name}:`, error.message);
        results.recommendations.push({
          category: 'Storage',
          issue: `Failed to get lifecycle rules for bucket ${bucket.name}`,
          recommendation: 'Check storage.buckets.get permission'
        });
      }

      try {
        // Get bucket retention policy
        console.log('Getting retention policy...');
        const retentionResponse = await storage.buckets.get({
          bucket: bucket.name,
          fields: 'retentionPolicy'
        });
        if (retentionResponse.data.retentionPolicy) {
          results.storageResources.retentionPolicies.push({
            bucketName: bucket.name,
            policy: retentionResponse.data.retentionPolicy
          });
        }
        console.log('Retention policy retrieved successfully');
      } catch (error) {
        console.error(`Error getting retention policy for bucket ${bucket.name}:`, error.message);
        results.recommendations.push({
          category: 'Storage',
          issue: `Failed to get retention policy for bucket ${bucket.name}`,
          recommendation: 'Check storage.buckets.get permission'
        });
      }

      try {
        // Get bucket object count and storage class distribution
        console.log('Getting object information...');
        const objectsResponse = await storage.objects.list({
          bucket: bucket.name,
          fields: 'items(name,storageClass,size,timeCreated)'
        });
        if (objectsResponse.data.items) {
          const objectCount = objectsResponse.data.items.length;
          const storageClassDistribution = objectsResponse.data.items.reduce((acc, obj) => {
            acc[obj.storageClass] = (acc[obj.storageClass] || 0) + 1;
            return acc;
          }, {});
          
          results.storageResources.objectCounts.push({
            bucketName: bucket.name,
            count: objectCount
          });
          
          results.storageResources.storageClasses.push({
            bucketName: bucket.name,
            distribution: storageClassDistribution
          });
        }
        console.log('Object information retrieved successfully');
      } catch (error) {
        console.error(`Error getting object information for bucket ${bucket.name}:`, error.message);
        results.recommendations.push({
          category: 'Storage',
          issue: `Failed to get object information for bucket ${bucket.name}`,
          recommendation: 'Check storage.objects.list permission'
        });
      }
    }

    // Generate recommendations
    console.log('\nGenerating recommendations...');
    generateStorageRecommendations(results);

    // Save results
    console.log('\nSaving results...');
    const resultsPath = path.join(__dirname, 'storage-audit-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('Storage audit completed. Results saved to storage-audit-results.json');
    return results;
  } catch (error) {
    console.error('Error during storage audit:', error);
    throw error;
  }
}

function generateStorageRecommendations(results) {
  // Check bucket configurations
  results.storageResources.buckets.forEach(bucket => {
    // Check for uniform bucket-level access
    if (!bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Uniform bucket-level access not enabled',
        recommendation: 'Enable uniform bucket-level access for better security',
        resource: bucket.name
      });
    }

    // Check for versioning
    if (!bucket.versioning?.enabled) {
      results.recommendations.push({
        category: 'Data Protection',
        issue: 'Versioning not enabled',
        recommendation: 'Enable versioning for data protection',
        resource: bucket.name
      });
    }

    // Check for logging
    if (!bucket.logging) {
      results.recommendations.push({
        category: 'Monitoring',
        issue: 'Bucket logging not configured',
        recommendation: 'Enable bucket logging for better monitoring',
        resource: bucket.name
      });
    }

    // Check for default encryption
    if (!bucket.encryption?.defaultKmsKeyName) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Default encryption not configured',
        recommendation: 'Configure default encryption using Cloud KMS',
        resource: bucket.name
      });
    }

    // Check for public access prevention
    if (bucket.publicAccessPrevention !== 'enforced') {
      results.recommendations.push({
        category: 'Security',
        issue: 'Public access prevention not enforced',
        recommendation: 'Enforce public access prevention on the bucket',
        resource: bucket.name
      });
    }

    // Check for bucketPolicyOnly (legacy)
    if (!bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled && !bucket.bucketPolicyOnly) {
      results.recommendations.push({
        category: 'Security',
        issue: 'Legacy bucket policy only not enabled',
        recommendation: 'Enable uniform bucket-level access or bucketPolicyOnly for better security',
        resource: bucket.name
      });
    }

    // Check for object-level logging
    if (!bucket.objectLevelLogging) {
      results.recommendations.push({
        category: 'Monitoring',
        issue: 'Object-level logging not enabled',
        recommendation: 'Enable object-level logging for better auditability',
        resource: bucket.name
      });
    }

    // Check for bucket lock
    if (bucket.retentionPolicyLocked === false && bucket.retentionPolicy) {
      results.recommendations.push({
        category: 'Compliance',
        issue: 'Retention policy not locked',
        recommendation: 'Lock the retention policy to prevent changes',
        resource: bucket.name
      });
    }
  });

  // Check IAM policies
  results.storageResources.bucketIamPolicies.forEach(policy => {
    const bindings = policy.policy.bindings || [];
    bindings.forEach(binding => {
      // Check for public access
      if (binding.members.includes('allUsers') || binding.members.includes('allAuthenticatedUsers')) {
        results.recommendations.push({
          category: 'Security',
          issue: 'Public access to bucket',
          recommendation: 'Review and restrict public access to the bucket',
          resource: policy.bucketName,
          role: binding.role
        });
      }

      // Check for overly permissive roles
      if (binding.role === 'roles/storage.admin' || binding.role === 'roles/storage.objectViewer') {
        results.recommendations.push({
          category: 'Security',
          issue: 'Overly permissive role assignment',
          recommendation: 'Review and restrict role assignments to follow least privilege principle',
          resource: policy.bucketName,
          role: binding.role
        });
      }
    });
  });

  // Check lifecycle rules
  results.storageResources.lifecycleRules.forEach(rule => {
    if (!rule.rules || rule.rules.length === 0) {
      results.recommendations.push({
        category: 'Cost Optimization',
        issue: 'No lifecycle rules configured',
        recommendation: 'Configure lifecycle rules to manage object lifecycle and optimize costs',
        resource: rule.bucketName
      });
    } else {
      // Check for cold storage usage
      const hasColdStorageRule = rule.rules.some(r => 
        r.action?.type === 'SetStorageClass' && 
        (r.action?.storageClass === 'COLDLINE' || r.action?.storageClass === 'ARCHIVE')
      );
      
      if (!hasColdStorageRule) {
        results.recommendations.push({
          category: 'Cost Optimization',
          issue: 'No cold storage rules configured',
          recommendation: 'Consider adding rules to move infrequently accessed data to cold storage',
          resource: rule.bucketName
        });
      }
    }
  });

  // Check retention policies
  results.storageResources.retentionPolicies.forEach(policy => {
    if (!policy.policy) {
      results.recommendations.push({
        category: 'Compliance',
        issue: 'No retention policy configured',
        recommendation: 'Configure retention policy for compliance requirements',
        resource: policy.bucketName
      });
    }
  });

  // Check storage class distribution
  results.storageResources.storageClasses.forEach(dist => {
    const totalObjects = Object.values(dist.distribution).reduce((a, b) => a + b, 0);
    const standardClassCount = dist.distribution['STANDARD'] || 0;
    
    if (standardClassCount / totalObjects > 0.8) {
      results.recommendations.push({
        category: 'Cost Optimization',
        issue: 'High usage of standard storage class',
        recommendation: 'Consider using more cost-effective storage classes for infrequently accessed data',
        resource: dist.bucketName,
        standardClassPercentage: (standardClassCount / totalObjects * 100).toFixed(2) + '%'
      });
    }
  });
}

// Run the audit if this script is run directly
if (require.main === module) {
  auditStorageResources().catch(error => {
    console.error('Error running storage audit:', error);
    process.exit(1);
  });
}

module.exports = {
  auditStorageResources
}; 

const findings = [];
const summary = { totalChecks: 0, passed: 0, failed: 0, costSavingsPotential: 0 };
const errors = [];
writeAuditResults("storage-audit", findings, summary, errors);
