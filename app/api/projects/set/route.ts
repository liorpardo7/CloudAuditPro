import { NextResponse } from 'next/server'
import { useProjectStore } from '@/lib/store'
import { verifyCsrf } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const rateLimitError = rateLimit(request, { limit: 10, windowMs: 60_000 })
  if (rateLimitError) return rateLimitError

  const csrfError = verifyCsrf(request)
  if (csrfError) return csrfError

  const prisma = new PrismaClient()
  const cookieStore = cookies()
  const sessionId = cookieStore.get('session_id')?.value
  let userId: string | undefined
  if (sessionId) {
    const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } })
    userId = session?.user?.id
  }

  try {
    const { projectId, projectName } = await request.json()
    
    if (!projectId || !projectName) {
      return NextResponse.json({ error: 'Missing projectId or projectName' }, { status: 400 })
    }

    // Update the store
    useProjectStore.getState().setOAuthProject(projectId, projectName)

    // Audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PROJECT_SET',
          metadata: {
            projectId,
            projectName,
            ip: request.headers.get('x-forwarded-for') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting project:', error)
    return NextResponse.json({ error: 'Failed to set project' }, { status: 500 })
  }
} 