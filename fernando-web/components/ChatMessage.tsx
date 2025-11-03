'use client'

import { ChatMessage as ChatMessageType } from '@/types/chat'
import { useState } from 'react'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  // Simple markdown rendering for Fernando's messages
  const renderContent = (content: string) => {
    if (isUser) {
      return <p className="whitespace-pre-wrap break-words">{content}</p>
    }

    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g)

    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          if (part.startsWith('```')) {
            const code = part.slice(3, -3).trim()
            const lines = code.split('\n')
            const language = lines[0].trim()
            const codeContent = lines.slice(1).join('\n')

            return (
              <div key={index} className="relative group">
                {language && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">
                    {language}
                  </div>
                )}
                <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm font-mono">{codeContent || code}</code>
                </pre>
              </div>
            )
          }

          // Regular text with basic markdown
          const formattedText = part
            .split('\n\n')
            .map((paragraph, pIndex) => {
              // Bold
              let formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              // Italic
              formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
              // Inline code
              formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')

              return (
                <p
                  key={pIndex}
                  className="whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              )
            })

          return <div key={index}>{formattedText}</div>
        })}
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
      }`}>
        {isUser ? 'P' : 'F'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white ml-auto'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}>
          <div className={`text-sm ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
            {renderContent(message.content)}
            {isStreaming && !isUser && (
              <span className="inline-block w-2 h-4 bg-gray-400 dark:bg-gray-600 ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* Timestamp and Actions */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && (
            <button
              onClick={copyToClipboard}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy message"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
