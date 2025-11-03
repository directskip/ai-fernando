import { useState, useEffect, useRef, useCallback } from 'react'
import { ActiveSession } from '@/lib/types'

interface ActivityStreamState {
  sessions: ActiveSession[]
  isConnected: boolean
  lastUpdate: string
  error: string | null
}

const MOCK_MODE = false // Use real WebSocket - mock mode disabled
const UPDATE_INTERVAL = 1000 // Update every second

export function useActivityStream() {
  const [state, setState] = useState<ActivityStreamState>({
    sessions: [],
    isConnected: false,
    lastUpdate: '',
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate mock data for testing
  const generateMockSessions = useCallback((): ActiveSession[] => {
    const now = Date.now()
    const sessions: ActiveSession[] = []

    // Main session 1 - Running with spawns
    sessions.push({
      id: 'session-001',
      tenantId: 'peter',
      name: 'Build comprehensive session viewer',
      type: 'main',
      workingDirectory: '/Users/pfaquart/fernando-web',
      status: 'running',
      startedAt: new Date(now - 3600000).toISOString(), // 1 hour ago
      lastActivity: new Date(now - 5000).toISOString(),
      output: [
        'Starting session...',
        'Creating activity viewer page at /admin/activity',
        'Building SessionWindow component',
        'Creating SpawnTree component',
        'Implementing real-time updates...',
        `[${new Date().toLocaleTimeString()}] Processing updates...`,
      ],
      spawns: [
        {
          id: 'spawn-001-1',
          parentSessionId: 'session-001',
          type: 'task',
          name: 'Build React components',
          status: 'completed',
          startedAt: new Date(now - 1800000).toISOString(),
          completedAt: new Date(now - 900000).toISOString(),
          output: [
            'Creating SessionWindow.tsx',
            'Creating SpawnTree.tsx',
            'Adding TypeScript types',
            'Components created successfully',
          ],
          progress: 100,
        },
        {
          id: 'spawn-001-2',
          parentSessionId: 'session-001',
          type: 'agent',
          name: 'Implement WebSocket service',
          status: 'running',
          startedAt: new Date(now - 600000).toISOString(),
          output: [
            'Setting up WebSocket connection',
            'Configuring real-time updates',
            `[${new Date().toLocaleTimeString()}] Streaming data...`,
          ],
          progress: 65,
        },
      ],
      metadata: {
        model: 'claude-sonnet-4-5',
        totalPrompts: 12,
        filesModified: [
          '/app/admin/activity/page.tsx',
          '/components/SessionWindow.tsx',
          '/components/SpawnTree.tsx',
          '/hooks/useActivityStream.ts',
        ],
      },
    })

    // Main session 2 - Completed
    sessions.push({
      id: 'session-002',
      tenantId: 'peter',
      name: 'Fix authentication bug',
      type: 'main',
      workingDirectory: '/Users/pfaquart/fernando-web',
      status: 'completed',
      startedAt: new Date(now - 7200000).toISOString(), // 2 hours ago
      lastActivity: new Date(now - 3600000).toISOString(),
      output: [
        'Identified issue in auth middleware',
        'Updated session validation logic',
        'Added error handling',
        'Tests passing',
        'Session completed successfully',
      ],
      spawns: [],
      metadata: {
        model: 'claude-sonnet-4-5',
        totalPrompts: 5,
        filesModified: [
          '/middleware.ts',
          '/lib/auth.ts',
        ],
      },
    })

    // Main session 3 - Running with multiple spawns
    sessions.push({
      id: 'session-003',
      tenantId: 'peter',
      name: 'Database optimization',
      type: 'main',
      workingDirectory: '/Users/pfaquart/api-server',
      status: 'running',
      startedAt: new Date(now - 5400000).toISOString(), // 1.5 hours ago
      lastActivity: new Date(now - 2000).toISOString(),
      output: [
        'Analyzing query performance',
        'Identifying slow queries',
        'Adding database indexes',
        `[${new Date().toLocaleTimeString()}] Optimizing...`,
      ],
      spawns: [
        {
          id: 'spawn-003-1',
          parentSessionId: 'session-003',
          type: 'tool',
          name: 'Query analyzer',
          status: 'completed',
          startedAt: new Date(now - 4800000).toISOString(),
          completedAt: new Date(now - 3600000).toISOString(),
          output: [
            'Scanning database tables',
            'Found 15 slow queries',
            'Analysis complete',
          ],
          progress: 100,
          metadata: {
            tool: 'pg-analyze',
          },
        },
        {
          id: 'spawn-003-2',
          parentSessionId: 'session-003',
          type: 'task',
          name: 'Create indexes',
          status: 'running',
          startedAt: new Date(now - 3600000).toISOString(),
          output: [
            'Creating index on users.email',
            'Creating index on sessions.created_at',
            `[${new Date().toLocaleTimeString()}] Processing...`,
          ],
          progress: 45,
        },
        {
          id: 'spawn-003-3',
          parentSessionId: 'session-003',
          type: 'agent',
          name: 'Test performance improvements',
          status: 'running',
          startedAt: new Date(now - 1200000).toISOString(),
          output: [
            'Running benchmark suite',
            'Measuring query times',
            `[${new Date().toLocaleTimeString()}] Testing...`,
          ],
          progress: 30,
        },
      ],
      metadata: {
        model: 'claude-sonnet-4-5',
        totalPrompts: 8,
        filesModified: [
          '/db/migrations/add-indexes.sql',
          '/db/queries.ts',
        ],
      },
    })

    // Failed session
    sessions.push({
      id: 'session-004',
      tenantId: 'peter',
      name: 'Deploy to production',
      type: 'main',
      workingDirectory: '/Users/pfaquart/fernando-web',
      status: 'failed',
      startedAt: new Date(now - 9000000).toISOString(), // 2.5 hours ago
      lastActivity: new Date(now - 7200000).toISOString(),
      output: [
        'Building application...',
        'Running tests...',
        'Tests failed',
        'Error: Database connection timeout',
      ],
      spawns: [
        {
          id: 'spawn-004-1',
          parentSessionId: 'session-004',
          type: 'task',
          name: 'Run test suite',
          status: 'failed',
          startedAt: new Date(now - 8400000).toISOString(),
          completedAt: new Date(now - 7200000).toISOString(),
          output: [
            'Running unit tests...',
            'Error: Connection refused',
            'Test suite failed',
          ],
          metadata: {
            error: 'Database connection timeout',
          },
        },
      ],
      metadata: {
        model: 'claude-sonnet-4-5',
        totalPrompts: 3,
        filesModified: [],
      },
    })

    // Spawn session (child of session-001)
    sessions.push({
      id: 'spawn-session-001',
      tenantId: 'peter',
      name: 'Search codebase for patterns',
      type: 'spawn',
      workingDirectory: '/Users/pfaquart/fernando-web',
      status: 'running',
      startedAt: new Date(now - 300000).toISOString(), // 5 minutes ago
      lastActivity: new Date(now - 1000).toISOString(),
      output: [
        'Searching for React component patterns...',
        'Found 45 components',
        'Analyzing component structure...',
        `[${new Date().toLocaleTimeString()}] Processing results...`,
      ],
      spawns: [],
      metadata: {
        model: 'claude-sonnet-4-5',
        totalPrompts: 2,
        parentSessionId: 'session-001',
      },
    })

    return sessions
  }, [])

  // Mock WebSocket updates
  useEffect(() => {
    if (MOCK_MODE) {
      // Initialize with mock data
      setState((prev) => ({
        ...prev,
        sessions: generateMockSessions(),
        isConnected: true,
        lastUpdate: new Date().toISOString(),
      }))

      // Update mock data periodically
      mockIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          sessions: generateMockSessions(),
          lastUpdate: new Date().toISOString(),
        }))
      }, UPDATE_INTERVAL)

      return () => {
        if (mockIntervalRef.current) {
          clearInterval(mockIntervalRef.current)
        }
      }
    }

    // Real WebSocket implementation (when available)
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setState((prev) => ({ ...prev, isConnected: true, error: null }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'sessions_update') {
            setState((prev) => ({
              ...prev,
              sessions: data.sessions,
              lastUpdate: new Date().toISOString(),
            }))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Connection error',
        }))
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setState((prev) => ({ ...prev, isConnected: false }))
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000)
      }

      wsRef.current = ws
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [generateMockSessions])

  return state
}
