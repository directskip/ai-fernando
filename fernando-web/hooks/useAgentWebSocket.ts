'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { AgentNode } from '@/types/agent'

interface UseAgentWebSocketOptions {
  url?: string
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

interface UseAgentWebSocketReturn {
  agents: AgentNode[]
  connected: boolean
  error: string | null
  sendMessage: (message: any) => void
}

export function useAgentWebSocket({
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
}: UseAgentWebSocketOptions = {}): UseAgentWebSocketReturn {
  const [agents, setAgents] = useState<AgentNode[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    try {
      console.log(`[WebSocket] Connecting to: ${url}`)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully')
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WebSocket] Received message:', data.type)

          switch (data.type) {
            case 'initial':
              // Initial agent tree data
              console.log('[WebSocket] Received initial agent data:', data.agents?.length || 0, 'agents')
              setAgents(data.agents.map((a: any) => ({
                ...a,
                startTime: new Date(a.startTime),
                endTime: a.endTime ? new Date(a.endTime) : undefined,
              })))
              break

            case 'update':
              // Update existing agent
              console.log('[WebSocket] Updating agent:', data.agent?.id)
              setAgents((prev) =>
                prev.map((agent) =>
                  agent.id === data.agent.id
                    ? {
                        ...data.agent,
                        startTime: new Date(data.agent.startTime),
                        endTime: data.agent.endTime ? new Date(data.agent.endTime) : undefined,
                      }
                    : agent
                )
              )
              break

            case 'spawn':
              // New agent spawned
              console.log('[WebSocket] New agent spawned:', data.agent?.id)
              setAgents((prev) => [
                ...prev,
                {
                  ...data.agent,
                  startTime: new Date(data.agent.startTime),
                  endTime: data.agent.endTime ? new Date(data.agent.endTime) : undefined,
                },
              ])
              break

            case 'remove':
              // Agent removed
              console.log('[WebSocket] Agent removed:', data.agentId)
              setAgents((prev) => prev.filter((agent) => agent.id !== data.agentId))
              break

            default:
              console.warn('[WebSocket] Unknown message type:', data.type)
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('[WebSocket] Connection error:', event)
        setError('WebSocket connection error')
      }

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        setConnected(false)
        wsRef.current = null

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(
            `[WebSocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${reconnectDelay}ms`
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        } else {
          const errorMsg = 'Max reconnection attempts reached'
          console.error('[WebSocket]', errorMsg)
          setError(errorMsg)
        }
      }
    } catch (err) {
      console.error('[WebSocket] Error creating connection:', err)
      setError('Failed to create WebSocket connection')
    }
  }, [url, reconnectDelay, maxReconnectAttempts])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    agents,
    connected,
    error,
    sendMessage,
  }
}
