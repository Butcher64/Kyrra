import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Gmail Pub/Sub Webhook Handler
 * Receives push notifications when new emails arrive
 * Uses SECURITY DEFINER function to insert queue items (zero SERVICE_ROLE_KEY)
 *
 * Security: Google JWT verification via Web Crypto API (FR11)
 * Rate limit: 100 req/min (NFR-SEC-11)
 *
 * Source: [architecture.md — API & Communication Patterns]
 */

// ANON_KEY only — queue insertion via SECURITY DEFINER function (migration 015)
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ── Google JWT Verification (Web Crypto API — zero dependencies) ──

// Google provides JWK-format keys at this endpoint (easier than PEM certs)
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com']

// Cache JWKs with 1h TTL (Google rotates keys roughly daily)
let cachedJWKs: { keys: JsonWebKey[] } | null = null
let jwksFetchedAt = 0
const JWKS_CACHE_TTL_MS = 3_600_000

async function getGoogleJWKs(forceRefresh = false): Promise<{ keys: any[] }> {
  const now = Date.now()
  if (!forceRefresh && cachedJWKs && (now - jwksFetchedAt) < JWKS_CACHE_TTL_MS) {
    return cachedJWKs
  }

  const response = await fetch(GOOGLE_JWKS_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch Google JWKs: ${response.status}`)
  }

  cachedJWKs = await response.json()
  jwksFetchedAt = now
  return cachedJWKs!
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/**
 * Verify a Google-signed JWT from Pub/Sub push notifications
 * Uses Google's JWK endpoint + Web Crypto API (RS256)
 * Returns decoded payload if valid, null if invalid
 */
async function verifyGoogleJWT(token: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts

  // Decode header
  let header: { alg?: string; kid?: string }
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64!)))
  } catch {
    return null
  }

  if (header.alg !== 'RS256' || !header.kid) return null

  // Decode payload
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64!)))
  } catch {
    return null
  }

  // Verify issuer
  if (!GOOGLE_ISSUERS.includes(payload.iss as string)) return null

  // Verify expiration (with 60s clock skew tolerance)
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && payload.exp < now - 60) return null

  // Verify not-before
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null

  // Verify audience if configured
  const expectedAudience = process.env.GMAIL_PUBSUB_AUDIENCE
  if (expectedAudience && payload.aud !== expectedAudience) return null

  // Find matching JWK by key ID
  let jwks = await getGoogleJWKs()
  let jwk = jwks.keys.find((k: any) => k.kid === header.kid)

  if (!jwk) {
    // Key not found — force refresh (Google may have rotated keys)
    jwks = await getGoogleJWKs(true)
    jwk = jwks.keys.find((k: any) => k.kid === header.kid)
    if (!jwk) return null
  }

  // Import the JWK as a CryptoKey
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    // Verify signature
    const signatureData = base64UrlDecode(signatureB64!)
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`)

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureData,
      signedData,
    )

    return valid ? payload : null
  } catch {
    return null
  }
}

// ── Rate limiting (in-memory, per-instance) ──

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 100 // 100 req/min (NFR-SEC-11)
let rateLimitCounter = 0
let rateLimitWindowStart = Date.now()

function checkRateLimit(): boolean {
  const now = Date.now()
  if (now - rateLimitWindowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitCounter = 0
    rateLimitWindowStart = now
  }
  rateLimitCounter++
  return rateLimitCounter <= RATE_LIMIT_MAX
}

// ── Route Handler ──

export async function POST(request: Request) {
  // Rate limit check
  if (!checkRateLimit()) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  try {
    // Verify Google JWT (mandatory — FR11, architecture.md security hardening)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const jwtToken = authHeader.slice(7)
    const jwtPayload = await verifyGoogleJWT(jwtToken)

    if (!jwtPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    const body = await request.json()

    const { message } = body
    if (!message?.data) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Decode Pub/Sub message
    const decoded = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8'),
    )

    const { emailAddress, historyId } = decoded

    if (!emailAddress || !historyId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getAnonClient()

    // Use SECURITY DEFINER function — validates integration + inserts queue item
    // Zero SERVICE_ROLE_KEY in apps/web (architecture constraint F1)
    const { data, error } = await supabase.rpc('enqueue_gmail_notification', {
      p_email_address: emailAddress,
      p_history_id: historyId,
    })

    if (error) {
      console.error('Gmail webhook RPC error:', error.message)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ status: 'ignored' })
    }

    return NextResponse.json({ status: 'queued' })
  } catch (error) {
    console.error('Gmail webhook error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
