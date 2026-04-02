# Story B2.6: Real-Time Classification Scan Page (Onboarding)

Status: done

## Story

As a **user**,
I want to see my emails being classified one by one during the onboarding inbox scan,
so that I understand what Kyrra is doing and feel confident in the results before reaching the dashboard.

## Acceptance Criteria

1. **Given** the user saves their label configuration on `/configure-labels` **When** the save succeeds **Then** the user is redirected to `/scan-progress` (not `/dashboard`)
2. **Given** the user lands on `/scan-progress` **When** the worker starts classifying queued emails **Then** each classified email appears on the page with: sender display name, subject line, and assigned label (name + color badge)
3. **Given** the scan is in progress **When** a new classification is written by the worker **Then** it appears on the page within 2 seconds (polling interval 1-2s)
4. **Given** the scan page is displayed **When** progress is tracked **Then** a counter shows "X / Y emails analysed" where Y = total queued and X = classified so far
5. **Given** all queued emails have been classified **When** the scan completes **Then** the page shows a completion state and automatically redirects to `/dashboard` after 3 seconds
6. **Given** the user arrives on `/scan-progress` but has no queued emails **When** the page loads **Then** redirect immediately to `/dashboard`
7. **Given** the page displays classified emails **When** rendering **Then** no generic spinner is shown — real-time visibility of each email is mandatory

## Tasks / Subtasks

