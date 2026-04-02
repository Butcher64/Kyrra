import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes — no auth required
  const publicRoutes = ['/login', '/auth/callback', '/token-expired', '/legal']
  const isPublicRoute =
    pathname === '/' ||
    publicRoutes.some((route) => pathname.startsWith(route))

  // Routes that don't require Gmail integration (but do require auth)
  const noIntegrationRoutes = ['/connect-gmail', '/onboarding-progress', '/configure-profile', '/configure-labels', '/scan-progress']
  const isNoIntegrationRoute = noIntegrationRoutes.some((route) =>
    pathname.startsWith(route),
  )

  console.log('[AUTH MW]', pathname, { isPublicRoute, isNoIntegrationRoute })

  // If Supabase env vars are not set, skip auth (graceful degradation)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('[AUTH MW] Missing Supabase env vars — redirect to /login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[AUTH MW]', pathname, { hasUser: !!user, userId: user?.id?.slice(0, 8) })

    // Public routes: let through, but redirect authenticated users from / to /dashboard
    if (isPublicRoute) {
      if (user && pathname === '/') {
        console.log('[AUTH MW] Authenticated user on / — redirect to /dashboard')
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    if (!user) {
      console.log('[AUTH MW] No user on protected route — redirect to /login')
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // If user is authenticated but not on a no-integration route, check Gmail integration + onboarding
    if (!isNoIntegrationRoute) {
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .eq('status', 'active')
        .maybeSingle()

      console.log('[AUTH MW]', pathname, { hasGmailIntegration: !!integration })

      if (!integration) {
        console.log('[AUTH MW] No Gmail integration — redirect to /connect-gmail')
        const url = request.nextUrl.clone()
        url.pathname = '/connect-gmail'
        return NextResponse.redirect(url)
      }

      // Check onboarding completion — redirect to correct step if incomplete
      const { data: settings } = await supabase
        .from('user_settings')
        .select('profile_configured')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!settings?.profile_configured) {
        console.log('[AUTH MW] Profile not configured — redirect to /configure-profile')
        const url = request.nextUrl.clone()
        url.pathname = '/configure-profile'
        return NextResponse.redirect(url)
      }

      const { data: scan } = await supabase
        .from('onboarding_scans')
        .select('labels_configured, status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!scan?.labels_configured) {
        console.log('[AUTH MW] Labels not configured — redirect to /configure-labels')
        const url = request.nextUrl.clone()
        url.pathname = '/configure-labels'
        return NextResponse.redirect(url)
      }

      if (scan.status !== 'completed') {
        console.log('[AUTH MW] Inbox scan not complete — redirect to /scan-progress')
        const url = request.nextUrl.clone()
        url.pathname = '/scan-progress'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (err) {
    console.error('[AUTH MW] Error:', err)
    // If Supabase connection fails, redirect to login on protected routes
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/token).*)',
  ],
}
