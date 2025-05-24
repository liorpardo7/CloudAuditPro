import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Initial audit categories data
const INITIAL_CATEGORIES = [
  {
    categoryId: "compute",
    name: "Compute Engine",
    path: "/compute",
    description: "VM instances, machine types, and compute optimization",
    subcategories: [
      "VM Instance Inventory",
      "Machine Type Analysis", 
      "Instance Utilization",
      "Compute Recommendations",
      "Preemptible Instance Usage"
    ]
  },
  {
    categoryId: "storage",
    name: "Cloud Storage",
    path: "/storage",
    description: "Storage buckets, lifecycle, and cost optimization",
    subcategories: [
      "Storage Bucket Inventory",
      "Lifecycle Policies",
      "Storage Classes",
      "Access Patterns",
      "Cost Analysis"
    ]
  },
  {
    categoryId: "bigquery",
    name: "BigQuery",
    path: "/bigquery",
    description: "Data warehouse optimization and query analysis",
    subcategories: [
      "Dataset Inventory",
      "Query Performance",
      "Slot Utilization", 
      "Table Partitioning",
      "Cost Optimization"
    ]
  },
  {
    categoryId: "network",
    name: "Networking",
    path: "/network",
    description: "VPC, firewall rules, and network optimization",
    subcategories: [
      "VPC Configuration",
      "Firewall Rules",
      "Load Balancers",
      "Network Security",
      "Traffic Analysis"
    ]
  },
  {
    categoryId: "security",
    name: "Security & IAM",
    path: "/security",
    description: "IAM policies, security findings, and compliance",
    subcategories: [
      "IAM Analysis",
      "Service Accounts",
      "Security Findings",
      "Policy Violations",
      "Compliance Status"
    ]
  },
  {
    categoryId: "cost",
    name: "Cost Management",
    path: "/cost",
    description: "Cost analysis, budgets, and optimization",
    subcategories: [
      "Cost Breakdown",
      "Budget Analysis", 
      "Cost Trends",
      "Recommendations",
      "Billing Alerts"
    ]
  },
  {
    categoryId: "gke",
    name: "Kubernetes Engine",
    path: "/gke",
    description: "GKE clusters, nodes, and workload optimization",
    subcategories: [
      "Cluster Health",
      "Node Utilization",
      "Workload Analysis",
      "Security Policies",
      "Cost Optimization"
    ]
  },
  {
    categoryId: "serverless",
    name: "Serverless",
    path: "/serverless",
    description: "Cloud Functions, App Engine, and serverless optimization",
    subcategories: [
      "Cloud Functions",
      "App Engine Apps",
      "Performance Metrics",
      "Cost Analysis",
      "Security Review"
    ]
  },
  {
    categoryId: "devops",
    name: "DevOps & CI/CD",
    path: "/devops",
    description: "Build pipelines, deployments, and automation",
    subcategories: [
      "Cloud Build",
      "Deployment Pipelines",
      "Container Registry",
      "Source Repositories",
      "Automation Status"
    ]
  },
  {
    categoryId: "monitoring",
    name: "Monitoring & Ops",
    path: "/monitoring",
    description: "Monitoring, logging, and operations",
    subcategories: [
      "Monitoring Metrics",
      "Log Analysis",
      "Alerting Policies",
      "SLO/SLI Tracking",
      "Incident Response"
    ]
  },
  {
    categoryId: "compliance",
    name: "Compliance",
    path: "/compliance",
    description: "Compliance frameworks and policy adherence",
    subcategories: [
      "Policy Compliance",
      "Regulatory Requirements",
      "Audit Trails",
      "Risk Assessment",
      "Remediation Actions"
    ]
  },
  {
    categoryId: "data-protection",
    name: "Data Protection",
    path: "/data-protection",
    description: "Data governance, backup, and disaster recovery",
    subcategories: [
      "Backup Policies",
      "Data Classification",
      "Encryption Status",
      "Recovery Planning",
      "Data Governance"
    ]
  }
];

