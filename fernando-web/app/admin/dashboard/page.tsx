'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getKnowledge, getSessions, getInboxItems } from '@/lib/api'
import { KnowledgeResponse, SessionsResponse, InboxResponse } from '@/lib/types'

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin inline-block">⚡</div>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="glass p-6 rounded-2xl border border-red-500/20 bg-red-500/10">
          <h2 className="font-bold mb-2 text-lg" style={{ color: 'var(--color-error)' }}>Error Loading Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Your AI assistant command center
        </p>
      </div>

      {/* Alert Cards */}
      {(stats.inboxCount > 0 || stats.unclassifiedCount > 0) && (
        <div className="grid gap-4 mb-8 md:grid-cols-2">
          {stats.inboxCount > 0 && (
            <div className="glass p-6 rounded-2xl border card-hover"
                 style={{
                   borderLeftWidth: '4px',
                   borderLeftColor: 'var(--color-accent)',
                   background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
                 }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">📬</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.inboxCount} Brain Dump{stats.inboxCount !== 1 ? 's' : ''} Pending
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Review AI extractions and provide feedback
                  </p>
                </div>
              </div>
              <Link href="/admin/inbox" className="btn-primary text-sm w-full block text-center">
                Review Inbox
              </Link>
            </div>
          )}

          {stats.unclassifiedCount > 0 && (
            <div className="glass p-6 rounded-2xl border card-hover"
                 style={{
                   borderLeftWidth: '4px',
                   borderLeftColor: 'var(--color-warning)',
                   background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)'
                 }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.unclassifiedCount} Item{stats.unclassifiedCount !== 1 ? 's' : ''} Unclassified
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Classify knowledge to improve organization
                  </p>
                </div>
              </div>
              <Link href="/admin/classify"
                    className="px-6 py-3 rounded-xl font-semibold text-sm w-full block text-center transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-warning), var(--color-error))',
                      color: 'white',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                Classify Now
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
        <div className="glass p-8 rounded-2xl border card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl">📚</div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{
              background: 'rgba(14, 165, 233, 0.1)',
              color: 'var(--color-primary)'
            }}>
              TOTAL
            </div>
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Knowledge Items
          </p>
          <p className="text-5xl font-black gradient-text">
            {stats.totalKnowledge}
          </p>
        </div>

        <div className="glass p-8 rounded-2xl border card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl">📋</div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{
              background: 'rgba(6, 182, 212, 0.1)',
              color: 'var(--color-secondary)'
            }}>
              TOTAL
            </div>
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Sessions
          </p>
          <p className="text-5xl font-black gradient-text">
            {stats.totalSessions}
          </p>
        </div>

        <div className="glass p-8 rounded-2xl border card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl">⚡</div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)'
            }}>
              ACTIVE
            </div>
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Sessions
          </p>
          <p className="text-5xl font-black" style={{ color: 'var(--color-success)' }}>
            {stats.activeSessions}
          </p>
        </div>
      </div>

      {/* Knowledge Categories */}
      <div className="mb-12">
        <h2 className="text-3xl font-black mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Knowledge Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: '📖', label: 'Public', color: '#10b981', data: knowledge?.public },
            { icon: '🔐', label: 'Conditional', color: '#f59e0b', data: knowledge?.conditional },
            { icon: '🛡️', label: 'Private', color: '#ef4444', data: knowledge?.private },
            { icon: '⚙️', label: 'Preferences', color: '#3b82f6', data: knowledge?.preferences },
            { icon: '❓', label: 'Unclassified', color: '#f97316', count: stats.unclassifiedCount },
            { icon: '🔄', label: 'Synced', color: '#8b5cf6', data: knowledge?.synced },
          ].map(({ icon, label, color, data, count }) => {
            const itemCount = count !== undefined ? count : (() => {
              if (Array.isArray(data)) return data.length
              if (typeof data === 'object' && data !== null) return Object.keys(data).length
              return 0
            })()

            return (
              <div key={label} className="glass p-6 rounded-2xl border card-hover text-center">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="text-3xl font-black mb-2" style={{ color }}>{itemCount}</div>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>
            Recent Sessions
          </h2>
          <Link
            href="/admin/sessions"
            className="font-semibold text-sm transition-colors hover:scale-105 transform duration-200"
            style={{ color: 'var(--color-primary)' }}
          >
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <div className="glass p-12 rounded-2xl border text-center">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                No sessions yet
              </p>
            </div>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="glass p-5 rounded-2xl border card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {session.project}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap ${
                    session.status === 'active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}
                >
                  {session.status === 'active' && <span className="status-indicator status-active mr-2" />}
                  {session.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-3xl font-black mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/search" className="btn-primary py-4 text-center inline-flex items-center justify-center gap-3">
            <span className="text-2xl">🔍</span>
            <span>Search</span>
          </Link>
          <Link href="/admin/capture"
                className="py-4 rounded-xl font-semibold text-center inline-flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--color-success), #059669)',
                  color: 'white',
                  boxShadow: 'var(--shadow-md)'
                }}>
            <span className="text-2xl">✏️</span>
            <span>Capture</span>
          </Link>
          <Link href="/admin/chat"
                className="py-4 rounded-xl font-semibold text-center inline-flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  color: 'white',
                  boxShadow: 'var(--shadow-md)'
                }}>
            <span className="text-2xl">💬</span>
            <span>Chat</span>
          </Link>
          <Link href="/admin/agents"
                className="py-4 rounded-xl font-semibold text-center inline-flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                  color: 'white',
                  boxShadow: 'var(--shadow-md)'
                }}>
            <span className="text-2xl">🤖</span>
            <span>Agents</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
