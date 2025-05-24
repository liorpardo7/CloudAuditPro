const { writeAuditResults } = require('./writeAuditResults');
const { google } = require('googleapis');
const { BaseValidator } = require('./base-validator');
const fs = require('fs');
const path = require('path');

class StorageLifecycleAudit extends BaseValidator {
  async auditAll(projectId, tokens) {
    await this.initialize();
    console.log('Starting storage lifecycle policies audit...\n');
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    const storage = google.storage({ version: 'v1', auth: authClient });
    const monitoring = google.monitoring({ version: 'v3', auth: authClient });
    const results = {
      timestamp: new Date().toISOString(),
      projectId,
      storageLifecycle: {
        buckets: [],
        standardTierUsage: [],
        unusedBuckets: [],
        oldSnapshots: [],
        coldData: [],
        lifecyclePolicies: [],
        recommendations: []
      }
    };
    const summary = { totalChecks: 0, passed: 0, failed: 0 };
    const errors = [];
    // Audit the provided project only
    await this.auditProject({ projectId }, results, summary, errors, authClient);
    // Generate recommendations
    this.generateRecommendations(results);
    await writeAuditResults('storage-lifecycle-audit', results.storageLifecycle.buckets, summary, errors, projectId);
    return results;
  }

  async auditProject(project, results, summary, errors, authClient) {
    try {
      // Get all storage buckets
      const storage = google.storage('v1');
      const bucketsResponse = await storage.buckets.list({ project: project.projectId, auth: authClient });
      if (bucketsResponse.data.items) {
        for (const bucket of bucketsResponse.data.items) {
          const bucketInfo = {
            project: project.projectId,
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            lifecycleRules: bucket.lifecycle?.rule || [],
            creationTime: bucket.timeCreated,
            lastModified: bucket.updated,
            size: 0,
            objectCount: 0,
            cost: 0
          };
          // Get bucket metadata and usage
          const [metadata, usage] = await Promise.all([
            this.getBucketMetadata(bucket.name),
            this.getBucketUsage(bucket.name)
          ]);
          if (metadata) {
            bucketInfo.lifecycleRules = metadata.lifecycle?.rule || [];
            bucketInfo.storageClass = metadata.storageClass;
          }
          if (usage) {
            bucketInfo.size = usage.size;
            bucketInfo.objectCount = usage.objectCount;
            bucketInfo.cost = usage.cost;
          }
          // Check for standard tier usage
          if (bucketInfo.storageClass === 'STANDARD') {
            const lastAccess = await this.getLastAccessTime(bucket.name);
            if (lastAccess) {
              const daysSinceAccess = this.getDaysSinceAccess(lastAccess);
              if (daysSinceAccess > 90) {
                results.storageLifecycle.standardTierUsage.push({
                  ...bucketInfo,
                  daysSinceAccess
                });
              }
            }
          }
          // Check for unused buckets
          if (bucketInfo.objectCount === 0 || 
              (bucketInfo.lastModified && this.getDaysSinceAccess(bucketInfo.lastModified) > 90)) {
            results.storageLifecycle.unusedBuckets.push(bucketInfo);
          }
          results.storageLifecycle.buckets.push(bucketInfo);
          summary.totalChecks++;
          if (bucketInfo.objectCount > 0) summary.passed++;
          else summary.failed++;
        }
      }
    } catch (error) {
      errors.push({ error: error.message, project: project.projectId });
      results.storageLifecycle.recommendations.push({
        category: 'Storage Lifecycle',
        issue: 'Failed to audit project',
        recommendation: 'Check API permissions and try again',
        project: project.projectId,
        error: error.message
      });
    }
  }

  async getBucketMetadata(bucketName) {
    try {
      const storage = google.storage('v1');
      const response = await storage.buckets.get({
        bucket: bucketName
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting metadata for bucket ${bucketName}:`, error);
      return null;
    }
  }

  async getBucketUsage(bucketName) {
    try {
      const storage = google.storage('v1');
      const response = await storage.objects.list({
        bucket: bucketName,
        fields: 'items(size,timeCreated,updated)'
      });

      if (response.data.items) {
        const totalSize = response.data.items.reduce((sum, item) => sum + (parseInt(item.size) || 0), 0);
        const cost = this.calculateStorageCost(totalSize);

        return {
          size: totalSize,
          objectCount: response.data.items.length,
          cost
        };
      }

      return {
        size: 0,
        objectCount: 0,
        cost: 0
      };
    } catch (error) {
      console.error(`Error getting usage for bucket ${bucketName}:`, error);
      return null;
    }
  }

  async getLastAccessTime(bucketName) {
    try {
      const storage = google.storage('v1');
      const response = await storage.objects.list({
        bucket: bucketName,
        fields: 'items(updated)',
        orderBy: 'updated desc',
        maxResults: 1
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].updated;
      }

      return null;
    } catch (error) {
      console.error(`Error getting last access time for bucket ${bucketName}:`, error);
      return null;
    }
  }

  getDaysSinceAccess(timestamp) {
    const lastAccess = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - lastAccess);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateStorageCost(sizeInBytes) {
    // This is a simplified cost calculation
    // In production, you'd want to use actual pricing data from the Cloud Billing API
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    const standardTierCostPerGB = 0.02; // Example rate
    return sizeInGB * standardTierCostPerGB;
  }

  generateRecommendations(results) {
    // Add recommendations based on missing lifecycle rules
    const bucketsWithoutRules = results.storageLifecycle.buckets.filter(
      bucket => !bucket.lifecycleRules || bucket.lifecycleRules.length === 0
    );

    if (bucketsWithoutRules.length > 0) {
      results.storageLifecycle.recommendations.push({
        category: 'Storage Lifecycle',
        issue: 'Buckets without lifecycle rules',
        recommendation: 'Configure lifecycle rules for better cost management',
        affectedBuckets: bucketsWithoutRules.map(bucket => ({
          project: bucket.project,
          name: bucket.name
        }))
      });
    }

    // Add recommendations based on standard tier usage
    if (results.storageLifecycle.standardTierUsage.length > 0) {
      results.storageLifecycle.recommendations.push({
        category: 'Storage Lifecycle',
        issue: 'High usage of standard storage class',
        recommendation: 'Consider using more cost-effective storage classes for infrequently accessed data',
        affectedBuckets: results.storageLifecycle.standardTierUsage.map(bucket => ({
          project: bucket.project,
          name: bucket.name,
          daysSinceAccess: bucket.daysSinceAccess
        }))
      });
    }

    // Add recommendations based on unused buckets
    if (results.storageLifecycle.unusedBuckets.length > 0) {
      results.storageLifecycle.recommendations.push({
        category: 'Storage Lifecycle',
        issue: 'Unused buckets detected',
        recommendation: 'Review and delete unused buckets to reduce costs',
        affectedBuckets: results.storageLifecycle.unusedBuckets.map(bucket => ({
          project: bucket.project,
          name: bucket.name,
          lastModified: bucket.lastModified
        }))
      });
    }
  }
}

async function run(projectId, tokens) {
  const audit = new StorageLifecycleAudit();
  return await audit.auditAll(projectId, tokens);
}

module.exports = { run };
