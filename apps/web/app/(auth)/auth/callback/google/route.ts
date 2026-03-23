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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Step 1: If no code, initiate the PKCE flow
  if (!code) {
    const redirectUri = `${origin}/auth/callback/google`
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
      console.error('Gmail token exchange failed:', tokenResponse.status)
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
      console.error('Failed to store Gmail tokens:', insertError.message)
      return NextResponse.redirect(`${origin}/connect-gmail?error=storage_failed`)
    }

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
    return NextResponse.redirect(`${origin}/onboarding-progress`)
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    return NextResponse.redirect(`${origin}/connect-gmail?error=oauth_failed`)
  }
}
