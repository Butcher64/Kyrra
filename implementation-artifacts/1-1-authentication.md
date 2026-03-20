# Story 1.1: Authentication (Supabase Auth + Google OAuth)

Status: done

## Story

As a **user**,
I want to sign up and log in to Kyrra using my Google account,
So that I can access the dashboard without creating a separate password.

## Acceptance Criteria

1. User navigates to /login → sees "Se connecter avec Google" button
2. Click redirects to Google OAuth → Supabase Auth creates session
3. Successful auth → redirect to /(dashboard)
4. supabase.auth.getUser() returns authenticated user on protected routes
5. (dashboard)/layout.tsx redirects unauthenticated users to /login
6. Auth error messages are uniform (prevent user enumeration)
7. Middleware refreshes session + protects routes

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List

- @supabase/ssr v0.9.0 + @supabase/supabase-js v2.99.3 installed
- Server client (lib/supabase/server.ts): ANON_KEY only, cookie-based sessions
- Browser client (lib/supabase/browser.ts): ANON_KEY only
- Middleware: session refresh + auth guard (getUser() not getSession())
- Login page: Server Component, redirects if already authenticated
- Auth callback: handles both OAuth initiation and code exchange
- Dashboard layout: protected, redirects to /login if no user
- Dashboard page: minimal stub showing user email (Nordic Calm design in Epic 3)
- Root page.tsx removed — dashboard route group handles /
- tsconfig paths: @/* alias configured
- tsc --noEmit: PASS

### File List

- apps/web/lib/supabase/server.ts (created — server client ANON_KEY)
- apps/web/lib/supabase/browser.ts (created — browser client ANON_KEY)
- apps/web/middleware.ts (created — session refresh + auth guard)
- apps/web/app/(auth)/login/page.tsx (created — Google login button)
- apps/web/app/(auth)/auth/callback/route.ts (created — OAuth flow)
- apps/web/app/(dashboard)/layout.tsx (created — protected layout)
- apps/web/app/(dashboard)/page.tsx (created — minimal dashboard stub)
- apps/web/app/page.tsx (deleted — replaced by dashboard route group)
- apps/web/tsconfig.json (modified — added @/* path alias)
- apps/web/package.json (modified — supabase deps added by pnpm)
