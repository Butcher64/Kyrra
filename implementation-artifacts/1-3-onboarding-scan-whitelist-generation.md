# Story 1.3: Onboarding Scan (Whitelist Generation)

Status: done

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List

- Created 2 new migrations: 013_create_whitelist.sql + 014_create_onboarding_scans.sql
- whitelist_entries table: SHA-256 hashed addresses + domains, deduplicated per user
- onboarding_scans table: tracks scan progress for real-time display
- Worker whitelist-scan.ts: hashAddress(), hashDomain(), extractRecipients(), buildWhitelistEntries()
- Worker onboarding.ts: onboardingScanLoop() — checks pending scans, processes them
- Gmail callback updated to create onboarding_scan row on connection
- Note: Actual Gmail API sent history fetch is a TODO stub (full implementation in Epic 2 when gmail.ts is created)
- Worker uses NodeNext resolution → .js import extensions required
- tsc --noEmit: PASS (worker + web)

### File List

- supabase/migrations/013_create_whitelist.sql (created)
- supabase/migrations/014_create_onboarding_scans.sql (created)
- apps/worker/src/lib/whitelist-scan.ts (created — hash utilities + scan helpers)
- apps/worker/src/onboarding.ts (created — scan loop)
- apps/web/app/(auth)/auth/callback/google/route.ts (modified — creates onboarding_scan)
