'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getKnowledge, getSessions, getInboxItems } from '@/lib/api'
import { KnowledgeResponse, SessionsResponse, InboxResponse } from '@/lib/types'

export default function DashboardPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null)
  const [sessions, setSessions] = useState<SessionsResponse | null>(null)
  const [inbox, setInbox] = useState<InboxResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching dashboard data...')

        // Fetch data individually to see which one fails
        let knowledgeData, sessionsData, inboxData

        try {
          console.log('Fetching knowledge...')
          knowledgeData = await getKnowledge()
          console.log('Knowledge fetched:', knowledgeData)
        } catch (err) {
          console.error('Knowledge fetch failed:', err)
          throw new Error(`Knowledge API failed: ${err}`)
        }

        try {
          console.log('Fetching sessions...')
          sessionsData = await getSessions()
          console.log('Sessions fetched:', sessionsData)
        } catch (err) {
          console.error('Sessions fetch failed:', err)
          throw new Error(`Sessions API failed: ${err}`)
        }

        try {
          console.log('Fetching inbox...')
          inboxData = await getInboxItems()
          console.log('Inbox fetched:', inboxData)
        } catch (err) {
          console.error('Inbox fetch failed:', err)
          throw new Error(`Inbox API failed: ${err}`)
        }

        setKnowledge(knowledgeData)
        setSessions(sessionsData)
        setInbox(inboxData)
        console.log('All data loaded successfully')
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(`Failed to load dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculateStats = () => {
    let totalKnowledge = 0
    let unclassifiedCount = 0
    if (knowledge) {
      const countItems = (data: unknown) => {
        if (Array.isArray(data)) return data.length
        if (typeof data === 'object' && data !== null) return Object.keys(data).length
        return 0
      }

      totalKnowledge =
        countItems(knowledge.public) +
        countItems(knowledge.conditional) +
        countItems(knowledge.private)

      unclassifiedCount = countItems(knowledge.unclassified)
    }
    return {
      totalKnowledge,
      unclassifiedCount,
      inboxCount: inbox?.total || 0,
      totalSessions: sessions?.total || 0,
      activeSessions: sessions?.sessions?.filter((s) => s.status === 'active').length || 0,
    }
  }

  const stats = calculateStats()
  const recentSessions = sessions?.sessions?.slice(0, 5) || []

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <p className="text-4xl">⏳</p>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
    <main className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
          Dashboard
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400">Welcome back! Here is your overview.</p>
      </div>

      {/* Inbox Alert */}
      {stats.inboxCount > 0 && (
        <div className="mb-4 md:mb-6 bg-purple-50 dark:bg-purple-900 border-l-4 border-purple-500 p-3 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-2 md:gap-3 w-full">
              <span className="text-2xl md:text-3xl flex-shrink-0">📬</span>
              <div className="flex-1 min-w-0">
                <p className="text-purple-800 dark:text-purple-200 font-semibold text-sm md:text-base mb-0.5">
                  {stats.inboxCount} brain dump{stats.inboxCount !== 1 ? 's' : ''} waiting for review
                </p>
                <p className="text-purple-700 dark:text-purple-300 text-xs md:text-sm">
                  Review AI extractions and provide feedback to help Fernando learn
                </p>
              </div>
            </div>
            <Link
              href="/admin/inbox"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto text-center sm:text-left min-h-[44px] flex items-center justify-center"
            >
              Review Inbox
            </Link>
          </div>
        </div>
      )}

      {/* Unclassified Alert */}
      {stats.unclassifiedCount > 0 && (
        <div className="mb-4 md:mb-6 bg-orange-50 dark:bg-orange-900 border-l-4 border-orange-500 p-3 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-2 md:gap-3 w-full">
              <span className="text-2xl md:text-3xl flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-orange-800 dark:text-orange-200 font-semibold text-sm md:text-base mb-0.5">
                  {stats.unclassifiedCount} item{stats.unclassifiedCount !== 1 ? 's' : ''} need{stats.unclassifiedCount === 1 ? 's' : ''} classification
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-xs md:text-sm">
                  Review and classify knowledge items to improve organization
                </p>
              </div>
            </div>
            <Link
              href="/admin/classify"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto text-center sm:text-left min-h-[44px] flex items-center justify-center"
            >
              Classify Now
            </Link>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl md:text-4xl mb-2">📚</div>
          <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-1.5">Knowledge Items</p>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            {stats.totalKnowledge}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl md:text-4xl mb-2">📋</div>
          <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-1.5">Total Sessions</p>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            {stats.totalSessions}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl md:text-4xl mb-2">🟢</div>
          <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-1.5">Active Sessions</p>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            {stats.activeSessions}
          </p>
        </div>
      </div>

      {/* Knowledge Categories */}
      <div className="mb-6 md:mb-10">
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-5">
          Knowledge Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 md:gap-3 lg:gap-4">
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3 md:p-4 lg:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl mb-1.5">📖</p>
            <p className="text-green-800 dark:text-green-200 font-bold text-xl md:text-2xl mb-0.5">
              {(() => {
                const data = knowledge?.public
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-green-700 dark:text-green-300 font-medium">Public</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 md:p-4 lg:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl mb-1.5">🔐</p>
            <p className="text-yellow-800 dark:text-yellow-200 font-bold text-xl md:text-2xl mb-0.5">
              {(() => {
                const data = knowledge?.conditional
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300 font-medium">Conditional</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 md:p-4 lg:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl mb-1.5">🛡️</p>
            <p className="text-red-800 dark:text-red-200 font-bold text-xl md:text-2xl mb-0.5">
              {(() => {
                const data = knowledge?.private
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-red-700 dark:text-red-300 font-medium">Private</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 md:p-4 lg:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl mb-1.5">⚙️</p>
            <p className="text-blue-800 dark:text-blue-200 font-bold text-xl md:text-2xl mb-0.5">
              {Object.keys(knowledge?.preferences || {}).length}
            </p>
            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 font-medium">Preferences</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-3 md:p-4 lg:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl mb-1.5">❓</p>
            <p className="text-orange-800 dark:text-orange-200 font-bold text-xl md:text-2xl mb-0.5">
              {stats.unclassifiedCount}
            </p>
            <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300 font-medium">Unclassified</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-3 md:p-4 lg:p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl mb-1.5">🔄</p>
            <p className="text-purple-800 dark:text-purple-200 font-bold text-xl md:text-2xl mb-0.5">
              {(() => {
                const data = knowledge?.synced
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-purple-700 dark:text-purple-300 font-medium">Synced</p>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mb-6 md:mb-10">
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            Recent Sessions
          </h2>
          <Link
            href="/sessions"
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs md:text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="space-y-2.5 md:space-y-3">
          {recentSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-10 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                No sessions yet
              </p>
            </div>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-0.5">
                    {session.project}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full self-start sm:self-auto ${
                    session.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {session.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 md:mb-10">
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4 max-w-4xl">
          <Link
            href="/search"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 md:py-5 px-5 md:px-6 rounded-lg text-center transition-colors shadow-sm hover:shadow-md text-sm md:text-base"
          >
            🔍 Search Knowledge
          </Link>
          <Link
            href="/capture"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 md:py-5 px-5 md:px-6 rounded-lg text-center transition-colors shadow-sm hover:shadow-md text-sm md:text-base"
          >
            ✏️ Capture Note
          </Link>
        </div>
      </div>
    </main>
  )
}
