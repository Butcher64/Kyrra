import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getPublicOrigin(request: Request): string {
  // Use NEXT_PUBLIC_APP_URL if set, otherwise try to detect from headers
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

  console.log('[AUTH] /auth/callback hit', {
    hasCode: !!searchParams.get('code'),
    next: searchParams.get('next'),
    origin,
    url: request.url,
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('[AUTH] Missing Supabase env vars — redirecting to /login')
    return NextResponse.redirect(`${origin}/login?error=config_missing`)
  }

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/connect-gmail'

  // ── Step 2: Exchange authorization code for session ──
  if (code) {
    console.log('[AUTH] Exchanging code for session...')
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AUTH] Code exchange FAILED:', error.message, error.status)
      // Do NOT fall through to signInWithOAuth — that creates an infinite loop
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
    }

    console.log('[AUTH] Session created — redirecting to:', next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── Step 1: Initiate Google OAuth (no code present) ──
  // Preserve the `next` param through the Supabase→Google→callback chain
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`
  console.log('[AUTH] Initiating Google OAuth, redirectTo:', redirectTo)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    console.error('[AUTH] signInWithOAuth FAILED:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  console.log('[AUTH] Redirecting to Google OAuth URL')
  return NextResponse.redirect(data.url)
}
