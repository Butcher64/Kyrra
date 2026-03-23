import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Public routes — no auth required
  const publicRoutes = ['/login', '/auth/callback', '/token-expired', '/legal']
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  )

  // Routes that don't require Gmail integration (but do require auth)
  const noIntegrationRoutes = ['/connect-gmail', '/onboarding-progress']
  const isNoIntegrationRoute = noIntegrationRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  )

  // If Supabase env vars are not set, skip auth (graceful degradation)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
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

    if (isPublicRoute) {
      return supabaseResponse
    }

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // If user is authenticated but not on a no-integration route, check Gmail integration
    if (!isNoIntegrationRoute) {
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .eq('status', 'active')
        .maybeSingle()

      if (!integration) {
        const url = request.nextUrl.clone()
        url.pathname = '/connect-gmail'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch {
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
