'use client'

import { Session } from '@/lib/types'
import { useState } from 'react'

interface SessionListProps {
  sessions: Session[]
}

export default function SessionList({ sessions }: SessionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateDuration = (session: Session) => {
    const start = new Date(session.startedAt).getTime()
    const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()
    const minutes = Math.floor((end - start) / 60000)

    if (minutes < 60) {
      return session.endedAt ? `${minutes}m` : `${minutes}m (ongoing)`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return session.endedAt ? `${hours}h ${mins}m` : `${hours}h ${mins}m (ongoing)`
  }

  const getElapsedTime = (session: Session) => {
    if (session.endedAt) return null
    const start = new Date(session.startedAt).getTime()
    const now = Date.now()
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    const hours = Math.floor((now - start) / (1000 * 60 * 60))
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just started'
  }

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">📭</p>
          <p>No sessions found</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div key={session.id}>
            <button
              onClick={() =>
                setExpandedId(expandedId === session.id ? null : session.id)
              }
              className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {session.project}
                </h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    session.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {session.directory}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(session.startedAt)}
              </p>
            </button>

            {expandedId === session.id && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700 p-4 mt-1">
                <div className="space-y-2 text-sm">
                  {!session.endedAt && (
                    <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-yellow-800 dark:text-yellow-200 text-xs font-medium mb-1">
                        ⚠️ Session Never Closed
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                        Started {getElapsedTime(session)}. This session was not properly ended by the Fernando CLI.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Started:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(session.startedAt)}
                    </span>
                  </div>
                  {session.endedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ended:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(session.endedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {calculateDuration(session)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                      {session.id}
                    </span>
                  </div>
                  {session.metadata?.itemsCreated && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Items Created:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {session.metadata.itemsCreated}
                      </span>
                    </div>
                  )}
                  {session.metadata?.tags && session.metadata.tags.length > 0 && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {session.metadata.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