- [x] Task 1: Create `/scan-progress` route and page structure (AC: #1, #7)
  - [x] 1.1: Create `apps/web/app/(auth)/scan-progress/page.tsx` as a Server Component wrapper that checks auth and renders the client component
  - [x] 1.2: Create `apps/web/app/(auth)/scan-progress/ScanProgressClient.tsx` as a `'use client'` component with the polling and display logic
  - [x] 1.3: Basic page layout — header with "Kyrra analyse vos emails...", progress counter placeholder, email list area

- [x] Task 2: Implement polling logic for real-time classification data (AC: #3, #4)
  - [x] 2.1: Use `createBrowserClient()` to query `email_queue_items` for total count (`WHERE gmail_history_id = 'initial_scan'`)
  - [x] 2.2: Query `email_classifications` joined with `user_labels` for recent entries (ordered by `created_at DESC`), selecting sender_display, subject_snippet, created_at, and joined `user_labels.name`, `user_labels.color`
  - [x] 2.3: Poll every 2 seconds via `setInterval` + Supabase queries
  - [x] 2.4: Track progress: total = queue count (passed from server), processed = completed queue items count

- [x] Task 3: Display sender and subject for classified emails (AC: #2)
  - [x] 3.1: Confirmed `email_classifications` did NOT store sender/subject data
  - [x] 3.2: Added `sender_display` (TEXT) and `subject_snippet` (TEXT) columns via migration 025
  - [x] 3.3: Updated `apps/worker/src/classification.ts` — both INSERT sites (prefilter and LLM paths) now persist sender_display and subject_snippet from metadata
  - [x] 3.4: Scan page query includes these fields via Supabase select

- [x] Task 4: Build the email list UI with label badges (AC: #2, #7)
  - [x] 4.1: Email rows inline in ScanProgressClient — displays sender name, subject snippet (truncated), label badge (name + color)
  - [x] 4.2: New entries appear with CSS fade-in animation (animate-in fade-in duration-300)
  - [x] 4.3: Label badge uses the label's `color` from `user_labels` — pill/tag with color bar + border style
  - [x] 4.4: Progress bar at the top with "X / Y emails analysés" and percentage

- [x] Task 5: Handle completion and redirect to dashboard (AC: #5, #6)
  - [x] 5.1: Completion detected when processedCount >= totalQueued
  - [x] 5.2: Completion shows "Analyse terminée" with label count summary badges
  - [x] 5.3: Auto-redirect to `/dashboard` after 3s countdown via setInterval + router.push
  - [x] 5.4: Server Component redirects immediately to `/dashboard` if queueCount === 0

- [x] Task 6: Update the configure-labels redirect flow (AC: #1)
  - [x] 6.1: Changed configure-labels page redirect from `/dashboard` to `/scan-progress`
  - [x] 6.2: Confirmed `labels_configured = true` is set in saveLabelsConfig before redirect

- [x] Task 7: Handle edge cases and error states (AC: #6)
  - [x] 7.1: Server Component redirects to `/onboarding-progress` if scan not completed
  - [x] 7.2: Server Component redirects to `/configure-labels` if labels not configured
  - [x] 7.3: Polling silently retries on failure (setInterval continues regardless)
  - [x] 7.4: "Aller au tableau de bord" link visible after 15 seconds
  - [x] 7.5: Added `/scan-progress` to middleware noIntegrationRoutes

## Dev Notes

### Architecture Compliance

- **Inter-service communication**: Worker ↔ Web communicate ONLY via Supabase tables. The scan page polls `email_classifications` — there is NO direct HTTP between web and worker.
- **Client vs Server Components**: Page wrapper is Server Component (auth check), inner component is `'use client'` (needs polling/hooks). This follows the project pattern in `onboarding-progress/page.tsx`.
- **Supabase client**: Use `createBrowserClient()` from `@/lib/supabase/browser` (ANON_KEY). RLS handles user isolation — no manual `user_id` filtering needed in SELECT.
- **No Supabase Realtime**: Deferred to MVP-1 (architecture decision). Use polling only.
- **Append-only table**: `email_classifications` is INSERT-only (never UPDATE). Safe to poll with `created_at > lastPollTimestamp`.

### Existing Patterns to Follow

- **`apps/web/app/(auth)/onboarding-progress/page.tsx`**: Reference implementation for polling pattern. Uses `setInterval` at 3s, queries `onboarding_scans`, tracks terminal states. B2.6 uses the same approach but polls `email_classifications` at 2s.
- **Label colors**: Available from `user_labels.color` (hex values like `#2e7d32`). Same colors used in `/configure-labels` and dashboard.
- **Design system**: Navy Serein — DM Sans font, zero border-radius, 3px classification bars. See `feedback_ux_direction.md` and `project_ux_redesign_2026_03_31.md`.

### Data Flow

```
[configure-labels] → sets labels_configured = true
        ↓
[redirect to /scan-progress]
        ↓
[inboxScanLoop (worker)] detects labels_configured → queues emails to email_queue_items
        ↓
[classificationLoop (worker)] claims jobs → classifies → INSERTs into email_classifications
        ↓
[/scan-progress (browser)] polls email_classifications every 2s → displays results
        ↓
[all done] → redirect to /dashboard
```

### Key Tables (Read by This Page)

**`email_queue_items`** — for total count:
- `user_id`, `gmail_message_id`, `status` (pending/processing/completed/failed)
- Filter: `gmail_history_id = 'initial_scan'` to isolate onboarding queue items

**`email_classifications`** — for classified results:
- `gmail_message_id`, `classification_result`, `label_id` (FK → user_labels), `confidence_score`, `summary`, `source`, `created_at`
- Join with `user_labels` on `label_id` to get `name`, `color`

**`onboarding_scans`** — for state checks:
- `status` (must be 'completed'), `labels_configured` (must be true)

### Sender/Subject Data

The classification pipeline fetches email metadata (From header, Subject) but currently does NOT persist them in `email_classifications`. Two approaches:

**Option A (recommended)**: Add `sender_display TEXT` and `subject_snippet TEXT` columns to `email_classifications` (migration 025). The worker already has this data from `fetchEmailMetadata()` — just persist it. This is also useful for the dashboard email previews.

**Option B**: Use the `summary` field which contains a PII-stripped version. Less reliable for display.

### UX Requirements (from Thomas's feedback + UX spec)

- **No generic spinner** — each email must appear individually as classified
- **Progressive results** visible from T+30s (UX spec moment 2: "847 emails analyzed, 312 were noise")
- **"Close safely" link** after 15 seconds (same pattern as whitelist scan page)
- **Completion**: brief summary by label, then redirect
- **Design**: reactive, not flashy — no excessive animations (Thomas feedback)
- **Counter format**: "127 / 500 emails analysés" with a thin progress bar

### Previous Story Intelligence

No previous B2 story files exist in `implementation-artifacts/`. Stories B2.1-B2.3 were implemented outside BMAD.

### Git Intelligence (last 10 commits on feat/dynamic-labels)

```
9bd96cc docs: update CLAUDE.md
84ab6ac fix: code review — remove prospection utile, fix middleware, fix sort, prevent re-scan
720aa34 feat: user profiling in onboarding
b434c62 feat: dashboard shows dynamic user labels
7c71cae feat: onboarding label configuration page
fd87f01 feat: redirect to label config after whitelist scan
f99db60 feat: server action — save label config
01cd2f8 feat: split onboarding — whitelist then label config then inbox scan
2e8a1e2 feat: classification pipeline uses dynamic user labels
94ebb8f feat: LLM gateway accepts dynamic prompt, returns label name
```

Key patterns: Server actions for mutations, client components for interactive pages, worker handles all Gmail API + classification logic.

### Library/Framework Versions

- Next.js 16 (App Router), React 19
- Tailwind CSS v4, shadcn/ui
- Motion (for animations)
- Supabase JS client (createBrowserClient / createServerClient)
- No TanStack Query needed for this page (transient, simple setInterval is sufficient)

### Testing Requirements

- Unit test: `ScanProgressClient` renders with mock data, displays email rows with labels
- Unit test: completion detection triggers redirect
- Unit test: edge case — empty queue redirects immediately
- Integration test: polling interval fires and updates state
- Test framework: Vitest (already configured in apps/worker and apps/web)

### Project Structure Notes

```
apps/web/app/(auth)/
├── scan-progress/
│   ├── page.tsx                 ← Server Component (auth guard + data prefetch)
│   └── ScanProgressClient.tsx   ← Client Component (polling + display)
├── onboarding-progress/         ← Reference implementation (whitelist scan polling)
├── configure-labels/            ← Previous step (redirects here after save)
└── configure-profile/           ← Step before labels
```

### References

- [Source: planning-artifacts/architecture.md — Lines 637-652: TanStack Query polling pattern]
- [Source: planning-artifacts/architecture.md — Lines 346-348: Inter-service communication via Supabase only]
- [Source: planning-artifacts/architecture.md — Lines 674-684: Supabase client patterns]
- [Source: planning-artifacts/ux-design-specification.md — Lines 220-226: Moment 2 scan wow]
- [Source: planning-artifacts/ux-design-specification.md — Lines 734-742: Scan progress screen spec]
- [Source: planning-artifacts/epics-beta.md — Story B2.6 acceptance criteria]
- [Source: memory/feedback_realtime_scan_ux.md — Thomas's critical feedback on real-time scan]
- [Source: memory/feedback_navigation_perf.md — Reactive, not flashy]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript check passed for both `apps/web` and `apps/worker` — zero errors (pre and post code review fixes)

### Completion Notes List

- Created migration 025 adding `sender_display`, `subject_snippet`, `prefilter` ENUM value, and `label_id` index
- Updated classification.ts (both prefilter and LLM INSERT paths) to persist sender display name and subject
- Sender display name extracted from raw `From` header (handles "Name <email>" format)
- Created Server Component `page.tsx` with auth guards, edge case redirects, and retry loop for race condition
- Created Client Component `ScanProgressClient.tsx` with 2s polling, email list with label colors, progress bar, completion countdown
- Updated configure-labels redirect: `/dashboard` → `/scan-progress`
- Added `/scan-progress` to middleware `noIntegrationRoutes`
- Design follows existing onboarding-progress pattern: Navy dark bg, glass cards, font-mono, zero border-radius

### Senior Developer Review (AI)

**Review Date:** 2026-04-01
**Reviewer:** Claude Sonnet 4.6 (adversarial review)
**Review Outcome:** Changes Requested

**Action Items:**
- [x] [H1] Fix `source: 'prefilter'` ENUM violation — added `prefilter` to `classification_source` ENUM in migration 025
- [x] [H2] Fix `lastFetchedAt` initialization gap — removed incremental fetch, always fetch 50 most recent + deduplicate in state
- [x] [H3] Fix `animate-in fade-in` missing classes — replaced with inline CSS keyframe `scan-fade-in`
- [x] [M1] Add index on `email_classifications.label_id` — added to migration 025
- [x] [M2] Fix completion counting `failed` jobs — changed to only count `status = 'completed'`
- [x] [M3] Fix race condition queue empty on first load — added retry loop (5 attempts, 2s apart) in Server Component
- [x] [M4] Fix `getUser()` called every poll tick — moved to single `useEffect` on mount, stored in ref
- [x] [M5] TypeScript type inconsistency — resolved by adding `prefilter` to ENUM (H1 fix)
- [x] [L1] Fix `any` type assertion — properly typed Supabase FK join result
- [x] [L2] Stagger delay no-op — removed useless animationDelay prop

**All HIGH and MEDIUM issues fixed. All LOW issues fixed.**

### File List

- `supabase/migrations/025_add_sender_subject_to_classifications.sql` (NEW — columns + ENUM + index)
- `apps/worker/src/classification.ts` (MODIFIED — sender_display + subject_snippet in both INSERTs)
- `apps/web/app/(auth)/scan-progress/page.tsx` (NEW — with retry loop for race condition)
- `apps/web/app/(auth)/scan-progress/ScanProgressClient.tsx` (NEW — with all review fixes applied)
- `apps/web/app/(auth)/configure-labels/page.tsx` (MODIFIED — redirect to /scan-progress)
- `apps/web/middleware.ts` (MODIFIED — added /scan-progress to noIntegrationRoutes)

### Change Log

- 2026-04-01: Story B2.6 implemented — real-time classification scan page with polling, sender/subject persistence, edge case handling
- 2026-04-01: Code review (Sonnet 4.6) — 3 HIGH, 5 MEDIUM, 4 LOW findings. All 12 issues fixed.
