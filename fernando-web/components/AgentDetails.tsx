'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AgentNode } from '@/types/agent'

interface AgentDetailsProps {
  agent: AgentNode | null
  onClose: () => void
  onPause?: (agentId: string) => void
  onKill?: (agentId: string) => void
  onRestart?: (agentId: string) => void
  onViewOutput?: (agentId: string) => void
}

export default function AgentDetails({
  agent,
  onClose,
  onPause,
  onKill,
  onRestart,
  onViewOutput,
}: AgentDetailsProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Live duration updates
  useEffect(() => {
    if (agent && !agent.endTime && (agent.status === 'active' || agent.status === 'idle')) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [agent])

  if (!agent) return null

  const duration = agent.endTime
    ? Math.floor((agent.endTime.getTime() - agent.startTime.getTime()) / 1000)
    : Math.floor((currentTime - agent.startTime.getTime()) / 1000)

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-16 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Agent Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Agent Name
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{agent.name}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    agent.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : agent.status === 'idle'
                      ? 'bg-yellow-100 text-yellow-800'
                      : agent.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {agent.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Task Description
              </label>
              <p className="mt-1 text-sm text-gray-700">{agent.task}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Start Time
                </label>
                <p className="mt-1 text-sm text-gray-700">
                  {agent.startTime.toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duration
                </label>
                <p className="mt-1 text-sm text-gray-700">{formatDuration(duration)}</p>
              </div>
            </div>

            {agent.resourceUsage && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Resource Usage
                </label>
                <div className="mt-2 space-y-2">
                  {agent.resourceUsage.tokens && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tokens</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {agent.resourceUsage.tokens.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {agent.resourceUsage.cpu !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CPU</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {agent.resourceUsage.cpu}%
                      </span>
                    </div>
                  )}
                  {agent.resourceUsage.memory !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Memory</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {agent.resourceUsage.memory} MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {agent.output && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Output Preview
                </label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono line-clamp-6">
                    {agent.output}
                  </pre>
                </div>
              </div>
            )}

            {agent.error && (
              <div>
                <label className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                  Error
                </label>
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700">{agent.error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-gray-200">
              {onViewOutput && (
                <button
                  onClick={() => onViewOutput(agent.id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Full Output
                </button>
              )}

              {agent.status === 'active' && onPause && (
                <button
                  onClick={() => onPause(agent.id)}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  Pause Agent
                </button>
              )}

              {agent.status === 'error' && onRestart && (
                <button
                  onClick={() => onRestart(agent.id)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Restart Agent
                </button>
              )}

              {(agent.status === 'active' || agent.status === 'idle') && onKill && (
                <button
                  onClick={() => onKill(agent.id)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Kill Agent
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
