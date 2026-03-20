# Story 0.3: Shared Packages Foundation

Status: done

## Story

As a **developer**,
I want to set up the shared package with type definitions, Zod schemas, constants, and safety rules scaffold,
So that apps/web and apps/worker share consistent types from day 1.

## Acceptance Criteria

1. **Given** the monorepo from Story 0.1 **When** the developer creates the packages/shared structure **Then** `types/action-result.ts` exports ActionResult<T> and AppError
2. **Given** packages/shared **When** classification-signal.ts is created **Then** it exports ClassificationSignal type
3. **Given** packages/shared **When** integration.ts is created **Then** it exports UserIntegration and PublicIntegration types
4. **Given** packages/shared **When** constants are created **Then** `constants/classification.ts` exports CLASSIFICATION_RESULTS, CLASSIFICATION_LABELS, and SYSTEM_WHITELISTED_SENDERS
5. **Given** packages/shared **When** error constants are created **Then** `constants/errors.ts` exports ERROR_CODES
6. **Given** packages/shared **When** Zod schemas are created **Then** `schemas/` contains initial schema stubs
7. **Given** packages/shared **When** safety rules scaffold is created **Then** `rules/index.ts` exports the safety rules runner stub
8. **Given** the complete shared package **When** running tsc **Then** the package compiles and is importable as @kyrra/shared

## Tasks / Subtasks

- [ ] Task 1: Create types (AC: #1, #2, #3)
- [ ] Task 2: Create constants (AC: #4, #5)
- [ ] Task 3: Create Zod schemas stubs (AC: #6)
- [ ] Task 4: Create safety rules scaffold (AC: #7)
- [ ] Task 5: Update index.ts exports + verify tsc (AC: #8)

## Dev Notes

### Architecture Source
- [planning-artifacts/architecture.md — Implementation Patterns, Naming Patterns]
- ActionResult<T> pattern: `{ data: T; error: null } | { data: null; error: AppError }`
- ClassificationSignal: routing type, never written to DB
- Zone 1 (DB types) = snake_case, Zone 2 (app types) = camelCase

### References
- [Source: planning-artifacts/architecture.md#Implementation Patterns]
- [Source: planning-artifacts/epics.md#Story 0.3]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List

- ActionResult<T>, AppError types created
- ClassificationSignal type (routing, never DB)
- UserIntegration + PublicIntegration (token-stripped)
- CLASSIFICATION_RESULTS/LABELS/SYSTEM_WHITELISTED_SENDERS constants
- ERROR_CODES constants
- 3 Zod schemas: emailClassification, reclassifyParams, whitelistParams
- Safety Rules 0-1-2 implemented with typed runner
- tsconfig switched to Bundler moduleResolution (NodeNext requires .js extensions, incompatible with workspace protocol consumption)
- Zod v4.3.6 installed as dependency
- tsc --noEmit PASS (shared + worker)

### File List

- packages/shared/src/index.ts (rewritten — barrel exports)
- packages/shared/src/types/action-result.ts (created)
- packages/shared/src/types/classification-signal.ts (created)
- packages/shared/src/types/integration.ts (created)
- packages/shared/src/constants/classification.ts (created)
- packages/shared/src/constants/errors.ts (created)
- packages/shared/src/schemas/email-classification.ts (created)
- packages/shared/src/schemas/reclassify-params.ts (created)
- packages/shared/src/schemas/whitelist-params.ts (created)
- packages/shared/src/rules/index.ts (created)
- packages/shared/src/rules/rule-0-fingerprint-bloque-force-llm.ts (created)
- packages/shared/src/rules/rule-1-low-confidence-blocked.ts (created)
- packages/shared/src/rules/rule-2-very-low-confidence.ts (created)
- packages/shared/tsconfig.json (modified — Bundler resolution)
- packages/shared/package.json (modified — zod dependency added)
