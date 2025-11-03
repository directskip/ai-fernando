'use client'

import { useState, useEffect } from 'react'
import { ClaudeCodeSession, ClaudeCodeMessage, FileTreeNode } from '@/lib/types'
import TerminalOutput from './TerminalOutput'
import PromptInput from './PromptInput'
import FileTreeViewer from './FileTreeViewer'

interface SessionTabProps {
  session: ClaudeCodeSession
  onClose: () => void
  onEndSession: () => void
}

export default function SessionTab({
  session,
  onClose,
  onEndSession,
}: SessionTabProps) {
  const [messages, setMessages] = useState<ClaudeCodeMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [_fileTree, _setFileTree] = useState<FileTreeNode | undefined>()
  const [selectedView, setSelectedView] = useState<'terminal' | 'files'>('terminal')

  // Load messages when tab becomes active
  useEffect(() => {
    fetchMessages()
  }, [session.id])

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/claude-sessions/${session.id}/messages`
      )
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendPrompt = async (prompt: string) => {
    setIsStreaming(true)
    try {
      const response = await fetch(
        `/api/claude-sessions/${session.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      )

      const data = await response.json()

      // Add messages to the list
      setMessages((prev) => [
        ...prev,
        data.prompt,
        data.response,
      ])
    } catch (error) {
      console.error('Error sending prompt:', error)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleFileSelect = (path: string) => {
    console.log('File selected:', path)
    // TODO: Implement file content viewer
  }

  const handleEndSession = async () => {
    if (
      window.confirm(
        'Are you sure you want to end this session? This action cannot be undone.'
      )
    ) {
      try {
        await fetch(`/api/claude-sessions?sessionId=${session.id}`, {
          method: 'DELETE',
        })
        onEndSession()
      } catch (error) {
        console.error('Error ending session:', error)
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {session.name}
            </h2>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                session.status === 'running'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : session.status === 'paused'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}
            >
              {session.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {session.status === 'running' && (
              <button
                onClick={handleEndSession}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close Tab
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Working Directory: {session.workingDirectory}</p>
          <p>
            Model: {session.metadata?.model || 'claude-sonnet-4'} | Prompts:{' '}
            {session.metadata?.totalPrompts || 0}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('terminal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'terminal'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Terminal
          </button>
          <button
            onClick={() => setSelectedView('files')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'files'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Files
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        {selectedView === 'terminal' ? (
          <div className="h-full flex flex-col gap-4">
            <div className="flex-1 overflow-hidden">
              <TerminalOutput messages={messages} isStreaming={isStreaming} />
            </div>
            <div>
              <PromptInput
                onSendPrompt={handleSendPrompt}
                isDisabled={session.status !== 'running' || isStreaming}
                placeholder={
                  session.status !== 'running'
                    ? 'Session is not running'
                    : 'Enter your prompt...'
                }
              />
            </div>
          </div>
        ) : (
          <FileTreeViewer tree={_fileTree} onFileSelect={handleFileSelect} />
        )}
      </div>
    </div>
  )
}
