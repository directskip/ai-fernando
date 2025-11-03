export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: 'public' | 'conditional' | 'private' | 'preferences' | 'unclassified' | 'synced'
  createdAt: string
  updatedAt: string
  tags?: string[]
  suggestedCategory?: 'public' | 'conditional' | 'private' | 'preferences'
  classificationReason?: string
}

export interface KnowledgeResponse {
  public?: KnowledgeItem[] | Record<string, unknown>
  conditional?: KnowledgeItem[] | Record<string, unknown>
  private?: KnowledgeItem[] | Record<string, unknown>
  preferences?: Record<string, unknown>
  unclassified?: KnowledgeItem[] | Record<string, unknown>
  synced?: KnowledgeItem[] | Record<string, unknown>
}

export interface Session {
  id: string
  project: string
  directory: string
  startedAt: string
  endedAt?: string
  status: 'active' | 'ended'
  metadata?: {
    duration?: number
    itemsCreated?: number
    tags?: string[]
  }
}

export interface SessionsResponse {
  sessions: Session[]
  total: number
}

export interface CaptureNote {
  title: string
  content: string
  category: 'public' | 'conditional' | 'private'
  tags?: string[]
}

export interface ApiError {
  message: string
  status?: number
}

// Claude Code Session Types
export interface ClaudeCodeSession {
  id: string
  tenantId: string
  name: string
  workingDirectory: string
  status: 'running' | 'paused' | 'ended'
  createdAt: string
  updatedAt: string
  lastActivity?: string
  metadata?: {
    model?: string
    totalPrompts?: number
    filesModified?: string[]
  }
}

export interface ClaudeCodeMessage {
  id: string
  sessionId: string
  type: 'prompt' | 'response' | 'error' | 'tool_use' | 'system'
  content: string
  timestamp: string
  metadata?: {
    toolName?: string
    toolInput?: unknown
    toolOutput?: unknown
    tokensUsed?: number
  }
}

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  size?: number
  modified?: string
}

export interface SessionState {
  session: ClaudeCodeSession
  messages: ClaudeCodeMessage[]
  fileTree?: FileTreeNode
  isConnected: boolean
  isStreaming: boolean
}

export interface CreateSessionRequest {
  tenantId: string
  name: string
  workingDirectory: string
  model?: string
}

export interface SendPromptRequest {
  sessionId: string
  prompt: string
}

export interface SessionsListResponse {
  sessions: ClaudeCodeSession[]
  total: number
}

// Activity Viewer Types
export interface SpawnedAgent {
  id: string
  parentSessionId: string
  type: 'agent' | 'tool' | 'task'
  name: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  output: string[]
  progress?: number
  metadata?: {
    tool?: string
    args?: unknown
    error?: string
  }
}

export interface ActiveSession {
  id: string
  tenantId: string
  name: string
  type: 'main' | 'spawn'
  workingDirectory: string
  status: 'running' | 'paused' | 'completed' | 'failed'
  startedAt: string
  lastActivity: string
  output: string[]
  spawns: SpawnedAgent[]
  metadata?: {
    model?: string
    totalPrompts?: number
    filesModified?: string[]
    parentSessionId?: string
  }
}

export interface ActivityViewerState {
  sessions: ActiveSession[]
  lastUpdate: string
  isConnected: boolean
}

// Brain Dump & Inbox Types
export interface ExtractedItem {
  type: 'todo' | 'question' | 'knowledge' | 'project'
  content: string
  context?: string
}

export interface BrainDumpExtraction {
  todos: ExtractedItem[]
  questions: ExtractedItem[]
  knowledge: ExtractedItem[]
  projects: ExtractedItem[]
}

export interface FeedbackNote {
  id: string
  userId: string
  timestamp: string
  message: string
}

export interface InboxItem {
  id: string
  tenantId: string
  category: 'inbox'
  originalContent: string
  extracted: BrainDumpExtraction
  processed: boolean
  timestamp: string
  feedback?: {
    status: 'approved' | 'rejected' | 'needs_info' | 'in_review'
    notes?: FeedbackNote[]
    lastUpdated?: string
  }
}

export interface InboxResponse {
  items: InboxItem[]
  total: number
}
