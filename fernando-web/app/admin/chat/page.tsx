'use client'

import { useState, useEffect, useRef } from 'react'
import ChatMessage from '@/components/ChatMessage'
import ConversationList from '@/components/ConversationList'
import {
  getConversations,
  getConversationMessages,
  sendChatMessage,
  deleteConversation,
} from '@/lib/api'
import { ChatMessage as ChatMessageType, Conversation } from '@/types/chat'

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const data = await getConversations(20)
      setConversations(data.conversations)
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('Failed to load conversations')
    }
  }

  const loadConversation = async (conversationId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getConversationMessages(conversationId)
      setMessages(data.messages)
      setCurrentConversationId(conversationId)
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setError('Failed to load conversation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewConversation = () => {
    setCurrentConversationId(undefined)
    setMessages([])
    setError(null)
    textareaRef.current?.focus()
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c.conversationId !== conversationId))

      // If we deleted the current conversation, start a new one
      if (conversationId === currentConversationId) {
        handleNewConversation()
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
      setError('Failed to delete conversation')
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setIsSending(true)

    // Add user message to UI immediately
    const tempUserMessage: ChatMessageType = {
      id: 'temp-user',
      conversationId: currentConversationId || 'temp',
      tenantId: 'peter',
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await sendChatMessage(userMessage, currentConversationId)

      // Update conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation.conversationId)
        // Reload conversations to show the new one
        loadConversations()
      } else {
        // Update the conversation in the list
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === response.conversation.conversationId
              ? response.conversation
              : c
          )
        )
      }

      // Replace temp message with actual messages
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== 'temp-user')
        return [...withoutTemp, response.message]
      })

      // Reload messages to get the user message with proper ID
      if (response.conversation.conversationId) {
        const data = await getConversationMessages(response.conversation.conversationId)
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== 'temp-user'))
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 md:left-32 top-0 md:top-0 flex bg-gray-50 dark:bg-gray-950">
      {/* Conversation List Sidebar */}
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
              F
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Fernando</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your AI Assistant</p>
            </div>
          </div>

          {/* New Chat Button (Desktop) */}
          <button
            onClick={handleNewConversation}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mb-4">
                F
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Chat with Fernando
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                I'm your personal AI assistant. I can help you think through ideas, answer
                questions, and access your knowledge base. What would you like to discuss?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                <button
                  onClick={() => setInput('What do you know about my preferences?')}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    My Preferences
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learn about what you've told me
                  </p>
                </button>
                <button
                  onClick={() => setInput('Help me brainstorm ideas for...')}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Brainstorm</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate and explore ideas together
                  </p>
                </button>
                <button
                  onClick={() => setInput("What's in my knowledge base about...")}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Search Knowledge</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Find information you've saved
                  </p>
                </button>
                <button
                  onClick={() => setInput('Can you help me with...')}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Ask a Question</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help with anything on your mind
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading conversation...</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto w-full space-y-6">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isStreaming={isSending && message.id === 'temp-user'}
                    />
                  ))}
                  {isSending && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                        F
                      </div>
                      <div className="flex-1 max-w-3xl">
                        <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm">Fernando is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex-shrink-0 mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Fernando... (Shift+Enter for new line)"
                disabled={isSending}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed max-h-40 overflow-y-auto"
                style={{ minHeight: '52px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isSending}
                className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="Send message (Enter)"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Fernando can make mistakes. Check important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
