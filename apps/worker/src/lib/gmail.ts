/**
 * Gmail API Client — In-memory email fetching, label application, watch management
 * Token refresh with invalid_grant detection → status revoked (PM9)
 * Rate limiting with exponential backoff
 *
 * Source: [architecture.md — Story 2.5-2.7, PM7, PM9]
 *
 * CRITICAL CONSTRAINTS:
 * - Email content NEVER touches disk or database (in-memory only)
 * - Zero email content in any log (ClassificationLogger whitelist)
 * - Rate limit: 250 quota units/sec (user-level)
 */

import { encrypt, decrypt } from './crypto'

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

// Rate limiting: exponential backoff config
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 16_000

// Proactive token refresh: 1h before expiry (architecture.md — Pre-mortem Risk 1)
const TOKEN_REFRESH_BUFFER_MS = 60 * 60 * 1000

export interface GmailTokens {
  access_token: string
  refresh_token: string
  expires_at: Date | string
}

export interface GmailEmail {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  headers: Record<string, string>
  snippet: string        // Gmail snippet (truncated, no full body)
  bodyPreview: string    // First 500 chars for LLM context
  bodyTail: string       // Last 50 chars for LLM context
  internalDate: string
  labelIds: string[]
}

export interface GmailHistoryRecord {
  id: string
  messagesAdded?: Array<{ message: { id: string; labelIds: string[] } }>
  labelsAdded?: Array<{ message: { id: string }; labelIds: string[] }>
  labelsRemoved?: Array<{ message: { id: string }; labelIds: string[] }>
}

export interface GmailWatchResponse {
  historyId: string
  expiration: string     // Unix timestamp ms
}

// ── Token refresh ──

/**
 * Refresh Gmail access token using refresh_token
 * On invalid_grant: returns null (caller must set status='revoked')
 * On success: returns new tokens (caller must persist + read-back assert)
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_at: Date } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing')
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()

    // invalid_grant = user revoked access or refresh token expired (PM9)
    if (response.status === 400 && errorBody.includes('invalid_grant')) {
      return null
    }

    throw new Error(`Token refresh failed: ${response.status}`)
  }

  const data = await response.json()
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000))

  return {
    access_token: data.access_token,
    expires_at: expiresAt,
  }
}

/**
 * Get a valid access token, refreshing proactively if needed (1h before expiry)
 * Updates the integration row in Supabase on refresh + read-back assertion
 * Returns null if token is invalid (invalid_grant) — caller handles revocation
 */
export async function getValidAccessToken(
  supabase: any,
  integration: { id: string; user_id: string; access_token: string; refresh_token: string; expires_at: Date | string },
): Promise<string | null> {
  const expiresAt = new Date(integration.expires_at)
  const needsRefresh = expiresAt.getTime() - Date.now() < TOKEN_REFRESH_BUFFER_MS

  if (!needsRefresh) {
    // Tokens are stored encrypted — decrypt before use
    return decrypt(integration.access_token)
  }

  // Decrypt refresh_token for the refresh call
  const newTokens = await refreshAccessToken(decrypt(integration.refresh_token))

  if (!newTokens) {
    // invalid_grant — mark as revoked (PM9)
    await supabase
      .from('user_integrations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', integration.id)

    await supabase
      .from('user_pipeline_health')
      .update({ mode: 'paused', updated_at: new Date().toISOString() })
      .eq('user_id', integration.user_id)

    return null
  }

  // Persist new tokens (encrypted)
  const encryptedAccessToken = encrypt(newTokens.access_token)
  await supabase
    .from('user_integrations')
    .update({
      access_token: encryptedAccessToken,
      expires_at: newTokens.expires_at.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id)

  // Read-back assertion (architecture.md — Pre-mortem Risk 1)
  const { data: readBack } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('id', integration.id)
    .single()

  if (!readBack || readBack.access_token !== encryptedAccessToken) {
    throw new Error('Token refresh read-back assertion failed — DB write not persisted')
  }

  return newTokens.access_token
}

// ── Rate-limited fetch with exponential backoff ──

async function gmailFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${GMAIL_API_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Success
    if (response.ok) return response

    // 429 Too Many Requests or 5xx — retry with backoff
    if (response.status === 429 || response.status >= 500) {
      if (attempt < MAX_RETRIES) {
        const backoff = Math.min(
          BASE_BACKOFF_MS * Math.pow(2, attempt),
          MAX_BACKOFF_MS,
        )
        // Add jitter: 0-25% of backoff
        const jitter = Math.random() * backoff * 0.25
        await new Promise((resolve) => setTimeout(resolve, backoff + jitter))
        lastError = new Error(`Gmail API ${response.status} on attempt ${attempt + 1}`)
        continue
      }
    }

    // 401 Unauthorized — token expired mid-request (should be rare with proactive refresh)
    if (response.status === 401) {
      throw new GmailAuthError('Access token expired or revoked')
    }

    // 403, 404, or other non-retryable error
    const errorText = await response.text()
    throw new Error(`Gmail API error ${response.status}: ${errorText}`)
  }

  throw lastError ?? new Error('Gmail API max retries exceeded')
}

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GmailAuthError'
  }
}

