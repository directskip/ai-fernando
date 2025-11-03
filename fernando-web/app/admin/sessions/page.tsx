'use client'

import { useEffect, useState } from 'react'
import { getSessions } from '@/lib/api'
import { Session } from '@/lib/types'
import SessionList from '@/components/SessionList'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getSessions()
        setSessions(data.sessions || [])
        setFilteredSessions(data.sessions || [])
      } catch (err) {
        console.error('Error fetching sessions:', err)
        setError('Failed to load sessions. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = [...sessions]

    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    if (projectFilter) {
      filtered = filtered.filter((s) => s.project === projectFilter)
    }

    setFilteredSessions(filtered)
  }, [sessions, statusFilter, projectFilter])

  const getUniqueProjects = () => {
    const projects = new Set(sessions.map((s) => s.project))
    return Array.from(projects).sort()
  }

  const uniqueProjects = getUniqueProjects()

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <p className="text-4xl">⏳</p>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sessions...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-200">
          <h2 className="font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Sessions
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
              View and manage your work sessions
            </p>
          </div>
          <a
            href="/admin/sessions/runner"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm min-h-[44px] flex items-center justify-center w-full sm:w-auto whitespace-nowrap"
          >
            Launch Session Runner
          </a>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl mb-1">📊</p>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sessions.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl mb-1">🟢</p>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Active</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sessions.filter((s) => s.status === 'active').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl mb-1">⏹️</p>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Ended</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sessions.filter((s) => s.status === 'ended').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Filters:
        </p>
        <div className="space-y-3">
          {/* Status Filter */}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-3 py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center ${
                  statusFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('ended')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center ${
                  statusFilter === 'ended'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Ended
              </button>
            </div>
          </div>

          {/* Project Filter */}
          {uniqueProjects.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Project</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setProjectFilter(null)}
                  className={`px-3 py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center ${
                    projectFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  All
                </button>
                {uniqueProjects.map((project) => (
                  <button
                    key={project}
                    onClick={() => setProjectFilter(project)}
                    className={`px-3 py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center truncate ${
                      projectFilter === project
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {project}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <SessionList sessions={filteredSessions} />
    </main>
  )
}
