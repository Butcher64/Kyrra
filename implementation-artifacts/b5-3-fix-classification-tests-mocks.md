# Story B5.3: Fix classification.test.ts mocks

Status: done

## Story

As a **developer**,
I want the classification pipeline tests to pass with the new dynamic labels architecture,
so that regressions are caught by CI.

## Acceptance Criteria

1. **Given** the classification tests **When** executed **Then** all mocks reference current imports (fetchEmailMetadata, fetchEmailBody, ensureDynamicLabels, applyDynamicLabel, prefilterEmail, buildSystemPrompt, resolveLabel, deriveLegacyResult)
2. **Given** the tests **When** run **Then** they cover prefilter → fingerprint → LLM → label resolution flow
3. **Given** the tests **When** run **Then** they use UserLabel[] mock data and deriveLegacyResult instead of hardcoded A_VOIR/FILTRE/BLOQUE
4. **Given** `pnpm test` **When** run **Then** it passes

## Tasks / Subtasks

- [x] Task 1: Rewrite classification.test.ts mocks and helpers for new architecture
- [x] Task 2: Update all 34 test assertions for dynamic labels (30 original + 4 new)
- [x] Task 3: Run tests and verify pass — 34/34 green

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List

- `apps/worker/src/classification.test.ts` (REWRITTEN) — 34 tests passing with dynamic labels architecture

### Key Changes

- Mocks: fetchEmailMetadata/Body, ensureDynamicLabels/applyDynamicLabel, prefilterEmail, buildSystemPrompt
- Supabase mock: thenable chain with user_labels default data (7 mock labels)
- Real resolveLabel/deriveLegacyResult run against mock data (not mocked)
- New tests: 3b (no labels), 7b (no credits), 7c (prefilter path)
- All assertions updated for label_id, sender_display, subject_snippet

### Change Log

- 2026-04-02: B5.3 implemented — 34/34 tests passing
