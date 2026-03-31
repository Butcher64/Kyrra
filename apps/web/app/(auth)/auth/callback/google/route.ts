import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

// Gmail PKCE OAuth flow — SEPARATE from Supabase Auth login
// This grants gmail.modify + gmail.readonly scopes for email processing
// Tokens are stored encrypted in user_integrations table (not Supabase Auth session)

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ')

function getPublicOrigin(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = getPublicOrigin(request)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  console.log('[AUTH GMAIL] /auth/callback/google hit', {
    hasCode: !!code,
    hasState: !!state,
    origin,
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('[AUTH GMAIL] No authenticated user — redirect to /login')
    return NextResponse.redirect(`${origin}/login`)
  }

  console.log('[AUTH GMAIL] Authenticated user:', user.id.slice(0, 8))

  // Validate CSRF state parameter
  if (code && (!state || state !== user.id)) {
    console.error('[AUTH GMAIL] CSRF state mismatch', { state, userId: user.id.slice(0, 8) })
    const url = new URL('/connect-gmail', origin)
    url.searchParams.set('error', 'csrf_failed')
    return NextResponse.redirect(url.toString())
  }

  // Step 1: If no code, initiate the PKCE flow
  if (!code) {
    const redirectUri = `${origin}/auth/callback/google`
    console.log('[AUTH GMAIL] Initiating Gmail OAuth, redirectUri:', redirectUri)
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GMAIL_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: user.id, // Use user ID as state for CSRF protection
    })

    return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`)
  }

  // Step 2: Exchange code for tokens
  try {
    const redirectUri = `${origin}/auth/callback/google`
    console.log('[AUTH GMAIL] Exchanging code for Gmail tokens...')
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text()
      console.error('[AUTH GMAIL] Token exchange FAILED:', tokenResponse.status, body)
      return NextResponse.redirect(`${origin}/connect-gmail?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Get the Gmail email address for this token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const userInfo = await userInfoResponse.json()

    // Store tokens encrypted (AES-256-GCM) in user_integrations
    const { error: insertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        provider: 'gmail',
        email: userInfo.email,
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: GMAIL_SCOPES.split(' '),
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })

    if (insertError) {
      console.error('[AUTH GMAIL] Failed to store tokens:', insertError.message)
      return NextResponse.redirect(`${origin}/connect-gmail?error=storage_failed`)
    }

    console.log('[AUTH GMAIL] Tokens stored, integration active for:', userInfo.email)

    // Initialize pipeline health for this user
    await supabase
      .from('user_pipeline_health')
      .upsert({
        user_id: user.id,
        mode: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    // Create onboarding scan job (worker will pick it up)
    await supabase
      .from('onboarding_scans')
      .upsert({
        user_id: user.id,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    // Redirect to onboarding progress (scan will start)
    console.log('[AUTH GMAIL] Success — redirecting to /onboarding-progress')
    return NextResponse.redirect(`${origin}/onboarding-progress`)
  } catch (error) {
    console.error('[AUTH GMAIL] OAuth error:', error)
    return NextResponse.redirect(`${origin}/connect-gmail?error=oauth_failed`)
  }
}
