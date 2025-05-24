import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 })
    }

    // Find the most recent BigQuery audit for this project
    const recentAudit = await prisma.adminAuditCategory.findFirst({
      where: {
        categoryId: 'bigquery',
        status: 'completed',
        NOT: {
          results: null
        }
      },
      orderBy: {
        lastRun: 'desc'
      }
    })

    if (!recentAudit || !recentAudit.results) {
      return NextResponse.json({ 
        message: 'No completed BigQuery audit found',
        hasData: false,
        suggestions: [
          'Run a BigQuery audit from the admin dashboard',
          'Ensure your project has BigQuery datasets to analyze',
          'Check that the audit completed successfully'
        ]
      })
    }

    // Transform the audit results into the format expected by the BigQuery page
    const auditData = recentAudit.results as any
    const rawData = recentAudit.rawData as any

    // Process the audit findings to extract BigQuery-specific data
    const processedData = {
      hasData: true,
      lastUpdated: recentAudit.lastRun,
      auditSummary: auditData.summary || {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        costSavingsPotential: 0
      },
      
      // Extract datasets information
      datasets: extractDatasets(auditData, rawData),
      
      // Extract tables information
      tables: extractTables(auditData, rawData),
      
      // Extract recent queries
      recentQueries: extractRecentQueries(auditData, rawData),
      
      // Extract recommendations
      recommendations: extractRecommendations(auditData, rawData),
      
      // Add stale partitioning info
      stalePartitioning: extractStalePartitioning(auditData),
      
      // Add job monitoring
      runningJobs: extractRunningJobs(auditData),
      
      // Raw audit findings for debugging
      auditFindings: auditData.findings || []
    }

    return NextResponse.json(processedData)

  } catch (error) {
    console.error('BigQuery audit results API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch BigQuery audit results',
      hasData: false 
    }, { status: 500 })
  }
}

function extractDatasets(auditData: any, rawData: any) {
  // Try to extract datasets from raw GCP data
  if (rawData?.datasets) {
    return rawData.datasets.map((dataset: any) => ({
      id: dataset.datasetReference?.datasetId || dataset.id,
      name: dataset.friendlyName || dataset.datasetReference?.datasetId || dataset.id,
      location: dataset.location || 'unknown',
      tables: dataset.tables?.length || 0,
      size: formatBytes(dataset.storageBytes || 0),
      lastModified: dataset.lastModifiedTime ? new Date(parseInt(dataset.lastModifiedTime)).toISOString() : 'unknown',
      defaultExpiration: dataset.defaultTableExpirationMs ? `${Math.floor(parseInt(dataset.defaultTableExpirationMs) / (1000 * 60 * 60 * 24))} days` : 'Never',
      labels: dataset.labels ? Object.keys(dataset.labels) : [],
      access: dataset.access?.map((a: any) => a.userByEmail || a.groupByEmail || a.domain || 'Unknown') || []
    }))
  }

  // Fallback: Look for dataset info in audit findings
  const datasetFindings = auditData.findings?.find((f: any) => f.check === 'Dataset Access Controls')
  if (datasetFindings?.details) {
    return datasetFindings.details.map((dataset: any, index: number) => ({
      id: dataset.id || `dataset-${index}`,
      name: dataset.name || dataset.id || `Dataset ${index + 1}`,
      location: dataset.location || 'us-central1',
      tables: dataset.tableCount || 0,
      size: dataset.size || '0 GB',
      lastModified: dataset.lastModified || 'unknown',
      defaultExpiration: dataset.expiration || 'Never',
      labels: dataset.labels || [],
      access: dataset.access || []
    }))
  }

  return []
}

function extractTables(auditData: any, rawData: any) {
  // Try to extract tables from raw GCP data
  if (rawData?.tables) {
    return rawData.tables.map((table: any) => ({
      id: table.tableReference?.tableId || table.id,
      name: table.friendlyName || table.tableReference?.tableId || table.id,
      dataset: table.tableReference?.datasetId || 'unknown',
      type: table.type || 'TABLE',
      rows: formatNumber(table.numRows || 0),
      size: formatBytes(table.numBytes || 0),
      lastModified: table.lastModifiedTime ? new Date(parseInt(table.lastModifiedTime)).toISOString() : 'unknown',
      schema: `${table.schema?.fields?.length || 0} fields`,
      expiration: table.expirationTime ? new Date(parseInt(table.expirationTime)).toISOString() : 'Never',
      partitioned: !!table.timePartitioning,
      clustered: !!table.clustering
    }))
  }

  // Fallback: Look for table info in audit findings
  const findings = auditData.findings || []
  const tables: any[] = []
  
  findings.forEach((finding: any) => {
    if (finding.details && Array.isArray(finding.details)) {
      finding.details.forEach((detail: any) => {
        if (detail.tableId || detail.tableName) {
          tables.push({
            id: detail.tableId || detail.tableName,
            name: detail.tableName || detail.tableId,
            dataset: detail.datasetId || 'unknown',
            type: detail.tableType || 'TABLE',
            rows: formatNumber(detail.numRows || 0),
            size: formatBytes(detail.numBytes || 0),
            lastModified: detail.lastModified || 'unknown',
            schema: `${detail.schemaFields || 0} fields`,
            expiration: detail.expiration || 'Never',
            partitioned: detail.partitioned || false,
            clustered: detail.clustered || false
          })
        }
      })
    }
  })

  return tables
}

