'use client'

import { ClaudeCodeMessage } from '@/lib/types'
import { useEffect, useRef } from 'react'

interface TerminalOutputProps {
  messages: ClaudeCodeMessage[]
  isStreaming?: boolean
}

export default function TerminalOutput({
  messages,
  isStreaming = false,
}: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getMessageIcon = (type: ClaudeCodeMessage['type']) => {
    switch (type) {
      case 'prompt':
        return '>'
      case 'response':
        return '<'
      case 'error':
        return 'X'
      case 'tool_use':
        return 'T'
      case 'system':
        return 'S'
      default:
        return '-'
    }
  }

  const getMessageColor = (type: ClaudeCodeMessage['type']) => {
    switch (type) {
      case 'prompt':
        return 'text-blue-400'
      case 'response':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'tool_use':
        return 'text-yellow-400'
      case 'system':
        return 'text-gray-400'
      default:
        return 'text-gray-300'
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 h-full overflow-y-auto font-mono text-sm">
      {messages.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No messages yet. Send a prompt to start.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={getMessageColor(message.type)}>
                  [{getMessageIcon(message.type)}]
                </span>
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.metadata?.toolName && (
                  <span className="text-yellow-400">
                    Tool: {message.metadata.toolName}
                  </span>
                )}
                {message.metadata?.tokensUsed && (
                  <span className="text-purple-400">
                    Tokens: {message.metadata.tokensUsed}
                  </span>
                )}
              </div>
              <div
                className={`${getMessageColor(message.type)} whitespace-pre-wrap break-words`}
              >
                {message.content}
              </div>
              {message.metadata?.toolInput ? (
                <details className="text-xs text-gray-500 mt-1">
                  <summary className="cursor-pointer hover:text-gray-400">
                    Tool Input
                  </summary>
                  <pre className="mt-1 p-2 bg-gray-800 rounded">
                    {JSON.stringify(message.metadata.toolInput, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ))}
          {isStreaming && (
            <div className="text-green-400 animate-pulse">
              <span className="inline-block w-2 h-4 bg-green-400 mr-1"></span>
              Streaming response...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
