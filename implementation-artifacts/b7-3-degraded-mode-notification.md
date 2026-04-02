# Story B7.3: Degraded Mode Notification

Status: done

## Story

As a **user**,
I want to see when Kyrra is operating in degraded mode,
so that I understand if classification quality may be reduced.

## Acceptance Criteria

1. **Given** user_pipeline_health.mode = 'degraded' **When** dashboard loads **Then** TopBar shows orange pulsing dot + "mode simplifié"
2. **Given** mode = 'active' **When** dashboard loads **Then** TopBar shows green dot + "actif"
3. **Given** mode = 'paused' **When** dashboard loads **Then** TopBar shows orange dot + "pausé"

## Tasks

- [x] Task 1: Fix layout.tsx type cast to include 'degraded'
- [x] Task 2: Update TopBar status display for degraded state
- [x] Task 3: Verify DashboardShell prop type includes 'degraded'
