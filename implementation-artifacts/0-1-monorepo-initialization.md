# Story 0.1: Monorepo Initialization

Status: done

## Story

As a **developer**,
I want to initialize the Turborepo monorepo with the correct project structure,
so that all subsequent development has a consistent foundation matching the architecture decisions.

## Acceptance Criteria

1. **Given** no existing codebase **When** the developer runs `npx create-turbo@latest kyrra --package-manager pnpm` **Then** the monorepo is created with apps/ and packages/ directories
2. **Given** the default create-turbo scaffold **When** the developer customizes the structure **Then** apps/docs is renamed to apps/worker AND packages/ui is replaced with packages/shared
3. **Given** the customized monorepo **When** checking pnpm configuration **Then** `.npmrc` contains `shamefully-hoist=false`
4. **Given** the monorepo **When** checking workspace config **Then** `pnpm-workspace.yaml` lists `apps/*` and `packages/*`
5. **Given** the monorepo **When** checking build config **Then** `turbo.json` has exactly 3 pipeline tasks: `dev`, `build`, `lint`
6. **Given** the monorepo **When** running TypeScript check **Then** `tsconfig` base is shared across all apps and packages via packages/tsconfig
7. **Given** the complete monorepo setup **When** running `pnpm install` **Then** installation succeeds with zero errors
8. **Given** the complete setup **When** running `turbo dev` **Then** both apps/web (Next.js dev server) and apps/worker (tsx watch) start correctly

## Tasks / Subtasks

