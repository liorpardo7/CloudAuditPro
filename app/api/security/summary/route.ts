import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 })
    }

    // Find the most recent security audit for this project
    const recentAudit = await prisma.auditJob.findFirst({
      where: {
        projectId: projectId,
        category: 'security',
        status: 'completed'
      },
      orderBy: {
        started: 'desc'
      }
    })

    if (!recentAudit) {
      return NextResponse.json({ 
        message: 'No completed security audit found for this project',
        data: null 
      }, { status: 200 })
    }

    // Parse the result JSON if it exists
    let parsedResult = null
    if (recentAudit.result) {
      try {
        parsedResult = JSON.parse(recentAudit.result)
      } catch (error) {
        console.error('Failed to parse audit result JSON:', error)
      }
    }

    // Return the audit results
    return NextResponse.json({
      success: true,
      data: parsedResult,
      timestamp: recentAudit.started,
      jobId: recentAudit.id
    })

  } catch (error) {
    console.error('Security summary API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch security summary' 
    }, { status: 500 })
  }
} 