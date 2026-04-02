# Story B6.1: RGPD consent minimal

Status: done

## Story

As a **user**,
I want to give consent before Kyrra processes my emails,
so that the service is legally compliant.

## Acceptance Criteria

1. **Given** user has authenticated but not yet connected Gmail **When** they visit `/connect-gmail` **Then** consent checkbox is required ✓
2. **Given** consent is granted **When** saved **Then** `consent_given=true` + `consent_at` timestamp stored in `user_settings` ✓
3. **Given** the consent form **When** rendered **Then** links to `/legal/cgu` and `/legal/privacy` are visible ✓

## Tasks / Subtasks

- [x] Task 1: Consent columns in DB (migration 021 — consent_given, consent_at, recap_consent)
- [x] Task 2: ConsentForm.client.tsx with required classification checkbox + optional recap checkbox
- [x] Task 3: saveConsent() server action with timestamp persistence
- [x] Task 4: CGU + Privacy Policy static pages at /legal/cgu and /legal/privacy
- [x] Task 5: Middleware routes /connect-gmail before Gmail OAuth

## Dev Notes

- All infrastructure was already implemented in earlier sprints
- This story was verified as complete during BMAD reconciliation 2026-04-02
- ConsentForm requires consent_given=true before enabling "Connecter Gmail" button
- Consent schema validated via Zod (saveConsentSchema in @kyrra/shared)
