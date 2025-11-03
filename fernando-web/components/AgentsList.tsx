'use client'

import { useState, useMemo, useEffect } from 'react'
import AgentDetails from './AgentDetails'
import type { AgentNode } from '@/types/agent'

interface AgentsListProps {
  agents: AgentNode[]
  onPause?: (agentId: string) => void
  onKill?: (agentId: string) => void
  onRestart?: (agentId: string) => void
  onViewOutput?: (agentId: string) => void
}

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-700 border-green-200',
  idle: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-gray-50 text-gray-700 border-gray-200',
}

const STATUS_BADGE_COLORS = {
  active: 'bg-green-100 text-green-800',
  idle: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
}

const STATUS_DOT_COLORS = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  error: 'bg-red-500',
  completed: 'bg-gray-500',
}

export default function AgentsList({
  agents,
  onPause,
  onKill,
  onRestart,
  onViewOutput,
}: AgentsListProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'time'>('time')
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update current time for duration calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sort agents
  const sortedAgents = useMemo(() => {
    const sorted = [...agents]
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'status') {
      const statusOrder = { active: 0, idle: 1, error: 2, completed: 3 }
      sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
    } else {
      // Sort by time (newest first)
      sorted.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    }
    return sorted
  }, [agents, sortBy])

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date(currentTime)
    const seconds = Math.floor((endTime.getTime() - start.getTime()) / 1000)
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) return `${hrs}h ${mins}m`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-none bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex gap-3 items-center">
        <span className="text-sm font-medium text-gray-600">Sort by:</span>
        <div className="flex gap-2">
          {(['time', 'name', 'status'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sortBy === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto">
        {sortedAgents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="font-medium">No agents match your filters</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`${STATUS_COLORS[agent.status]} border-l-4 ${
                  agent.status === 'active' ? 'border-l-green-500' :
                  agent.status === 'idle' ? 'border-l-yellow-500' :
                  agent.status === 'error' ? 'border-l-red-500' :
                  'border-l-gray-500'
                } px-4 sm:px-6 py-4 hover:bg-opacity-75 transition-colors cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-none ${STATUS_DOT_COLORS[agent.status]}`} />
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {agent.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-none ${STATUS_BADGE_COLORS[agent.status]}`}>
                        {agent.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {agent.task}
                    </p>
                  </div>

                  {/* Right side stats */}
                  <div className="flex-none text-right min-w-fit">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">
                      {formatTime(agent.startTime)}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatDuration(agent.startTime, agent.endTime)}
                    </div>
                  </div>
                </div>

                {/* Expanded info - shown on hover for larger screens */}
                <div className="hidden sm:grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-current border-opacity-20 text-xs">
                  <div>
                    <span className="text-gray-600">Tokens:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {agent.resourceUsage?.tokens ? agent.resourceUsage.tokens.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">CPU:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {agent.resourceUsage?.cpu ? `${agent.resourceUsage.cpu}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Memory:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {agent.resourceUsage?.memory ? `${agent.resourceUsage.memory} MB` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Parent:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {agent.parentId ? agent.parentId.substring(0, 8) : 'None'}
                    </span>
                  </div>
                </div>

                {/* Error display */}
                {agent.error && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-xs font-medium text-red-800">Error: {agent.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Details Panel */}
      {selectedAgent && (
        <AgentDetails
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onPause={onPause}
          onKill={onKill}
          onRestart={onRestart}
          onViewOutput={onViewOutput}
        />
      )}
    </div>
  )
}
