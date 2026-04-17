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

// ── Helpers ──

/**
 * Extract bare email address from a From/To header value
 * Handles: "Name" <email@domain.com>, Name <email@domain.com>, email@domain.com
 */
function extractEmailAddress(headerValue: string): string {
  const match = headerValue.match(/<([^>]+)>/)
  if (match) return match[1]!
  return headerValue.trim()
}

// ── Email fetching (in-memory only) ──

export interface GmailEmailMetadata {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  headers: Record<string, string>
  snippet: string
  internalDate: string
  labelIds: string[]
}

/**
 * Fetch email metadata only (headers, no body) — cheap API call
 * Used for pre-filtering, whitelist checks, and fingerprinting
 * Body is fetched lazily via fetchEmailBody() only when LLM is needed
 */
export async function fetchEmailMetadata(
  accessToken: string,
  messageId: string,
): Promise<GmailEmailMetadata> {
  const response = await gmailFetch(
    accessToken,
    `/messages/${messageId}?format=metadata`,
  )

  const data = await response.json()

  const headers: Record<string, string> = {}
  const headersList: Array<{ name: string; value: string }> = data.payload?.headers ?? []
  for (const h of headersList) {
    headers[h.name.toLowerCase()] = h.value
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: extractEmailAddress(headers['from'] ?? ''),
    to: extractEmailAddress(headers['to'] ?? ''),
    subject: headers['subject'] ?? '',
    headers,
    snippet: data.snippet ?? '',
    internalDate: data.internalDate ?? '',
    labelIds: data.labelIds ?? [],
  }
}

/**
 * Fetch full email body — lazy load, only when LLM classification is needed
 * Returns truncated body for LLM context (first 500 + last 50 chars)
 * Content is in-memory only, never persisted (RGPD)
 */
export async function fetchEmailBody(
  accessToken: string,
  messageId: string,
): Promise<{ bodyPreview: string; bodyTail: string; oversize?: boolean }> {
  const MAX_BODY_BYTES = 5_000_000 // 5MB cap

  // B8.5 follow-up (review Q2): Gmail serves bodies over HTTP/2 with chunked
  // transfer encoding in practice, so `content-length` is usually absent and
  // the original guard almost never fired — we'd already buffered the full
  // payload via .json() before `sizeEstimate` could reject it.
  //
  // Fix: do a cheap metadata probe FIRST (format=minimal returns only the
  // sizeEstimate for the message, no body). One extra API call per LLM-bound
  // email is a small price for a deterministic OOM guard.
  const sizeProbe = await gmailFetch(
    accessToken,
    `/messages/${messageId}?format=minimal&fields=sizeEstimate`,
  )
  const sizeData = await sizeProbe.json()
  const sizeEstimate = Number(sizeData.sizeEstimate ?? 0)

  if (sizeEstimate > MAX_BODY_BYTES) {
    // B8.5 follow-up (review Q5): return an explicit oversize marker so the
    // classifier can log and the operator can monitor. Body itself stays
    // empty — the spec's "truncation" doesn't apply once we refuse to load
    // the payload, and a partial base64 slice would be garbage anyway.
    console.warn(
      `[BODY] Oversize email ${messageId}: sizeEstimate=${sizeEstimate} exceeds ${MAX_BODY_BYTES}B — skipping body fetch`,
    )
    return { bodyPreview: '', bodyTail: '', oversize: true }
  }

  const response = await gmailFetch(
    accessToken,
    `/messages/${messageId}?format=full&fields=payload,sizeEstimate`,
  )

  // Defense in depth: if the metadata probe lied (rare — concurrent edits,
  // thread updates), still refuse to parse once we can see the real size.
  // We at least paid for an HTTP response but we avoid JSON.parse on a
  // 100MB blob.
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    console.warn(
      `[BODY] Oversize email ${messageId} (post-fetch): content-length=${contentLength} exceeds ${MAX_BODY_BYTES}B`,
    )
    try {
      await response.body?.cancel()
    } catch {
      /* best-effort */
    }
    return { bodyPreview: '', bodyTail: '', oversize: true }
  }

  const data = await response.json()

  if (data.sizeEstimate && data.sizeEstimate > MAX_BODY_BYTES) {
    console.warn(
      `[BODY] Oversize email ${messageId} (post-fetch): sizeEstimate=${data.sizeEstimate} exceeds ${MAX_BODY_BYTES}B`,
    )
    return { bodyPreview: '', bodyTail: '', oversize: true }
  }

  const bodyText = extractBodyText(data.payload)

  return {
    bodyPreview: bodyText.slice(0, 500),
    bodyTail: bodyText.slice(-50),
  }
}

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
    from: extractEmailAddress(headers['from'] ?? ''),
    to: extractEmailAddress(headers['to'] ?? ''),
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

