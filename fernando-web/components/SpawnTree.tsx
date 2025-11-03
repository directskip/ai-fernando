'use client'

import { SpawnedAgent } from '@/lib/types'
import { useState } from 'react'

interface SpawnTreeProps {
  spawns: SpawnedAgent[]
  sessionId: string
}

interface SpawnNodeProps {
  spawn: SpawnedAgent
  level: number
}

function SpawnNode({ spawn, level }: SpawnNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '🔄'
      case 'completed':
        return '✓'
      case 'failed':
        return '✗'
      default:
        return '○'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return '🤖'
      case 'tool':
        return '🔧'
      case 'task':
        return '📋'
      default:
        return '◆'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getDuration = () => {
    const start = new Date(spawn.startedAt).getTime()
    const end = spawn.completedAt ? new Date(spawn.completedAt).getTime() : Date.now()
    const seconds = Math.floor((end - start) / 1000)

    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  return (
    <div className="mb-2" style={{ marginLeft: `${level * 16}px` }}>
      <div
        className={`border rounded-lg p-3 ${getStatusColor(spawn.status)}`}
      >
        {/* Spawn Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{getTypeIcon(spawn.type)}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{spawn.name}</h4>
              <p className="text-xs opacity-75">
                {formatTime(spawn.startedAt)} • {getDuration()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {getStatusIcon(spawn.status)}
            </span>
            {spawn.output.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {spawn.progress !== undefined && spawn.status === 'running' && (
          <div className="mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-300"
                style={{ width: `${spawn.progress}%` }}
              />
            </div>
            <p className="text-xs mt-1 opacity-75">{spawn.progress}% complete</p>
          </div>
        )}

        {/* Metadata */}
        {spawn.metadata && (
          <div className="text-xs space-y-1 mb-2 opacity-75">
            {spawn.metadata.tool && (
              <div>
                <span className="font-medium">Tool:</span> {spawn.metadata.tool}
              </div>
            )}
            {spawn.metadata.error && (
              <div className="text-red-600 dark:text-red-400 font-medium">
                Error: {spawn.metadata.error}
              </div>
            )}
          </div>
        )}

        {/* Output */}
        {isExpanded && spawn.output.length > 0 && (
          <div className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded max-h-40 overflow-auto">
            <div className="space-y-1">
              {spawn.output.slice(-20).map((line, index) => (
                <div
                  key={index}
                  className="text-xs font-mono break-all"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SpawnTree({ spawns, sessionId: _sessionId }: SpawnTreeProps) {
  if (spawns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-2xl mb-2">🔀</p>
        <p className="text-sm">No spawned agents</p>
      </div>
    )
  }

  // Group spawns by their parent relationship (if we had that data)
  // For now, just display them in a flat structure
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {spawns.length} spawned agent{spawns.length > 1 ? 's' : ''}
      </div>
      {spawns.map((spawn) => (
        <SpawnNode key={spawn.id} spawn={spawn} level={0} />
      ))}
    </div>
  )
}