function extractRecentQueries(auditData: any, rawData: any) {
  // Try to extract queries from raw GCP data
  if (rawData?.jobs || rawData?.queries) {
    const jobs = rawData.jobs || rawData.queries || []
    return jobs.slice(0, 10).map((job: any, index: number) => ({
      id: job.id || `query-${index}`,
      query: job.configuration?.query?.query || job.query || 'Query text not available',
      user: job.user_email || job.userEmail || 'unknown@domain.com',
      processed: formatBytes(job.statistics?.totalBytesProcessed || 0),
      duration: formatDuration(job.statistics?.totalSlotMs || 0),
      timestamp: job.statistics?.startTime ? new Date(parseInt(job.statistics.startTime)).toISOString() : new Date().toISOString(),
      status: job.status?.state || 'completed',
      location: job.jobReference?.location || 'us-central1'
    }))
  }

  // Look for job monitoring data in audit findings
  const jobFindings = auditData.findings?.find((f: any) => f.check === 'Job Monitoring')
  if (jobFindings?.details) {
    return jobFindings.details.map((job: any, index: number) => ({
      id: job.jobId || `query-${index}`,
      query: job.query || 'Query text not available',
      user: job.user || 'unknown@domain.com',
      processed: formatBytes(job.totalBytesProcessed || 0),
      duration: formatDuration(job.totalSlotMs || 0),
      timestamp: job.startTime || new Date().toISOString(),
      status: job.state || 'completed',
      location: job.location || 'us-central1'
    }))
  }

  return []
}

function extractRecommendations(auditData: any, rawData: any) {
  const recommendations: any[] = []
  
  // Generate recommendations based on audit findings
  const findings = auditData.findings || []
  
  findings.forEach((finding: any) => {
    if (!finding.passed) {
      let recommendation = {
        id: `rec-${findings.indexOf(finding)}`,
        title: `${finding.check} needs attention`,
        description: finding.result,
        impact: 'medium',
        estimatedSavings: '$0/month',
        type: 'optimization'
      }

      // Customize recommendations based on check type
      switch (finding.check) {
        case 'Stale Partitioning':
          recommendation.title = 'Optimize table partitioning'
          recommendation.description = 'Some tables have stale partitioning that could benefit from optimization'
          recommendation.impact = 'high'
          recommendation.estimatedSavings = '$50-200/month'
          recommendation.type = 'table-configuration'
          break
        
        case 'Query Optimization':
          recommendation.title = 'Optimize expensive queries'
          recommendation.description = 'Recent queries could be optimized to reduce data scanning'
          recommendation.impact = 'high'
          recommendation.estimatedSavings = '$30-150/month'
          recommendation.type = 'query-optimization'
          break
        
        case 'Cost Optimization':
          recommendation.title = 'Reduce storage costs'
          recommendation.description = 'Large tables could benefit from lifecycle management'
          recommendation.impact = 'medium'
          recommendation.estimatedSavings = '$25-100/month'
          recommendation.type = 'lifecycle-management'
          break
        
        case 'Dataset Access Controls':
          recommendation.title = 'Review dataset permissions'
          recommendation.description = 'Some datasets may have overly broad access permissions'
          recommendation.impact = 'medium'
          recommendation.estimatedSavings = 'Security improvement'
          recommendation.type = 'security'
          break
      }

      recommendations.push(recommendation)
    }
  })

  return recommendations
}

function extractStalePartitioning(auditData: any) {
  const stalePartitioningFinding = auditData.findings?.find((f: any) => f.check === 'Stale Partitioning')
  return stalePartitioningFinding?.details || []
}

function extractRunningJobs(auditData: any) {
  const jobMonitoringFinding = auditData.findings?.find((f: any) => f.check === 'Job Monitoring')
  return jobMonitoringFinding?.details || []
}

// Utility functions
function formatBytes(bytes: number | string): string {
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (numBytes === 0) return '0 GB'
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(numBytes) / Math.log(1024))
  
  return `${(numBytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatNumber(num: number | string): string {
  const numValue = typeof num === 'string' ? parseInt(num) : num
  if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(1)}M`
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`
  }
  return numValue.toString()
}

function formatDuration(slotMs: number | string): string {
  const ms = typeof slotMs === 'string' ? parseInt(slotMs) : slotMs
  const seconds = Math.floor(ms / 1000)
  
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  return `${seconds} second${seconds !== 1 ? 's' : ''}`
} 