// B8.5: Max base64 data to decode — we only use 550 chars of body text,
// so decoding more than ~2KB is wasteful and >5MB risks OOM
const MAX_BASE64_DECODE_LENGTH = 8_000 // ~6KB decoded, plenty for 500+50 chars

function decodeBase64Url(encoded: string): string {
  // Truncate oversized base64 before decoding to prevent OOM (B8.5)
  const truncated = encoded.length > MAX_BASE64_DECODE_LENGTH
    ? encoded.slice(0, MAX_BASE64_DECODE_LENGTH)
    : encoded
  const base64 = truncated.replace(/-/g, '+').replace(/_/g, '/')
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

// ── Gmail label color palette ──

/**
 * Gmail API only accepts specific predefined color pairs for labels.
 * Using any other hex color results in:
 *   "Label color #xxxxx is not on the allowed color palette"
 *
 * This is the complete list of allowed (backgroundColor, textColor) pairs.
 * Source: https://developers.google.com/gmail/api/reference/rest/v1/users.labels
 */
const GMAIL_LABEL_COLORS: Array<{ backgroundColor: string; textColor: string }> = [
  { backgroundColor: '#16a765', textColor: '#094228' },
  { backgroundColor: '#43d692', textColor: '#094228' },
  { backgroundColor: '#4a86e8', textColor: '#094228' },
  { backgroundColor: '#a479e2', textColor: '#094228' },
  { backgroundColor: '#f691b2', textColor: '#094228' },
  { backgroundColor: '#f6c5be', textColor: '#094228' },
  { backgroundColor: '#fad165', textColor: '#094228' },
  { backgroundColor: '#fb4c2f', textColor: '#ffffff' },
  { backgroundColor: '#fbe983', textColor: '#094228' },
  { backgroundColor: '#b6cff5', textColor: '#094228' },
  { backgroundColor: '#98d7e4', textColor: '#094228' },
  { backgroundColor: '#e3d7ff', textColor: '#094228' },
  { backgroundColor: '#ffdeb5', textColor: '#094228' },
  { backgroundColor: '#cfe2f3', textColor: '#094228' },
  { backgroundColor: '#b9e4d0', textColor: '#0d3472' },
  { backgroundColor: '#c2c2c2', textColor: '#094228' },
]

/**
 * Parse a hex color string (#RRGGBB) into [R, G, B] components (0-255)
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  return [r, g, b]
}

/**
 * Find the nearest Gmail-allowed label color pair for an arbitrary hex color.
 * Compares against backgroundColor of each palette entry using Euclidean distance in RGB space.
 * The user's custom color in user_labels.color is NOT modified — this mapping is only
 * used when calling the Gmail API to create/update labels.
 */
export function nearestGmailColor(hex: string): { backgroundColor: string; textColor: string } {
  const [r, g, b] = hexToRgb(hex)

  let bestMatch = GMAIL_LABEL_COLORS[0]!
  let bestDistance = Infinity

  for (const entry of GMAIL_LABEL_COLORS) {
    const [er, eg, eb] = hexToRgb(entry.backgroundColor)
    const distance = (r - er) ** 2 + (g - eg) ** 2 + (b - eb) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = entry
    }
  }

  return bestMatch
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
      color: nearestGmailColor('#2e7d32'),     // Green → nearest Gmail green
    },
    'FILTRE': {
      name: 'Kyrra/Filtré',
      color: nearestGmailColor('#c62828'),     // Red-ish → nearest Gmail pink/red
    },
    'BLOQUE': {
      name: 'Kyrra/Bloqué',
      color: nearestGmailColor('#6a1b9a'),     // Purple → nearest Gmail red
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
 * Fetch the user's current Gmail historyId without requiring Pub/Sub.
 * Used to bootstrap reconciliation when GMAIL_PUBSUB_TOPIC is not configured.
 */
export async function getProfile(
  accessToken: string,
): Promise<{ historyId: string; emailAddress: string }> {
  const response = await gmailFetch(accessToken, '/profile')
  const data = await response.json()
  return {
    historyId: data.historyId,
    emailAddress: data.emailAddress,
  }
}

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
        maxResults: '100',
      })
      params.append('historyTypes', 'messageAdded')
      params.append('historyTypes', 'labelAdded')
      params.append('historyTypes', 'labelRemoved')
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