// ── Email fetching (in-memory only) ──

/**
 * Fetch a single email by message ID — in-memory only, never persisted
 * Returns structured headers + truncated body for classification pipeline
 *
 * Content processing: first 500 chars (headers context) + last 50 chars (tail)
 * Full body is NEVER stored — only used for in-memory LLM classification
 */
export async function fetchEmail(
  accessToken: string,
  messageId: string,
): Promise<GmailEmail> {
  const response = await gmailFetch(
    accessToken,
    `/messages/${messageId}?format=full`,
  )

  const data = await response.json()

  // Extract headers into flat map
  const headers: Record<string, string> = {}
  const headersList: Array<{ name: string; value: string }> = data.payload?.headers ?? []
  for (const h of headersList) {
    headers[h.name.toLowerCase()] = h.value
  }

  // Extract body text (in-memory only)
  const bodyText = extractBodyText(data.payload)

  return {
    id: data.id,
    threadId: data.threadId,
    from: headers['from'] ?? '',
    to: headers['to'] ?? '',
    subject: headers['subject'] ?? '',
    headers,
    snippet: data.snippet ?? '',
    bodyPreview: bodyText.slice(0, 500),
    bodyTail: bodyText.slice(-50),
    internalDate: data.internalDate ?? '',
    labelIds: data.labelIds ?? [],
  }
}

/**
 * Extract plain text body from Gmail message payload
 * Handles multipart messages — prefers text/plain over text/html
 */
function extractBodyText(payload: any): string {
  if (!payload) return ''

  // Direct body (non-multipart)
  if (payload.body?.data) {
    const mimeType = (payload.mimeType ?? '').toLowerCase()
    if (mimeType === 'text/plain' || mimeType === 'text/html') {
      return decodeBase64Url(payload.body.data)
    }
  }

  // Multipart — recursively find text/plain first, then text/html
  if (payload.parts) {
    // Prefer text/plain
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
    // Fallback: text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return stripHtmlTags(decodeBase64Url(part.body.data))
      }
    }
    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBodyText(part)
        if (nested) return nested
      }
    }
  }

  return ''
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Label management (Story 2.6) ──

/**
 * Ensure Kyrra labels exist in the user's Gmail, creating them if needed
 * Returns a map of classification result → Gmail label ID
 */
export async function ensureLabels(
  accessToken: string,
): Promise<Record<string, string>> {
  const response = await gmailFetch(accessToken, '/labels')
  const data = await response.json()
  const existingLabels: Array<{ id: string; name: string }> = data.labels ?? []

  const kyrraLabels: Record<string, { name: string; color: { textColor: string; backgroundColor: string } }> = {
    'A_VOIR': {
      name: 'Kyrra/À voir',
      color: { textColor: '#0b4f30', backgroundColor: '#b9e4d0' },     // Green
    },
    'FILTRE': {
      name: 'Kyrra/Filtré',
      color: { textColor: '#662e37', backgroundColor: '#fbc8d9' },     // Pink
    },
    'BLOQUE': {
      name: 'Kyrra/Bloqué',
      color: { textColor: '#711a36', backgroundColor: '#f7a7c0' },     // Red
    },
  }

  const labelMap: Record<string, string> = {}

  for (const [key, config] of Object.entries(kyrraLabels)) {
    const existing = existingLabels.find((l) => l.name === config.name)
    if (existing) {
      labelMap[key] = existing.id
      continue
    }

    // Create label
    const createResponse = await gmailFetch(accessToken, '/labels', {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        color: config.color,
      }),
    })

    const created = await createResponse.json()
    labelMap[key] = created.id
  }

  return labelMap
}

/**
 * Apply a Kyrra classification label to a Gmail message
 * Removes any existing Kyrra labels first (email can only have one classification)
 */
export async function applyLabel(
  accessToken: string,
  messageId: string,
  classificationResult: string,
  labelMap: Record<string, string>,
): Promise<void> {
  const targetLabelId = labelMap[classificationResult]
  if (!targetLabelId) {
    throw new Error(`No label ID for classification: ${classificationResult}`)
  }

  // Remove all other Kyrra labels, add the target one
  const allKyrraLabelIds = Object.values(labelMap)
  const labelsToRemove = allKyrraLabelIds.filter((id) => id !== targetLabelId)

  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      addLabelIds: [targetLabelId],
      removeLabelIds: labelsToRemove,
    }),
  })
}

/**
 * Remove ALL Kyrra labels from a message (for reclassification or uninstall)
 */
export async function removeAllKyrraLabels(
  accessToken: string,
  messageId: string,
  labelMap: Record<string, string>,
): Promise<void> {
  const allKyrraLabelIds = Object.values(labelMap)

  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      removeLabelIds: allKyrraLabelIds,
    }),
  })
}

