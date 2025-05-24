import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Flexible vs Resource CUDs analysis endpoint' })
} 