import { NextResponse } from 'next/server'
import { useProjectStore } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const { projectId, projectName } = await request.json()
    
    if (!projectId || !projectName) {
      return NextResponse.json({ error: 'Missing projectId or projectName' }, { status: 400 })
    }

    // Update the store
    useProjectStore.getState().setOAuthProject(projectId, projectName)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting project:', error)
    return NextResponse.json({ error: 'Failed to set project' }, { status: 500 })
  }
} 