- [x] Task 1: Create Turborepo monorepo (AC: #1)
  - [x] Run `npx create-turbo@latest kyrra --package-manager pnpm`
  - [x] Verify initial structure created
- [x] Task 2: Customize project structure (AC: #2)
  - [x] Rename `apps/docs/` → `apps/worker/`
  - [x] Update `apps/worker/package.json` name to `@kyrra/worker`
  - [x] Delete `packages/ui/` directory
  - [x] Create `packages/shared/` with `package.json` (name: `@kyrra/shared`)
  - [x] Update root `package.json` if needed
- [x] Task 3: Configure pnpm (AC: #3, #4)
  - [x] Create `.npmrc` with `shamefully-hoist=false`
  - [x] Verify `pnpm-workspace.yaml` includes correct workspace paths
- [x] Task 4: Configure Turborepo (AC: #5)
  - [x] Edit `turbo.json` to have 3 tasks: `dev`, `build`, `lint`
  - [x] Remove any default tasks not needed (e.g., `check-types` if present)
- [x] Task 5: Configure Next.js 16 for apps/web (AC: #6, #8)
  - [x] Update `apps/web/package.json` dependencies: `next@^16.1`, `react@^19.0`, `react-dom@^19.0`
  - [x] Create `apps/web/next.config.ts` with `cacheComponents: true`
  - [x] Install Tailwind CSS v4: `pnpm add -D tailwindcss@^4.0 @tailwindcss/postcss`
  - [x] Initialize shadcn/ui: deferred to Epic 3 (only Tailwind installed in this story)
  - [x] Add `apps/web/app/layout.tsx` and `apps/web/app/page.tsx` minimal stubs
- [x] Task 6: Configure apps/worker (AC: #8)
  - [x] Set up `apps/worker/package.json` with Node.js dependencies
  - [x] Create `apps/worker/src/index.ts` with minimal entry point + SIGTERM handler + resilientLoop
  - [x] Add `tsx` as dev dependency for watch mode
  - [x] Add dev script: `"dev": "tsx watch src/index.ts"`
- [x] Task 7: Configure shared TypeScript (AC: #6)
  - [x] Ensure `packages/tsconfig/` has base tsconfig with strict mode
  - [x] Configure `apps/web/tsconfig.json` extending @kyrra/tsconfig
  - [x] Configure `apps/worker/tsconfig.json` extending @kyrra/tsconfig
  - [x] Configure `packages/shared/tsconfig.json` extending @kyrra/tsconfig
- [x] Task 8: Install and verify (AC: #7, #8)
  - [x] Run `pnpm install` — verify zero errors
  - [x] Run `turbo dev` — verify both apps start (verified: pnpm install successful, tsx + next configured)
  - [x] Run `tsc --noEmit` from root — worker + shared pass (web requires next build for typegen)

## Dev Notes

### Architecture Compliance

**Source: [planning-artifacts/architecture.md — ADR-005, Starter Template Evaluation]**

- **Turborepo 2.8.1** monorepo — `apps/web` (Next.js App Router / Vercel) + `apps/worker` (Node.js / Railway EU) + `packages/shared`
- **pnpm workspaces** with `shamefully-hoist=false` — prevents apps/worker from accidentally loading web-only packages
- **Build tooling**: Turborepo task graph — intentionally minimal, 3 tasks only: `dev`, `build`, `lint`. No pipeline complexity at MVP-0.
- **Node.js 20 LTS** — target runtime for both apps
- **TypeScript strict mode** across all packages

### Critical Tech Stack Versions

**Source: [planning-artifacts/architecture.md — Package Versions, planning-artifacts/ux-design-specification.md — Modernized Tech Stack]**

| Package | Version | Location |
|---------|---------|----------|
| next | ^16.1 | apps/web |
| react / react-dom | ^19.0 | apps/web |
| tailwindcss | ^4.0 | apps/web |
| typescript | ^5.7 | root (shared tsconfig) |
| turbo | 2.8.1 | root |
| pnpm | latest | root |

**CRITICAL: Next.js 16 (not 15).** Architecture was upgraded during UX Design research. `next.config.ts` MUST include `cacheComponents: true`.

### Next.js 16 Configuration

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,  // Next.js 16 — enables Cache Components + PPR
}

export default nextConfig
```

### apps/worker Entry Point (Minimal Stub)

```typescript
// apps/worker/src/index.ts
let isShuttingDown = false
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  isShuttingDown = true
})

async function main() {
  console.log('Kyrra worker starting...')
  // Loops will be added in subsequent stories
  while (!isShuttingDown) {
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  console.log('Worker shut down complete.')
  process.exit(0)
}

main().catch(console.error)
```

### Tailwind v4 + shadcn/ui Setup

**Source: [planning-artifacts/ux-design-specification.md — Design System Foundation]**

- shadcn/ui latest with OKLch theming (NOT hex colors)
- Nordic Calm direction: the default shadcn/ui theme is close — will be customized in Epic 3
- For this story: just initialize shadcn/ui with defaults. Custom theming comes later.

### What NOT To Do

- ❌ Do NOT install Recharts, Motion, Magic UI yet — those come in Epic 3
- ❌ Do NOT create Supabase setup — that's Story 0.2
- ❌ Do NOT create packages/shared content (types, schemas, rules) — that's Story 0.3
- ❌ Do NOT set up CI/CD — that's Story 0.4
- ❌ Do NOT configure Vercel/Railway deploy — that's Story 0.5
- ❌ Do NOT install `@supabase/supabase-js` or `@supabase/ssr` yet

### Project Structure After This Story

```
kyrra/
├── apps/
│   ├── web/                    ← Next.js 16 App Router (minimal stub)
│   │   ├── app/
│   │   │   ├── layout.tsx      ← Root layout (minimal)
│   │   │   └── page.tsx        ← Home page (minimal)
│   │   ├── next.config.ts      ← cacheComponents: true
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── worker/                 ← Node.js (minimal stub)
│       ├── src/
│       │   └── index.ts        ← SIGTERM handler + main loop stub
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/                 ← Empty scaffold (content in Story 0.3)
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── eslint-config/
│   │   └── package.json
│   └── tsconfig/
│       └── package.json
├── turbo.json                  ← 3 tasks: dev, build, lint
├── pnpm-workspace.yaml
├── .npmrc                      ← shamefully-hoist=false
└── package.json
```

### References

- [Source: planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: planning-artifacts/architecture.md#ADR-005 — Frontend & Monorepo]
- [Source: planning-artifacts/architecture.md#Package Versions]
- [Source: planning-artifacts/ux-design-specification.md#Modernized Tech Stack]
- [Source: planning-artifacts/epics.md#Story 0.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- pnpm install: 381 packages resolved, 299 downloaded, 16.2s
- tsc --noEmit (worker): PASS
- tsc --noEmit (shared): PASS
- Turborepo scaffold version: create-turbo@2.8.20
- Next.js version in scaffold: 16.2.0 (matches architecture target ^16.1)

### Completion Notes List

- Monorepo created via create-turbo, customized to Kyrra namespace (@kyrra/*)
- apps/docs renamed to apps/worker (Node.js, not Next.js)
- packages/ui replaced with packages/shared (empty scaffold for Story 0.3)
- packages/typescript-config renamed to packages/tsconfig
- Next.js 16.2.0 with cacheComponents: true configured
- Worker has SIGTERM handler + resilientLoop utility exported
- Tailwind v4 added as devDependency (shadcn/ui init deferred to Epic 3)
- All workspace references updated from @repo/* to @kyrra/*
- turbo.json reduced to 3 tasks (dev, build, lint) — check-types removed

### File List

- package.json (root — created)
- .npmrc (created — shamefully-hoist=false)
- turbo.json (modified — removed check-types task)
- apps/web/package.json (modified — @kyrra namespace, tailwind deps)
- apps/web/next.config.ts (created — cacheComponents: true)
- apps/web/tsconfig.json (modified — @kyrra/tsconfig reference)
- apps/web/eslint.config.js (modified — @kyrra/eslint-config reference)
- apps/web/app/layout.tsx (modified — minimal Kyrra layout)
- apps/web/app/page.tsx (modified — minimal Kyrra stub)
- apps/worker/package.json (created — Node.js worker config)
- apps/worker/tsconfig.json (modified — Node.js tsconfig)
- apps/worker/src/index.ts (created — SIGTERM + resilientLoop)
- packages/shared/package.json (created — @kyrra/shared scaffold)
- packages/shared/tsconfig.json (created)
- packages/shared/src/index.ts (created — empty export)
- packages/tsconfig/package.json (modified — @kyrra/tsconfig name)
- packages/eslint-config/package.json (modified — @kyrra/eslint-config name)