// ── Inbox listing (initial scan after onboarding — Fix 3) ──

/**
 * List the most recent INBOX message IDs for initial classification scan
 * Returns up to `maxResults` message IDs (default 100)
 */
export async function listInboxMessageIds(
  accessToken: string,
  maxResults: number = 100,
): Promise<string[]> {
  const messageIds: string[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      q: 'in:inbox',
      maxResults: String(Math.min(maxResults - messageIds.length, 500)),
      fields: 'messages(id),nextPageToken',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const response = await gmailFetch(accessToken, `/messages?${params}`)
    const data = await response.json()

    const ids: string[] = (data.messages ?? []).map((m: { id: string }) => m.id)
    messageIds.push(...ids)

    if (messageIds.length >= maxResults) break

    pageToken = data.nextPageToken
  } while (pageToken)

  return messageIds.slice(0, maxResults)
}

// ── Sent messages (onboarding whitelist scan — Story 1.3) ──

/**
 * Count sent messages (cheap — IDs only, no headers fetched)
 * Pages through all message IDs to return an exact count.
 * Used to set total_sent BEFORE the scan starts so the progress bar is meaningful.
 */
export async function countSentMessages(
  accessToken: string,
  afterDate: Date,
): Promise<number> {
  const afterEpoch = Math.floor(afterDate.getTime() / 1000)
  let pageToken: string | undefined
  let total = 0

  do {
    const params = new URLSearchParams({
      q: `in:sent after:${afterEpoch}`,
      maxResults: '500',
      fields: 'messages(id),nextPageToken',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const response = await gmailFetch(accessToken, `/messages?${params}`)
    const data = await response.json()

    const ids: string[] = (data.messages ?? []).map((m: { id: string }) => m.id)
    total += ids.length

    if (ids.length === 0) break
    pageToken = data.nextPageToken
  } while (pageToken)

  return total
}

/**
 * List sent messages for whitelist generation (onboarding scan)
 * Fetches sent emails from the last 6 months
 * Rate limited: yields batches with configurable delay
 *
 * onProgress is called every ~50 emails with the cumulative count
 * of emails processed, so the frontend can show incremental progress.
 */
export async function listSentMessages(
  accessToken: string,
  afterDate: Date,
  onBatch: (messages: Array<{ to?: string; cc?: string; bcc?: string }>) => Promise<void>,
  onProgress?: (emailsProcessed: number) => Promise<void>,
): Promise<number> {
  const afterEpoch = Math.floor(afterDate.getTime() / 1000)
  let pageToken: string | undefined
  let totalProcessed = 0
  // Track when we last reported progress to avoid hammering the DB
  let lastProgressReport = 0

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

      // Incremental progress: report every 50 emails (don't hammer the DB)
      const currentTotal = totalProcessed + batch.length
      if (onProgress && currentTotal - lastProgressReport >= 50) {
        await onProgress(currentTotal)
        lastProgressReport = currentTotal
      }
    }

    await onBatch(batch)
    totalProcessed += batch.length

    // End-of-page progress update (catches remainder that wasn't a multiple of 50)
    if (onProgress && totalProcessed > lastProgressReport) {
      await onProgress(totalProcessed)
      lastProgressReport = totalProcessed
    }

    pageToken = listData.nextPageToken
  } while (pageToken)

  return totalProcessed
}

// ── Dynamic label support (user-defined labels) ──

export interface GmailLabelInfo {
  id: string
  name: string
  type: 'user' | 'system'
  color?: { textColor: string; backgroundColor: string }
  messagesTotal: number
}

/**
 * List all user-created Gmail labels (excluding system labels and Kyrra/* labels)
 * Fetches detail for each to get messagesTotal. Sorted by messagesTotal descending.
 */
