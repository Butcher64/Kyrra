# Story 0.4: CI/CD Pipeline

Status: done

## Story

As a **developer**,
I want a GitHub Actions CI/CD pipeline enforcing code quality and deploy order,
So that every push is validated and deployments are safe.

## Acceptance Criteria

1. test-lint job: pnpm install → lint → check-types → PII log scan
2. migrate-db job after test-lint: supabase db push → gen types → ENUM sync guard
3. build-worker job after migrate-db (deploys first)
4. build-web job after build-worker (expand-contract enforced)
5. PII log scan blocks pipeline if email content patterns found
6. SERVICE_ROLE_KEY grep guard blocks build-web if found in apps/web

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- 4-job CI/CD pipeline: test-lint → migrate-db → build-worker → build-web
- build-web depends on build-worker (P4 expand-contract enforced)
- PII log scan with grep regex for email content in log statements
- SERVICE_ROLE_KEY guard in build-web job
- ENUM sync guard: git diff --exit-code on database.ts
- check-types script added to apps/web and apps/worker
- check-types task added to turbo.json
- All jobs use pnpm 10 + Node.js 20 + actions/cache

### File List
- .github/workflows/ci.yml (created — 4-job pipeline)
- turbo.json (modified — added check-types task)
- apps/web/package.json (modified — added check-types script)
- apps/worker/package.json (modified — added check-types script)
