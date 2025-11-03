import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Fernando API is healthy',
    timestamp: new Date().toISOString()
  })
}
