# Story B2.5: Loading States + Navigation Feedback

Status: done

## Story

As a **user**,
I want instant visual feedback when navigating the dashboard,
so that the app feels responsive and professional.

## Acceptance Criteria

1. **Given** a user clicks a navigation link **When** the page is loading **Then** a skeleton/loading state appears immediately via `loading.tsx`
2. **Given** loading states are shown **When** rendered **Then** they match the layout structure of the target page (skeleton placeholders)
3. **Given** navigation occurs **When** complete **Then** no blank screen during transitions
4. **Given** the design **When** loading states render **Then** no excessive animations — reactive, not flashy

## Tasks / Subtasks

- [x] Task 1: Create loading.tsx for /dashboard — 2-col grid skeleton matching stats + bar chart + email cards layout
- [x] Task 2: Create loading.tsx for /emails — email list skeleton with color bars and label badges
- [x] Task 3: Create loading.tsx for /labels — 2-col grid with label card placeholders
- [x] Task 4: Create loading.tsx for /settings — stacked section cards with form placeholders

## Dev Notes

- Next.js App Router: `loading.tsx` in a route directory creates an automatic Suspense boundary
- The DashboardShell (sidebar + topbar) remains visible during transitions — only the content area swaps
- Skeleton style: gray pulse blocks matching page layout, using Tailwind `animate-pulse` + `bg-[#e4e6ed]`
- Design: Navy Serein palette, zero border-radius, font-mono labels
- Thomas feedback: "reactive, not flashy" — simple pulse skeletons, no elaborate animations

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List

- `apps/web/app/(dashboard)/dashboard/loading.tsx` (NEW)
- `apps/web/app/(dashboard)/emails/loading.tsx` (NEW)
- `apps/web/app/(dashboard)/labels/loading.tsx` (NEW)
- `apps/web/app/(dashboard)/settings/loading.tsx` (NEW)

### Change Log

- 2026-04-01: B2.5 implemented — 4 loading.tsx skeletons for all dashboard routes
