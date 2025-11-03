import { KnowledgeResponse, SessionsResponse, CaptureNote, ApiError } from './types'

const API_URL =
  process.env.NEXT_PUBLIC_FERNANDO_API_URL ||
  'https://p1k9c6b251.execute-api.us-east-1.amazonaws.com/prod'

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'peter'

// Cache configuration
const CACHE_TTL_MS = 30000 // 30 seconds

// Cache entry structure
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<unknown>>()

// Request deduplication map - stores pending promises to avoid duplicate simultaneous requests
const pendingRequests = new Map<string, Promise<unknown>>()

/**
 * Invalidate cache entry for a specific key
 */
function invalidateCache(key: string): void {
  cacheStore.delete(key)
}

/**
 * Clear all cache entries (useful for manual cache clearing)
 */
function clearCache(): void {
  cacheStore.clear()
}

/**
 * Get cached data if it exists and is still valid (within TTL)
 */
function getCachedData<T>(key: string): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined

  if (!entry) {
    return null
  }

  const now = Date.now()
  const age = now - entry.timestamp

  // Check if cache entry has expired
  if (age > CACHE_TTL_MS) {
    cacheStore.delete(key)
    return null
  }

  return entry.data
}

/**
 * Set data in cache with current timestamp
 */
function setCachedData<T>(key: string, data: T): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
  })
}

/**
 * Deduplicate requests - if a request is already in flight, return the existing promise
 * Otherwise, execute the request and store the promise
 */
async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if we already have a pending request for this key
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>
  }

  // Create the promise and store it before awaiting
  const promise = requestFn()
    .then((result) => {
      // Cache the successful result
      setCachedData(key, result)
      return result
    })
    .finally(() => {
      // Remove from pending requests once resolved
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, promise)
  return promise as Promise<T>
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.status} ${response.statusText}`,
      status: response.status,
    }
    throw error
  }
  return response.json()
}

export async function getKnowledge(): Promise<KnowledgeResponse> {
  const cacheKey = `knowledge_${TENANT_ID}`

  try {
    // Check if we have valid cached data
    const cachedData = getCachedData<KnowledgeResponse>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Use deduplication to avoid simultaneous requests for the same data
    return await deduplicateRequest(cacheKey, async () => {
      const response = await fetch(`${API_URL}/knowledge/${TENANT_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return handleResponse<KnowledgeResponse>(response)
    })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    throw error
  }
}

export async function getSessions(): Promise<SessionsResponse> {
  const cacheKey = `sessions_${TENANT_ID}`

  try {
    // Check if we have valid cached data
    const cachedData = getCachedData<SessionsResponse>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Use deduplication to avoid simultaneous requests for the same data
    return await deduplicateRequest(cacheKey, async () => {
      const response = await fetch(`${API_URL}/sessions/${TENANT_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return handleResponse<SessionsResponse>(response)
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }
}

export async function updateKnowledge(
  category: 'public' | 'conditional' | 'private' | 'preferences',
  data: unknown
): Promise<KnowledgeResponse> {
  try {
    const response = await fetch(`${API_URL}/knowledge/${TENANT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, data }),
    })
    const result = await handleResponse<KnowledgeResponse>(response)
    // Invalidate knowledge cache after successful update
    invalidateCache(`knowledge_${TENANT_ID}`)
    return result
  } catch (error) {
    console.error('Error updating knowledge:', error)
    throw error
  }
}

export async function captureNote(note: CaptureNote): Promise<KnowledgeResponse> {
  try {
    const response = await fetch(`${API_URL}/knowledge/${TENANT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    })
    const result = await handleResponse<KnowledgeResponse>(response)
    // Invalidate knowledge cache after successful capture
    invalidateCache(`knowledge_${TENANT_ID}`)
    return result
  } catch (error) {
    console.error('Error capturing note:', error)
    throw error
  }
}

export async function searchKnowledge(query: string): Promise<KnowledgeResponse> {
  try {
    const response = await fetch(
      `${API_URL}/knowledge/${TENANT_ID}/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return handleResponse<KnowledgeResponse>(response)
  } catch (error) {
    console.error('Error searching knowledge:', error)
    throw error
  }
}

export async function reclassifyKnowledge(
  itemId: string,
  fromCategory: string,
  toCategory: string,
  notes?: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_URL}/knowledge/${TENANT_ID}/reclassify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, fromCategory, toCategory, notes }),
    })
    const result = await handleResponse<{ success: boolean }>(response)
    // Invalidate knowledge cache after successful reclassification
    invalidateCache(`knowledge_${TENANT_ID}`)
    return result
  } catch (error) {
    console.error('Error reclassifying knowledge:', error)
    throw error
  }
}

