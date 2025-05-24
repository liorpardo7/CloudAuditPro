#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createAdminAuditBackup() {
  console.log('Starting admin audit backup...');
  
  try {
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'backups', 'admin-audit');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get all audit categories with comments and existing backups
    const categories = await prisma.adminAuditCategory.findMany({
      include: {
        adminComments: true,
        backups: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Keep last 5 backups per category
        }
      }
    });

    console.log(`Found ${categories.length} audit categories to backup`);

    // Create timestamped backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp: new Date().toISOString(),
      categories: categories.map(cat => ({
        id: cat.id,
        categoryId: cat.categoryId,
        name: cat.name,
        path: cat.path,
        description: cat.description,
        subcategories: cat.subcategories,
        status: cat.status,
        lastRun: cat.lastRun,
        duration: cat.duration,
        progress: cat.progress,
        results: cat.results,
        rawData: cat.rawData,
        error: cat.error,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        comments: cat.adminComments.map(comment => ({
          id: comment.id,
          comment: comment.comment,
          priority: comment.priority,
          status: comment.status,
          tags: comment.tags,
          adminEmail: comment.adminEmail,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        })),
        recentBackups: cat.backups.map(backup => ({
          id: backup.id,
          backupType: backup.backupType,
          description: backup.description,
          createdAt: backup.createdAt
        }))
      })),
      stats: {
        totalCategories: categories.length,
        totalComments: categories.reduce((sum, cat) => sum + cat.adminComments.length, 0),
        categoriesWithComments: categories.filter(cat => cat.adminComments.length > 0).length,
        categoriesWithResults: categories.filter(cat => cat.results).length
      }
    };

    // Write full backup to file
    const backupFile = path.join(backupDir, `admin-audit-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    // Create compressed backup for storage efficiency
    const compressedData = JSON.stringify(backupData);
    const compressedFile = path.join(backupDir, `admin-audit-backup-${timestamp}.min.json`);
    fs.writeFileSync(compressedFile, compressedData);

    // Store backup metadata in database
    for (const category of categories) {
      await prisma.adminAuditBackup.create({
        data: {
          categoryId: category.id,
          backupData: {
            category: backupData.categories.find(c => c.id === category.id),
            metadata: {
              backupFile: backupFile,
              compressedFile: compressedFile,
              timestamp: backupData.timestamp
            }
          },
          backupType: 'auto',
          description: `Automated backup - ${timestamp}`
        }
      });
    }

    // Clean up old backup files (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo && file.includes('admin-audit-backup-')) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old backup: ${file}`);
      }
    });

    // Clean up old database backup records (keep last 100 per category)
    for (const category of categories) {
      const oldBackups = await prisma.adminAuditBackup.findMany({
        where: { categoryId: category.id },
        orderBy: { createdAt: 'desc' },
        skip: 100
      });

      if (oldBackups.length > 0) {
        await prisma.adminAuditBackup.deleteMany({
          where: {
            id: { in: oldBackups.map(b => b.id) }
          }
        });
        console.log(`Cleaned up ${oldBackups.length} old backup records for ${category.name}`);
      }
    }

    console.log(`✅ Backup completed successfully!`);
    console.log(`📄 Full backup: ${backupFile}`);
    console.log(`🗜️ Compressed: ${compressedFile}`);
    console.log(`📊 Stats: ${backupData.stats.totalCategories} categories, ${backupData.stats.totalComments} comments`);

    return {
      success: true,
      backupFile,
      compressedFile,
      stats: backupData.stats
    };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  createAdminAuditBackup()
    .then(result => {
      if (result.success) {
        console.log('Backup process completed successfully');
        process.exit(0);
      } else {
        console.error('Backup process failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Backup process error:', error);
      process.exit(1);
    });
}

module.exports = { createAdminAuditBackup }; 