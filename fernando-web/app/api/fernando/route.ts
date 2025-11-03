import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Read the fernando CLI script
    const fernandoScriptPath = join(process.env.HOME || '', 'fernando', 'fernando')
    const content = await readFile(fernandoScriptPath, 'utf-8')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="fernando"',
      },
    })
  } catch (error) {
    console.error('Error reading fernando script:', error)
    return NextResponse.json(
      { error: 'Fernando CLI script not found' },
      { status: 404 }
    )
  }
}
