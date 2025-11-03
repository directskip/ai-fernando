'use client'

import { useState, useMemo } from 'react'
import AgentTree from '@/components/AgentTree'
import AgentsList from '@/components/AgentsList'
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket'
import { pauseAgent, killAgent, restartAgent, getAgentOutput } from '@/lib/api'

export default function AgentsPage() {
  const { agents: wsAgents, connected, error } = useAgentWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL,
  })

  const [viewMode, setViewMode] = useState<'graph' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Only use WebSocket data - no mock data fallback
  const agents = wsAgents

  // Filter agents based on search and status
  const filteredAgents = useMemo(() => {
    let filtered = agents

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((agent) => statusFilter.includes(agent.status))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          agent.task.toLowerCase().includes(query) ||
          agent.id.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [agents, statusFilter, searchQuery])

  // Calculate statistics
  const stats = useMemo(
    () => ({
      total: agents.length,
      active: agents.filter((a) => a.status === 'active').length,
      idle: agents.filter((a) => a.status === 'idle').length,
      error: agents.filter((a) => a.status === 'error').length,
      completed: agents.filter((a) => a.status === 'completed').length,
    }),
    [agents]
  )

  const handlePause = async (agentId: string) => {
    setActionLoading(agentId)
    setActionError(null)
    setActionSuccess(null)

    try {
      const result = await pauseAgent(agentId)
      setActionSuccess(result.message)
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pause agent'
      setActionError(message)
      setTimeout(() => setActionError(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleKill = async (agentId: string) => {
    if (!confirm('Are you sure you want to kill this agent? This action cannot be undone.')) {
      return
    }

    setActionLoading(agentId)
    setActionError(null)
    setActionSuccess(null)

    try {
      const result = await killAgent(agentId)
      setActionSuccess(result.message)
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to kill agent'
      setActionError(message)
      setTimeout(() => setActionError(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async (agentId: string) => {
    setActionLoading(agentId)
    setActionError(null)
    setActionSuccess(null)

    try {
      const result = await restartAgent(agentId)
      const message = result.newAgentId
        ? `${result.message} (New agent ID: ${result.newAgentId})`
        : result.message
      setActionSuccess(message)
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restart agent'
      setActionError(message)
      setTimeout(() => setActionError(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewOutput = async (agentId: string) => {
    setActionLoading(agentId)
    setActionError(null)

    try {
      const result = await getAgentOutput(agentId)
      // TODO: Open a modal or new page to display the output
      // For now, log to console and show success message
      console.log('Agent output:', result)
      setActionSuccess('Output retrieved successfully. Check console for details.')
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch agent output'
      setActionError(message)
      setTimeout(() => setActionError(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-none bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agent Monitor</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time monitoring of all active agents
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {error && (
                <div className="text-xs sm:text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {connected ? 'Live Data' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-semibold">Total</div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <button
              onClick={() => toggleStatusFilter('active')}
              className={`rounded-lg p-3 border-2 transition-all ${
                statusFilter.includes('active')
                  ? 'bg-green-100 border-green-500'
                  : 'bg-green-50 border-green-200 hover:border-green-300'
              }`}
            >
              <div className="text-xs text-green-600 font-semibold">Active</div>
              <div className="text-2xl font-bold text-green-900">{stats.active}</div>
            </button>
            <button
              onClick={() => toggleStatusFilter('idle')}
              className={`rounded-lg p-3 border-2 transition-all ${
                statusFilter.includes('idle')
                  ? 'bg-yellow-100 border-yellow-500'
                  : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
              }`}
            >
              <div className="text-xs text-yellow-600 font-semibold">Idle</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.idle}</div>
            </button>
            <button
              onClick={() => toggleStatusFilter('error')}
              className={`rounded-lg p-3 border-2 transition-all ${
                statusFilter.includes('error')
                  ? 'bg-red-100 border-red-500'
                  : 'bg-red-50 border-red-200 hover:border-red-300'
              }`}
            >
              <div className="text-xs text-red-600 font-semibold">Errors</div>
              <div className="text-2xl font-bold text-red-900">{stats.error}</div>
            </button>
            <button
              onClick={() => toggleStatusFilter('completed')}
              className={`rounded-lg p-3 border-2 transition-all ${
                statusFilter.includes('completed')
                  ? 'bg-gray-300 border-gray-600'
                  : 'bg-gray-100 border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-xs text-gray-600 font-semibold">Done</div>
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Graph View
              </button>
            </div>

            {statusFilter.length > 0 && (
              <button
                onClick={() => setStatusFilter([])}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!connected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
            <div className="flex-none w-5 h-5 bg-yellow-500 rounded-full animate-pulse" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Connecting to WebSocket...</span> Attempting to establish live data connection.
            </p>
          </div>
        </div>
      )}

      {/* Action Success Banner */}
      {actionSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-none w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-green-800">
                <span className="font-semibold">Success!</span> {actionSuccess}
              </p>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-none w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-800">
                <span className="font-semibold">Error:</span> {actionError}
              </p>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {agents.length === 0 && connected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No agents currently running</p>
              <p className="text-sm text-gray-500 mt-1">Agents will appear here as they start</p>
            </div>
          </div>
        ) : actionLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              <p className="text-sm text-gray-500">Processing action...</p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <AgentsList
            agents={filteredAgents}
            onPause={handlePause}
            onKill={handleKill}
            onRestart={handleRestart}
            onViewOutput={handleViewOutput}
          />
        ) : (
          <AgentTree
            agents={filteredAgents}
            onPause={handlePause}
            onKill={handleKill}
            onRestart={handleRestart}
            onViewOutput={handleViewOutput}
          />
        )}
      </div>
    </div>
  )
}
