const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

const compute = google.compute('v1');

async function runPersistentDiskAudit() {
  try {
    const authClient = auth.getAuthClient();
    const projectId = auth.getProjectId();
    const findings = [];
    const errors = [];

    // List all disks
    const disks = await listAllDisks(authClient, projectId);
    // List all snapshots
    const snapshots = await listAllSnapshots(authClient, projectId);
    // List all instances to check for unattached disks
    const instances = await listAllInstances(authClient, projectId);
    const attachedDiskIds = new Set();
    for (const instance of instances) {
      for (const disk of instance.disks) {
        attachedDiskIds.add(disk.source.split('/').pop());
      }
    }

    for (const disk of disks) {
      // Check encryption
      if (!disk.diskEncryptionKey || !disk.diskEncryptionKey.kmsKeyName) {
        findings.push({
          type: 'unencrypted_disk',
          disk: disk.name,
          status: 'warning',
          message: 'Disk is not encrypted with CMEK (using Google-managed keys)'
        });
      }
      // Check unattached/unused disks
      if (!attachedDiskIds.has(disk.name)) {
        findings.push({
          type: 'unattached_disk',
          disk: disk.name,
          status: 'warning',
          message: 'Disk is unattached and may be incurring unnecessary cost'
        });
      }
      // Check for recent snapshots
      const diskSnapshots = snapshots.filter(s => s.sourceDiskId === disk.id);
      if (diskSnapshots.length === 0) {
        findings.push({
          type: 'no_snapshot',
          disk: disk.name,
          status: 'warning',
          message: 'Disk has no snapshots. Consider setting up regular snapshots.'
        });
      } else {
        const recentSnapshot = diskSnapshots.some(s => {
          const snapDate = new Date(s.creationTimestamp);
          return (Date.now() - snapDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
        });
        if (!recentSnapshot) {
          findings.push({
            type: 'no_recent_snapshot',
            disk: disk.name,
            status: 'warning',
            message: 'Disk has no recent snapshot in the last 7 days.'
          });
        }
      }
      // Check disk type optimization
      if (disk.type && disk.type.includes('pd-ssd') && disk.sizeGb < 100) {
        findings.push({
          type: 'small_ssd_disk',
          disk: disk.name,
          status: 'info',
          message: 'SSD disk is less than 100GB. Consider resizing for cost efficiency.'
        });
      }
    }

    // Generate summary
    const summary = {
      totalDisks: disks.length,
      findings: findings.length,
      errors: errors.length
    };

    return { findings, summary, errors };
  } catch (error) {
    console.error('Error in persistent disk audit:', error);
    return { findings: [], summary: {}, errors: [error.message] };
  }
}

async function listAllDisks(authClient, projectId) {
  const disks = [];
  let pageToken;
  do {
    const response = await compute.disks.aggregatedList({
      auth: authClient,
      project: projectId,
      pageToken
    });
    for (const [zone, zoneData] of Object.entries(response.data.items)) {
      if (zoneData.disks) {
        disks.push(...zoneData.disks);
      }
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return disks;
}

async function listAllSnapshots(authClient, projectId) {
  const snapshots = [];
  let pageToken;
  do {
    const response = await compute.snapshots.list({
      auth: authClient,
      project: projectId,
      pageToken
    });
    if (response.data.items) {
      snapshots.push(...response.data.items);
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return snapshots;
}

async function listAllInstances(authClient, projectId) {
  const instances = [];
  let pageToken;
  do {
    const response = await compute.instances.aggregatedList({
      auth: authClient,
      project: projectId,
      pageToken
    });
    for (const [zone, zoneData] of Object.entries(response.data.items)) {
      if (zoneData.instances) {
        instances.push(...zoneData.instances);
      }
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return instances;
}

// Run the audit if this file is executed directly
if (require.main === module) {
  runPersistentDiskAudit()
    .then(results => {
      console.log('Persistent Disk audit completed. Results:', JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('Error running persistent disk audit:', error);
      process.exit(1);
    });
}

module.exports = {
  runPersistentDiskAudit
}; 