'use client'

import { useState, useEffect } from 'react'
import { ClaudeCodeSession } from '@/lib/types'
import SessionTab from '@/components/SessionTab'

export default function SessionRunnerPage() {
  const [sessions, setSessions] = useState<ClaudeCodeSession[]>([])
  const [activeSessions, setActiveSessions] = useState<ClaudeCodeSession[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newSessionForm, setNewSessionForm] = useState({
    name: '',
    workingDirectory: '/tmp',
    model: 'claude-sonnet-4',
  })

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'peter'

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `/api/claude-sessions?tenantId=${tenantId}`
      )
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/claude-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          ...newSessionForm,
        }),
      })

      const session = await response.json()

      // Add to active sessions and switch to it
      setActiveSessions((prev) => [...prev, session])
      setActiveTabId(session.id)
      setSessions((prev) => [session, ...prev])

      // Reset form
      setNewSessionForm({
        name: '',
        workingDirectory: '/tmp',
        model: 'claude-sonnet-4',
      })
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenSession = (session: ClaudeCodeSession) => {
    // Check if already open
    if (activeSessions.find((s) => s.id === session.id)) {
      setActiveTabId(session.id)
      return
    }

    // Add to active sessions
    setActiveSessions((prev) => [...prev, session])
    setActiveTabId(session.id)
  }

  const handleCloseTab = (sessionId: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (activeTabId === sessionId) {
      const remaining = activeSessions.filter((s) => s.id !== sessionId)
      setActiveTabId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleEndSession = (sessionId: string) => {
    fetchSessions()
    handleCloseTab(sessionId)
  }

  const activeSession = activeSessions.find((s) => s.id === activeTabId)

  return (
    <main className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Claude Code Session Runner
          </h1>
          <a
            href="/admin/sessions"
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Sessions
          </a>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-3 sm:px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => {
              const form = document.getElementById('new-session-form')
              form?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-3 sm:px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center justify-center"
          >
            + New Session
          </button>

          {activeSessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg cursor-pointer transition-colors min-h-[44px] justify-center ${
                activeTabId === session.id
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              <button
                onClick={() => setActiveTabId(session.id)}
                className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap max-w-[120px] sm:max-w-none overflow-hidden text-ellipsis"
              >
                {session.name}
              </button>
              <button
                onClick={() => handleCloseTab(session.id)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <SessionTab
            key={activeSession.id}
            session={activeSession}
            onClose={() => handleCloseTab(activeSession.id)}
            onEndSession={() => handleEndSession(activeSession.id)}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-4xl w-full">
              {/* New Session Form */}
              <div
                id="new-session-form"
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 sm:p-6 mb-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Create New Session
                </h2>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={newSessionForm.name}
                      onChange={(e) =>
                        setNewSessionForm({
                          ...newSessionForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="My Claude Code Session"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Working Directory
                    </label>
                    <input
                      type="text"
                      value={newSessionForm.workingDirectory}
                      onChange={(e) =>
                        setNewSessionForm({
                          ...newSessionForm,
                          workingDirectory: e.target.value,
                        })
                      }
                      placeholder="/path/to/project"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Model
                    </label>
                    <select
                      value={newSessionForm.model}
                      onChange={(e) =>
                        setNewSessionForm({
                          ...newSessionForm,
                          model: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                    >
                      <option value="claude-sonnet-4">Claude Sonnet 4</option>
                      <option value="claude-opus-4">Claude Opus 4</option>
                      <option value="claude-haiku-4">Claude Haiku 4</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm min-h-[44px]"
                  >
                    {isCreating ? 'Creating...' : 'Create Session'}
                  </button>
                </form>
              </div>

              {/* Existing Sessions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Existing Sessions
                </h2>
                {sessions.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p className="text-sm">No sessions yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-3 sm:gap-2"
                      >
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                              {session.name}
                            </h3>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                session.status === 'running'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : session.status === 'paused'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {session.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {session.workingDirectory}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenSession(session)}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
