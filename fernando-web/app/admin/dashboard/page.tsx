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
    <main className="">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">Welcome back! Here is your overview.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📚</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
              Total
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 font-medium">Knowledge Items</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {stats.totalKnowledge}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📋</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
              Total
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 font-medium">Sessions</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {stats.totalSessions}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">🟢</div>
            <div className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              Active
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 font-medium">Sessions</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {stats.activeSessions}
          </p>
        </div>
      </div>

      {/* Knowledge Categories */}
      <div className="mb-8 md:mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
          Knowledge Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-3">📖</p>
            <p className="text-green-700 dark:text-green-300 font-bold text-2xl md:text-3xl mb-1">
              {(() => {
                const data = knowledge?.public
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-green-700 dark:text-green-400 font-semibold">Public</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-3">🔐</p>
            <p className="text-yellow-700 dark:text-yellow-300 font-bold text-2xl md:text-3xl mb-1">
              {(() => {
                const data = knowledge?.conditional
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-400 font-semibold">Conditional</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-3">🛡️</p>
            <p className="text-red-700 dark:text-red-300 font-bold text-2xl md:text-3xl mb-1">
              {(() => {
                const data = knowledge?.private
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-red-700 dark:text-red-400 font-semibold">Private</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-3">⚙️</p>
            <p className="text-blue-700 dark:text-blue-300 font-bold text-2xl md:text-3xl mb-1">
              {Object.keys(knowledge?.preferences || {}).length}
            </p>
            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400 font-semibold">Preferences</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-3">❓</p>
            <p className="text-orange-700 dark:text-orange-300 font-bold text-2xl md:text-3xl mb-1">
              {stats.unclassifiedCount}
            </p>
            <p className="text-xs md:text-sm text-orange-700 dark:text-orange-400 font-semibold">Unclassified</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-3">🔄</p>
            <p className="text-purple-700 dark:text-purple-300 font-bold text-2xl md:text-3xl mb-1">
              {(() => {
                const data = knowledge?.synced
                if (Array.isArray(data)) return data.length
                if (typeof data === 'object' && data !== null) return Object.keys(data).length
                return 0
              })()}
            </p>
            <p className="text-xs md:text-sm text-purple-700 dark:text-purple-400 font-semibold">Synced</p>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Sessions
          </h2>
          <Link
            href="/admin/sessions"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center shadow-sm">
              <p className="text-gray-600 dark:text-gray-400 text-base">
                No sessions yet
              </p>
            </div>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                    {session.project}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                    session.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {session.status === 'active' && '● '}
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <Link
            href="/admin/search"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors shadow-sm hover:shadow-md text-base inline-flex items-center justify-center gap-2"
          >
            <span>🔍</span>
            <span>Search Knowledge</span>
          </Link>
          <Link
            href="/admin/capture"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors shadow-sm hover:shadow-md text-base inline-flex items-center justify-center gap-2"
          >
            <span>✏️</span>
            <span>Capture Note</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
