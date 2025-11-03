export interface ChatMessage {
  id: string
  conversationId: string
  tenantId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  conversationId: string
  tenantId: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[]
}

export interface SendMessageRequest {
  conversationId?: string
  message: string
}

export interface SendMessageResponse {
  message: ChatMessage
  conversation: Conversation
}

export interface ConversationsListResponse {
  conversations: Conversation[]
  total: number
}

export interface StreamChunk {
  type: 'start' | 'content' | 'end' | 'error'
  content?: string
  error?: string
}