// ── Watch management (Story 2.5, 2.7) ──

/**
 * Create a Gmail Pub/Sub watch for real-time email notifications
 * Watch expires after 7 days — must be renewed (watchRenewalLoop)
 */
export async function createWatch(
  accessToken: string,
  topicName: string,
): Promise<GmailWatchResponse> {
  const response = await gmailFetch(accessToken, '/watch', {
    method: 'POST',
    body: JSON.stringify({
      topicName,
      labelIds: ['INBOX'],
      labelFilterBehavior: 'INCLUDE',
    }),
  })

  const data = await response.json()

  return {
    historyId: data.historyId,
    expiration: data.expiration,
  }
}

/**
 * Renew a Gmail watch — call 24h before 7-day expiry + 6h safety net
 * Same API as create (idempotent — Gmail replaces existing watch)
 */
export async function renewWatch(
  accessToken: string,
  topicName: string,
): Promise<GmailWatchResponse> {
  return createWatch(accessToken, topicName)
}

/**
 * Stop watching a user's Gmail (clean uninstall — FR84)
 */
export async function stopWatch(accessToken: string): Promise<void> {
  await gmailFetch(accessToken, '/stop', {
    method: 'POST',
  })
}

// ── History (reconciliation — Story 2.7) ──

/**
 * Get Gmail history since a given historyId
 * Returns new messages and label changes for reconciliation
 * Handles 404 (historyId too old) by returning null — caller does full sync
 */
export async function getHistory(
  accessToken: string,
  startHistoryId: string,
): Promise<GmailHistoryRecord[] | null> {
  try {
    const records: GmailHistoryRecord[] = []
    let pageToken: string | undefined

    do {
      const params = new URLSearchParams({
        startHistoryId,
        historyTypes: 'messageAdded,labelAdded,labelRemoved',
        maxResults: '100',
      })
      if (pageToken) params.set('pageToken', pageToken)

      const response = await gmailFetch(accessToken, `/history?${params}`)
      const data = await response.json()

      if (data.history) {
        records.push(...data.history)
      }

      pageToken = data.nextPageToken
    } while (pageToken)

    return records
  } catch (error) {
    // 404 = historyId too old (expired after ~30 days)
    if (error instanceof Error && error.message.includes('404')) {
      return null // Caller must perform full sync
    }
    throw error
  }
}

// ── Sent messages (onboarding whitelist scan — Story 1.3) ──

/**
 * List sent messages for whitelist generation (onboarding scan)
 * Fetches sent emails from the last 6 months
 * Rate limited: yields batches with configurable delay
 */
export async function listSentMessages(
  accessToken: string,
  afterDate: Date,
  onBatch: (messages: Array<{ to?: string; cc?: string; bcc?: string }>) => Promise<void>,
): Promise<number> {
  const afterEpoch = Math.floor(afterDate.getTime() / 1000)
  let pageToken: string | undefined
  let totalProcessed = 0

  do {
    const params = new URLSearchParams({
      q: `in:sent after:${afterEpoch}`,
      maxResults: '500',
      fields: 'messages(id),nextPageToken',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const listResponse = await gmailFetch(accessToken, `/messages?${params}`)
    const listData = await listResponse.json()

    const messageIds: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id)

    if (messageIds.length === 0) break

    // Batch fetch headers only (minimal API quota usage)
    const batch: Array<{ to?: string; cc?: string; bcc?: string }> = []

    for (const msgId of messageIds) {
      const msgResponse = await gmailFetch(
        accessToken,
        `/messages/${msgId}?format=metadata&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc`,
      )
      const msgData = await msgResponse.json()

      const headersList: Array<{ name: string; value: string }> = msgData.payload?.headers ?? []
      const entry: Record<string, string> = {}
      for (const h of headersList) {
        entry[h.name.toLowerCase()] = h.value
      }
      batch.push(entry)

      // Rate limiting: 20 calls/sec (40% of Gmail API quota)
      if (batch.length % 20 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    await onBatch(batch)
    totalProcessed += batch.length

    // Beta limit: stop after 100 emails to avoid excessive API usage
    if (totalProcessed >= 100) break

    pageToken = listData.nextPageToken
  } while (pageToken)

  return totalProcessed
}

// ── Label deletion (clean uninstall — FR84) ──

/**
 * Delete all Kyrra labels from the user's Gmail account
 * Part of clean uninstall flow — removes labels after removing them from all messages
 */
export async function deleteKyrraLabels(
  accessToken: string,
  labelMap: Record<string, string>,
): Promise<void> {
  for (const labelId of Object.values(labelMap)) {
    try {
      await gmailFetch(accessToken, `/labels/${labelId}`, {
        method: 'DELETE',
      })
    } catch {
      // Label may already be deleted — continue
    }
  }
}
