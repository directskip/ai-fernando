'use client'

import { Conversation } from '@/types/chat'
import { useState } from 'react'

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export default function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen = true,
  onClose,
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (deletingId === conversationId) {
      // Second click confirms deletion
      await onDeleteConversation(conversationId)
      setDeletingId(null)
    } else {
      // First click shows confirmation
      setDeletingId(conversationId)
      setTimeout(() => setDeletingId(null), 3000) // Reset after 3 seconds
    }
  }

  const formatDate = (timestamp: string) => {
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && onClose && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-0
          w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          flex flex-col transition-transform duration-300 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversations
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* New Conversation Button */}
          <button
            onClick={() => {
              onNewConversation()
              onClose?.()
            }}
            className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new conversation to get started</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversationId}
                  className={`
                    group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                    ${
                      currentConversationId === conversation.conversationId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }
                  `}
                  onClick={() => {
                    onSelectConversation(conversation.conversationId)
                    onClose?.()
                  }}
                >
                  {/* Title */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {conversation.title}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(conversation.conversationId, e)}
                      className={`
                        flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                        p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700
                        ${deletingId === conversation.conversationId ? 'bg-red-100 dark:bg-red-900/30 opacity-100' : ''}
                      `}
                      title={deletingId === conversation.conversationId ? 'Click again to confirm' : 'Delete conversation'}
                    >
                      <svg
                        className={`w-4 h-4 ${deletingId === conversation.conversationId ? 'text-red-600' : 'text-gray-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Last Message Preview */}
                  {conversation.lastMessage && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                      {truncateText(conversation.lastMessage, 80)}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <span>{conversation.messageCount} messages</span>
                    <span>•</span>
                    <span>{formatDate(conversation.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
