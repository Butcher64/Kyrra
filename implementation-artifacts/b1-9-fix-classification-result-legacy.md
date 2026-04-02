# Story B1.9: Fix classification_result legacy

Status: done

## Story

As a **system**,
I want classification_result to be derived from the dynamic label position,
so that all queries return consistent data regardless of whether they use the legacy column or label_id.

## Acceptance Criteria

1. **Given** an email is classified with a dynamic label **When** saved **Then** `classification_result` is derived from label position (position 0-2 → A_VOIR, 3-4 → FILTRE, 5+ → BLOQUE)
2. **Given** the recap worker generates a daily email **When** it queries "À voir" emails **Then** it uses label_id + position instead of classification_result
3. **Given** the emails page loads **When** displaying tabs **Then** tabs are built from user's dynamic labels, not hardcoded A_VOIR/FILTRE/BLOQUE
4. **Given** a reclassification action **When** saving **Then** it uses the correct label_id instead of hardcoded 'A_VOIR'

## Tasks / Subtasks

- [x] Task 1: Create `deriveLegacyResult(position)` in label-resolver.ts and use in classification.ts INSERT paths
- [x] Task 2: Migrate recap.ts queries from classification_result to label_id + position
- [x] Task 3: Migrate emails/page.tsx from hardcoded tabs to dynamic labels
- [x] Task 4: Fix reclassification action to use label_id instead of hardcoded 'A_VOIR'

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List

- `apps/worker/src/lib/label-resolver.ts` (MODIFIED) — added `deriveLegacyResult(position)` function
- `apps/worker/src/classification.ts` (MODIFIED) — both INSERT paths now use `deriveLegacyResult(resolvedLabel.position)`
- `apps/worker/src/recap.ts` (MODIFIED) — queries use label_id + position instead of classification_result
- `apps/web/app/(dashboard)/emails/page.tsx` (REWRITTEN) — dynamic labels from user_labels, FK join, label colors
- `apps/web/app/(dashboard)/actions/classification.ts` (MODIFIED) — reclassify now sets label_id to user's top label

### Change Log

- 2026-04-02: B1.9 implemented — classification_result derived from label position, all reads migrated to label_id

## Dev Notes

- classification_result column is NOT NULL enum — must keep writing it for backward compat
- Derive from position: 0-2 = A_VOIR, 3-4 = FILTRE, 5+ = BLOQUE
- Long-term: drop column in V2 when all reads migrated
- Dashboard page.tsx already migrated in B2.4 (uses label_id + position)