export interface ExtractedItem {
  type: 'todo' | 'question' | 'knowledge' | 'project'
  content: string
  context?: string
}

export interface BrainDumpResult {
  todos: ExtractedItem[]
  questions: ExtractedItem[]
  knowledge: ExtractedItem[]
  projects: ExtractedItem[]
}

export async function processBrainDump(content: string): Promise<BrainDumpResult> {
  try {
    const response = await fetch(`${API_URL}/brain-dump/${TENANT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })
    return handleResponse<BrainDumpResult>(response)
  } catch (error) {
    console.error('Error processing brain dump:', error)
    throw error
  }
}

export async function getInboxItems(): Promise<import('./types').InboxResponse> {
  try {
    const response = await fetch(`${API_URL}/inbox/${TENANT_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<import('./types').InboxResponse>(response)
  } catch (error) {
    console.error('Error fetching inbox items:', error)
    throw error
  }
}

export async function submitInboxFeedback(
  itemId: string,
  status: 'approved' | 'rejected' | 'needs_info',
  note?: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_URL}/inbox/${TENANT_ID}/${itemId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, note }),
    })
    const result = await handleResponse<{ success: boolean }>(response)
    // Invalidate knowledge cache if approved (moves to knowledge base)
    if (status === 'approved') {
      invalidateCache(`knowledge_${TENANT_ID}`)
    }
    return result
  } catch (error) {
    console.error('Error submitting inbox feedback:', error)
    throw error
  }
}

export async function addInboxNote(
  itemId: string,
  message: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_URL}/inbox/${TENANT_ID}/${itemId}/note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })
    return handleResponse<{ success: boolean }>(response)
  } catch (error) {
    console.error('Error adding inbox note:', error)
    throw error
  }
}

// Chat & Conversations API
export async function getConversations(
  limit?: number
): Promise<import('@/types/chat').ConversationsListResponse> {
  try {
    const url = new URL('/api/conversations', window.location.origin)
    if (limit) {
      url.searchParams.set('limit', limit.toString())
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<import('@/types/chat').ConversationsListResponse>(response)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw error
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<{ messages: import('@/types/chat').ChatMessage[] }> {
  try {
    const response = await fetch(
      `/api/chat?conversationId=${encodeURIComponent(conversationId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return handleResponse<{ messages: import('@/types/chat').ChatMessage[] }>(response)
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    throw error
  }
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<import('@/types/chat').SendMessageResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
    })
    return handleResponse<import('@/types/chat').SendMessageResponse>(response)
  } catch (error) {
    console.error('Error sending chat message:', error)
    throw error
  }
}

export async function deleteConversation(conversationId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(
      `/api/conversations?conversationId=${encodeURIComponent(conversationId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return handleResponse<{ success: boolean }>(response)
  } catch (error) {
    console.error('Error deleting conversation:', error)
    throw error
  }
}

// Agent Management API
export async function pauseAgent(agentId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<{ success: boolean; message: string }>(response)
  } catch (error) {
    console.error('Error pausing agent:', error)
    throw error
  }
}

export async function killAgent(agentId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/kill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<{ success: boolean; message: string }>(response)
  } catch (error) {
    console.error('Error killing agent:', error)
    throw error
  }
}

export async function restartAgent(agentId: string): Promise<{ success: boolean; message: string; newAgentId?: string }> {
  try {
    const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<{ success: boolean; message: string; newAgentId?: string }>(response)
  } catch (error) {
    console.error('Error restarting agent:', error)
    throw error
  }
}

export async function getAgentOutput(agentId: string): Promise<{ agentId: string; output: string; logs: unknown[]; artifacts: unknown[] }> {
  try {
    const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/output`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<{ agentId: string; output: string; logs: unknown[]; artifacts: unknown[] }>(response)
  } catch (error) {
    console.error('Error fetching agent output:', error)
    throw error
  }
}

// Cache management utilities (exported for testing and manual cache control)
export { invalidateCache, clearCache }