export async function listUserGmailLabels(
  accessToken: string,
): Promise<GmailLabelInfo[]> {
  const response = await gmailFetch(accessToken, '/labels')
  const data = await response.json()
  const labels: Array<{ id: string; name: string; type: string }> = data.labels ?? []

  // Filter: keep only user-created labels, skip system labels and Kyrra/* labels
  const userLabels = labels.filter(
    (l) => l.type === 'user' && !l.name.startsWith('Kyrra/'),
  )

  // Fetch detail for each label to get messagesTotal and color
  const detailed: GmailLabelInfo[] = []
  for (const label of userLabels) {
    const detailResponse = await gmailFetch(accessToken, `/labels/${label.id}`)
    const detail = await detailResponse.json()

    detailed.push({
      id: detail.id,
      name: detail.name,
      type: 'user',
      color: detail.color ?? undefined,
      messagesTotal: detail.messagesTotal ?? 0,
    })
  }

  // Sort by messagesTotal descending
  detailed.sort((a, b) => b.messagesTotal - a.messagesTotal)

  return detailed
}

/**
 * Sample recent emails from a specific Gmail label
 * Returns from/subject for each sampled email
 */
export async function sampleEmailsFromLabel(
  accessToken: string,
  labelId: string,
  count: number = 3,
): Promise<Array<{ from: string; subject: string }>> {
  const params = new URLSearchParams({
    labelIds: labelId,
    maxResults: String(count),
    fields: 'messages(id)',
  })

  const response = await gmailFetch(accessToken, `/messages?${params}`)
  const data = await response.json()
  const messageIds: string[] = (data.messages ?? []).map((m: { id: string }) => m.id)

  const samples: Array<{ from: string; subject: string }> = []
  for (const msgId of messageIds) {
    const metadata = await fetchEmailMetadata(accessToken, msgId)
    samples.push({ from: metadata.from, subject: metadata.subject })
  }

  return samples
}

/**
 * Ensure dynamic user labels exist as Kyrra/<name> labels in Gmail
 * Returns a map of user_label.id → Gmail label ID
 * Idempotent: checks existing labels once upfront before creating
 */
export async function ensureDynamicLabels(
  accessToken: string,
  userLabels: Array<{ id: string; name: string; color: string; gmail_label_id: string | null }>,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}

  // Fetch existing Gmail labels once upfront (avoid N calls)
  const listResponse = await gmailFetch(accessToken, '/labels')
  const listData = await listResponse.json()
  const existingLabels: Array<{ id: string; name: string }> = listData.labels ?? []

  for (const ul of userLabels) {
    // If already linked to a Gmail label, use it directly
    if (ul.gmail_label_id) {
      result[ul.id] = ul.gmail_label_id
      continue
    }

    // Check if Kyrra/<name> already exists in Gmail
    const gmailName = `Kyrra/${ul.name}`
    const existing = existingLabels.find((l) => l.name === gmailName)
    if (existing) {
      result[ul.id] = existing.id
      continue
    }

    // Map user's custom color to the nearest valid Gmail palette color
    // User's color in DB stays as-is — only the Gmail API call uses palette colors
    const gmailColor = nearestGmailColor(ul.color)
    try {
      const createResponse = await gmailFetch(accessToken, '/labels', {
        method: 'POST',
        body: JSON.stringify({
          name: gmailName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          color: gmailColor,
        }),
      })

      const created = await createResponse.json()
      result[ul.id] = created.id

      // Add to cache so subsequent iterations find it
      existingLabels.push({ id: created.id, name: gmailName })
    } catch {
      // Label may have been created by a concurrent classification (race condition)
      // Re-fetch labels to find it
      const retryListResponse = await gmailFetch(accessToken, '/labels')
      const retryListData = await retryListResponse.json()
      const retryLabels: Array<{ id: string; name: string }> = retryListData.labels ?? []
      const concurrentlyCreated = retryLabels.find((l) => l.name === gmailName)

      if (concurrentlyCreated) {
        result[ul.id] = concurrentlyCreated.id
        existingLabels.push({ id: concurrentlyCreated.id, name: gmailName })
      } else {
        // Genuinely failed — re-throw
        throw new Error(`Failed to create Gmail label "${gmailName}" and it doesn't exist`)
      }
    }
  }

  return result
}

/**
 * Apply a dynamic label to a message, removing all other Kyrra labels
 * Same pattern as applyLabel() but for user-defined dynamic labels
 */
export async function applyDynamicLabel(
  accessToken: string,
  messageId: string,
  targetGmailLabelId: string,
  allGmailLabelIds: string[],
): Promise<void> {
  const labelsToRemove = allGmailLabelIds.filter((id) => id !== targetGmailLabelId)

  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      addLabelIds: [targetGmailLabelId],
      removeLabelIds: labelsToRemove,
    }),
  })
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
