import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const headersList = await headers()

    // Get the X-Forwarded-For header (set by ALB) or fallback to host
    const forwardedFor = headersList.get('x-forwarded-for')
    const host = headersList.get('host')

    // Try to get ECS task metadata if running on ECS
    let taskMetadata = null
    let containerIp = null

    try {
      // ECS Task Metadata Endpoint V4
      const metadataUri = process.env.ECS_CONTAINER_METADATA_URI_V4
      if (metadataUri) {
        const taskResponse = await fetch(`${metadataUri}/task`)
        taskMetadata = await taskResponse.json()

        // Get container IP from task metadata
        const containers = taskMetadata?.Containers || []
        const thisContainer = containers.find((c: any) =>
          c.Name === 'fernando-web' || c.Name === process.env.HOSTNAME
        )

        if (thisContainer?.Networks?.[0]?.IPv4Addresses?.[0]) {
          containerIp = thisContainer.Networks[0].IPv4Addresses[0]
        }
      }
    } catch (err) {
      // Not running on ECS or metadata not available
    }

    return NextResponse.json({
      containerIp: containerIp || 'Not available',
      forwardedFor: forwardedFor || 'Not available',
      host: host || 'Not available',
      taskArn: taskMetadata?.TaskARN || 'Not running on ECS',
      cluster: taskMetadata?.Cluster || 'Not running on ECS',
      availabilityZone: taskMetadata?.AvailabilityZone || 'Not available',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting server info:', error)
    return NextResponse.json(
      { error: 'Failed to get server info' },
      { status: 500 }
    )
  }
}
