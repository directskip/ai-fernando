'use client'

import { ActiveSession } from '@/lib/types'
import { useState } from 'react'
import SpawnTree from './SpawnTree'

interface SessionWindowProps {
  session: ActiveSession
  isExpanded: boolean
  onToggle: () => void
}

export default function SessionWindow({ session, isExpanded, onToggle }: SessionWindowProps) {
  const [view, setView] = useState<'output' | 'spawns' | 'details'>('output')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '🟢'
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      case 'paused':
        return '⏸️'
      default:
        return '⚪'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'main' ? '🖥️' : '🔀'
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
    const start = new Date(session.startedAt).getTime()
    const now = Date.now()
    const seconds = Math.floor((now - start) / 1000)

    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{getTypeIcon(session.type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {session.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.workingDirectory}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
              {getStatusIcon(session.status)} {session.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Started: {formatTime(session.startedAt)}</span>
          <span>{getDuration()}</span>
        </div>

        {session.spawns.length > 0 && (
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
            {session.spawns.length} spawned agent{session.spawns.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* View Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setView('output')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              view === 'output'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Output
          </button>
          {session.spawns.length > 0 && (
            <button
              onClick={() => setView('spawns')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                view === 'spawns'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Spawns ({session.spawns.length})
            </button>
          )}
          <button
            onClick={() => setView('details')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              view === 'details'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Details
          </button>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-4">
          {view === 'output' && (
            <div className="space-y-1">
              {session.output.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No output yet...</p>
              ) : (
                session.output.slice(-50).map((line, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all"
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          )}

          {view === 'spawns' && (
            <SpawnTree spawns={session.spawns} sessionId={session.id} />
          )}

          {view === 'details' && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
                <p className="font-mono text-xs text-gray-900 dark:text-white break-all mt-1">
                  {session.id}
                </p>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400">Tenant ID:</span>
                <p className="font-mono text-xs text-gray-900 dark:text-white mt-1">
                  {session.tenantId}
                </p>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400">Working Directory:</span>
                <p className="font-mono text-xs text-gray-900 dark:text-white break-all mt-1">
                  {session.workingDirectory}
                </p>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400">Last Activity:</span>
                <p className="text-xs text-gray-900 dark:text-white mt-1">
                  {new Date(session.lastActivity).toLocaleString()}
                </p>
              </div>

              {session.metadata?.model && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Model:</span>
                  <p className="text-xs text-gray-900 dark:text-white mt-1">
                    {session.metadata.model}
                  </p>
                </div>
              )}

              {session.metadata?.totalPrompts !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Prompts:</span>
                  <p className="text-xs text-gray-900 dark:text-white mt-1">
                    {session.metadata.totalPrompts}
                  </p>
                </div>
              )}

              {session.metadata?.filesModified && session.metadata.filesModified.length > 0 && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Files Modified:</span>
                  <div className="mt-1 space-y-1">
                    {session.metadata.filesModified.map((file, index) => (
                      <p key={index} className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                        {file}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {session.metadata?.parentSessionId && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Parent Session:</span>
                  <p className="font-mono text-xs text-gray-900 dark:text-white break-all mt-1">
                    {session.metadata.parentSessionId}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={onToggle}
          className="w-full px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          {isExpanded ? 'Minimize' : 'Maximize'}
        </button>
      </div>
    </div>
  )
}
