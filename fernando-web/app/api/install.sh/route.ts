import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Try to read from public directory first (web version)
    const publicScriptPath = join(process.cwd(), 'public', 'install.sh')
    let content: string

    try {
      content = await readFile(publicScriptPath, 'utf-8')
    } catch {
      // Fallback to fernando directory
      const installScriptPath = join(process.env.HOME || '', 'fernando', 'install.sh')
      content = await readFile(installScriptPath, 'utf-8')
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="install.sh"',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error reading install.sh:', error)
    return NextResponse.json(
      { error: 'Installation script not found' },
      { status: 404 }
    )
  }
}
