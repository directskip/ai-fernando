'use client'

import { memo, useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'
import type { AgentNode as AgentNodeType } from '@/types/agent'

interface AgentNodeProps {
  data: AgentNodeType & {
    onSelect: (agent: AgentNodeType) => void
    isHighlighted?: boolean
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'idle':
      return 'bg-yellow-500'
    case 'error':
      return 'bg-red-500'
    case 'completed':
      return 'bg-gray-500'
    default:
      return 'bg-gray-400'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return '🟢'
    case 'idle':
      return '🟡'
    case 'error':
      return '🔴'
    case 'completed':
      return '⚫'
    default:
      return '⚪'
  }
}

const AgentNode = memo(({ data }: AgentNodeProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Live duration updates for active agents
  useEffect(() => {
    if (!data.endTime && (data.status === 'active' || data.status === 'idle')) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [data.endTime, data.status])

  const duration = data.endTime
    ? Math.floor((data.endTime.getTime() - data.startTime.getTime()) / 1000)
    : Math.floor((currentTime - data.startTime.getTime()) / 1000)

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  return (
    <>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          boxShadow: data.isHighlighted
            ? ['0 10px 15px rgba(59, 130, 246, 0.3)', '0 20px 25px rgba(59, 130, 246, 0.5)', '0 10px 15px rgba(59, 130, 246, 0.3)']
            : undefined
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          boxShadow: data.isHighlighted
            ? { duration: 1, repeat: 2, ease: 'easeInOut' }
            : undefined
        }}
        onClick={() => data.onSelect(data)}
        className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow min-w-[200px] ${
          data.isHighlighted ? 'border-blue-500' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={
              data.status === 'active'
                ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }
                : {}
            }
            transition={
              data.status === 'active'
                ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {}
            }
            className="text-xl"
          >
            {getStatusIcon(data.status)}
          </motion.div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">{data.name}</div>
            <div className={`text-xs font-medium ${getStatusColor(data.status)} text-white px-2 py-0.5 rounded inline-block`}>
              {data.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-2 line-clamp-2">{data.task}</div>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{formatDuration(duration)}</span>
          {data.resourceUsage?.tokens && (
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{data.resourceUsage.tokens} tokens</span>
          )}
        </div>

        {data.status === 'error' && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            Error occurred
          </div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </>
  )
})

AgentNode.displayName = 'AgentNode'

export default AgentNode