// Create backup of audit data
async function createBackup(categoryId: string, data: any, type: 'auto' | 'manual' = 'auto', description?: string) {
  try {
    await prisma.adminAuditBackup.create({
      data: {
        categoryId,
        backupData: data,
        backupType: type,
        description: description || `${type} backup - ${new Date().toISOString()}`
      }
    });

    // Also create local file backup
    const backupDir = path.join(process.cwd(), 'backups', 'admin-audit');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `${categoryId}-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

    console.log(`Backup created for ${categoryId}: ${backupFile}`);
  } catch (error) {
    console.error(`Failed to create backup for ${categoryId}:`, error);
  }
}

// Initialize database with default categories if empty
async function initializeCategories() {
  const count = await prisma.adminAuditCategory.count();
  
  if (count === 0) {
    console.log('Initializing admin audit categories...');
    
    for (const category of INITIAL_CATEGORIES) {
      await prisma.adminAuditCategory.create({
        data: category
      });
    }
    
    console.log(`Initialized ${INITIAL_CATEGORIES.length} audit categories`);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize categories if needed
    await initializeCategories();

    // Fetch all categories with comments
    const categories = await prisma.adminAuditCategory.findMany({
      include: {
        adminComments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat.categoryId,
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
        comments: cat.adminComments,
        updatedAt: cat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Admin audit inventory API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch audit inventory' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, categoryId, ...data } = body;

    switch (action) {
      case 'updateStatus':
        {
          // Create backup before updating
          const existing = await prisma.adminAuditCategory.findUnique({
            where: { categoryId }
          });
          
          if (existing) {
            await createBackup(existing.id, existing);
          }

          const updated = await prisma.adminAuditCategory.upsert({
            where: { categoryId },
            update: {
              status: data.status,
              lastRun: data.lastRun ? new Date(data.lastRun) : undefined,
              duration: data.duration,
              progress: data.progress,
              results: data.results,
              rawData: data.rawData,
              error: data.error,
              updatedAt: new Date()
            },
            create: {
              categoryId,
              name: data.name || categoryId,
              path: data.path || `/${categoryId}`,
              description: data.description || '',
              subcategories: data.subcategories || [],
              status: data.status,
              lastRun: data.lastRun ? new Date(data.lastRun) : undefined,
              duration: data.duration,
              progress: data.progress,
              results: data.results,
              rawData: data.rawData,
              error: data.error
            }
          });

          return NextResponse.json({ success: true, category: updated });
        }

      case 'addComment':
        {
          // Find or create category
          const category = await prisma.adminAuditCategory.upsert({
            where: { categoryId },
            update: {},
            create: {
              categoryId,
              name: data.name || categoryId,
              path: data.path || `/${categoryId}`,
              description: data.description || '',
              subcategories: data.subcategories || []
            }
          });

          const comment = await prisma.adminComment.create({
            data: {
              categoryId: category.id,
              comment: data.comment,
              priority: data.priority || 'medium',
              status: data.status || 'open',
              tags: data.tags || [],
              adminEmail: data.adminEmail
            }
          });

          return NextResponse.json({ success: true, comment });
        }

      case 'updateComment':
        {
          const comment = await prisma.adminComment.update({
            where: { id: data.commentId },
            data: {
              comment: data.comment,
              priority: data.priority,
              status: data.status,
              tags: data.tags,
              updatedAt: new Date()
            }
          });

          return NextResponse.json({ success: true, comment });
        }

      case 'deleteComment':
        {
          await prisma.adminComment.delete({
            where: { id: data.commentId }
          });

          return NextResponse.json({ success: true });
        }

      case 'createBackup':
        {
          const category = await prisma.adminAuditCategory.findUnique({
            where: { categoryId },
            include: { adminComments: true }
          });

          if (category) {
            await createBackup(category.id, category, 'manual', data.description);
          }

          return NextResponse.json({ success: true });
        }

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin audit inventory POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const categoryId = searchParams.get('categoryId');

    if (action === 'reset' && categoryId) {
      // Create backup before reset
      const existing = await prisma.adminAuditCategory.findUnique({
        where: { categoryId },
        include: { adminComments: true }
      });
      
      if (existing) {
        await createBackup(existing.id, existing, 'manual', 'Before reset');
      }

      // Reset category to idle state
      await prisma.adminAuditCategory.update({
        where: { categoryId },
        data: {
          status: 'idle',
          progress: undefined,
          results: undefined,
          rawData: undefined,
          error: undefined,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Admin audit inventory DELETE error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
} 