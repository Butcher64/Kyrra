# Story B7.1: Resume Interrupted Onboarding

Status: done

## Story

As a **user**,
I want to resume onboarding from where I left off if I close the browser,
so that I don't get stuck on a broken dashboard.

## Acceptance Criteria

1. **Given** a user with Gmail integration but incomplete profile **When** they visit /dashboard **Then** redirect to /configure-profile
2. **Given** a user with profile configured but no labels **When** they visit /dashboard **Then** redirect to /configure-labels
3. **Given** a user with labels configured but incomplete scan **When** they visit /dashboard **Then** redirect to /scan-progress
4. **Given** a user with completed onboarding **When** they visit /dashboard **Then** allow through

## Tasks

- [x] Task 1: Add onboarding step detection in middleware after Gmail integration check

## Dev Notes

- No redirect loop: onboarding routes are in noIntegrationRoutes array, so the check is skipped for them
- 3 additional Supabase queries per dashboard request (cached by Supabase connection pooling)
- profile_configured field is on user_settings table (migration 024)
- labels_configured field is on onboarding_scans table (migration 014)
