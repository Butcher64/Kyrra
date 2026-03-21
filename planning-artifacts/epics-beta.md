---
stepsCompleted: [design, validated]
status: 'active'
createdAt: '2026-03-21'
context: 'Post-brainstorm — replaces original 44 stories marked done (scaffold only)'
---

# Kyrra — Beta Sprint Epics & Stories

## Context

Le brainstorming du 2026-03-21 (6 agents BMAD) a révélé que la complétion réelle est ~40%, pas 100%. Ce document définit les epics et stories pour atteindre un MVP-0 Beta testable.

## Epic List

### Epic B0: Auth & Security Fixes
Un utilisateur peut se connecter de manière sécurisée et le code est production-safe.
**Blockers résolus:** Auth flow, token encryption, PKCE, CI fix

### Epic B1: Pipeline Production-Ready
La classification fonctionne vraiment — whitelist consultée, profil utilisateur lu, idempotency correcte.
**Blockers résolus:** Whitelist check, user settings dynamiques, sanitize LLM

### Epic B2: Dashboard Fonctionnel
L'utilisateur peut voir ses stats, configurer Kyrra, et naviguer dans l'app.
**Blockers résolus:** Settings interactifs, navigation, empty states

### Epic B3: Trust & Feedback Loop
L'utilisateur peut corriger les erreurs et Kyrra apprend réellement.
**Blockers résolus:** Feedback sheet connecté, Gmail reclassification detection

### Epic B4: Recap Complet
Le Recap quotidien fonctionne end-to-end avec préférences.
**Blockers résolus:** Table users, recap preferences, template finalisé

### Epic B5: Tests & Observabilité
Le code est testé, le CI fonctionne, les fondateurs sont alertés.
**Blockers résolus:** Tests critiques, CI fix, monitoring alerts

### Epic B6: RGPD & Beta Launch
Conformité minimale + smoke test + lancement beta.
**Blockers résolus:** Consent, clean uninstall, CGU, smoke test E2E

---

## Epic B0: Auth & Security Fixes

### Story B0.1: Fix CI branch + add test step

As a **developer**,
I want CI to actually run on our branch and execute tests,
So that regressions are caught before deployment.

**Acceptance Criteria:**
- **Given** the workflow triggers on `branches: [main]` **When** our branch is `master` **Then** fix to trigger on `master` (or rename branch to `main`)
- **And** add `pnpm run test` step in `test-lint` job before type-check
- **And** all 36 existing tests pass in CI
- **And** CI runs on every push and PR

### Story B0.2: Fix PKCE OAuth flow + token encryption

As a **user**,
I want my Gmail tokens stored securely,
So that my email access is protected.

**Acceptance Criteria:**
- **Given** the Gmail PKCE callback **When** tokens are received **Then** they are AES-256 encrypted before storage in `user_integrations`
- **And** a `crypto.ts` module in `apps/web/lib/` handles encrypt/decrypt with `ENCRYPTION_KEY` env var
- **And** the PKCE flow uses proper `code_verifier`/`code_challenge` (not just `state: user.id`)
- **And** the worker decrypts tokens before Gmail API calls

### Story B0.3: Fix deleteAccount + sanitizeForLLM + idempotency

As a **developer**,
I want all P0 security bugs fixed,
So that the codebase is production-safe.

**Acceptance Criteria:**
- **Given** `deleteAccount()` uses `admin.deleteUser()` with ANON_KEY **When** called **Then** it fails. Fix: use a SECURITY DEFINER function or Supabase Edge Function for account deletion
- **And** `sanitizeForLLM()` is called before passing content to LLM in `classification.ts` (currently imported but never called)
- **And** `idempotency_key` uses `gmail_message_id` only (remove `Date.now()` suffix)
- **And** CSP + security headers configured in `next.config.ts`

### Story B0.4: Fix login flow → connect-gmail

As a **user**,
I want to see the pre-OAuth reassurance screen before Google asks for permissions,
So that I feel confident granting access.

**Acceptance Criteria:**
- **Given** a new user clicks "Se connecter avec Google" on `/login` **When** they are not yet connected to Gmail **Then** redirect to `/connect-gmail` (pre-OAuth screen) instead of directly to Google OAuth
- **And** returning users (already have `user_integrations` active) go directly to dashboard

---

## Epic B1: Pipeline Production-Ready

### Story B1.1: Whitelist check in classification

As a **user**,
I want emails from my known contacts to never be filtered,
So that I don't get false positives on important emails.

**Acceptance Criteria:**
- **Given** an email arrives from a whitelisted address **When** the pipeline processes it **Then** classification is skipped entirely (no Kyrra label applied)
- **And** domain-level match: if sender domain is whitelisted, never classify as BLOQUE (downgrade to A_VOIR)
- **And** SHA-256 hash comparison against `whitelist_entries` table
- **And** unit tests: exact match, domain match, no match, system whitelist, empty whitelist

### Story B1.2: Dynamic user settings in classification

As a **user**,
I want my exposure mode and role to affect classification,
So that Kyrra adapts to my context.

**Acceptance Criteria:**
- **Given** the classification loop processes an email **When** it calls the LLM **Then** it reads `user_settings.exposure_mode` and `user_settings.user_role` from DB (not hardcoded)
- **And** Strict mode: confidence <80% → A_VOIR (instead of <60%)
- **And** Permissive mode: confidence <40% → A_VOIR (instead of <60%)
- **And** if no `user_settings` row exists, defaults to role='CEO', mode='normal'

### Story B1.3: Fix idempotency + call sanitizeForLLM

As a **system**,
I want email processing to be idempotent and RGPD-safe,
So that retries don't create duplicates and PII is protected.

**Acceptance Criteria:**
- **Given** an email has already been classified **When** it's processed again **Then** skip (check existing classification before processing)
- **And** `idempotency_key` = `gmail_message_id` (no `Date.now()`)
- **And** `sanitizeForLLM(content)` is called before passing to LLM gateway
- **And** `increment_usage_counter()` is called for Free plan users before classification

---

## Epic B2: Dashboard Fonctionnel

### Story B2.1: Settings page interactive

As a **user**,
I want to configure my Kyrra experience from the settings page,
So that I control how emails are filtered.

**Acceptance Criteria:**
- **Given** user navigates to `/settings` **When** the page loads **Then** ExposureModePills component is displayed with current mode selected (from DB)
- **And** changing mode calls `updateExposureMode` server action + shows toast confirmation
- **And** Recap toggle (on/off) is displayed with current state
- **And** changing Recap preference calls `updateNotifications` server action
- **And** all form interactions give immediate feedback (toast)

### Story B2.2: Navigation + gear icon + empty states

As a **user**,
I want to navigate between dashboard and settings easily,
So that I don't need to know URLs.

**Acceptance Criteria:**
- **Given** user is on dashboard **When** they look for settings **Then** a gear icon is visible top-right
- **And** clicking gear navigates to `/settings`
- **And** settings has a "← Retour au tableau de bord" link
- **And** dashboard shows "Kyrra surveille votre boîte. Le premier rapport arrive bientôt." when zero classifications
- **And** dashboard shows "Rien à signaler. Votre boîte est calme." when zero "À voir" today

### Story B2.3: Trust score real + recap table fix

As a **developer**,
I want the dashboard to show real data,
So that users see accurate information.

**Acceptance Criteria:**
- **Given** the dashboard displays Trust score **When** calculated **Then** it uses `(1 - reclassification_rate_7d) * 100` (not hardcoded "94%")
- **And** the Recap worker queries `user_integrations` + `user_settings` instead of non-existent `users` table
- **And** exposure mode StatCard reads from `user_settings` (not hardcoded "Normal")

---

## Epic B3: Trust & Feedback Loop

### Story B3.1: Feedback sheet connected to backend

As a **user**,
I want my feedback on misclassifications to be saved,
So that Kyrra can learn from my corrections.

**Acceptance Criteria:**
- **Given** user submits feedback via FeedbackSheet **When** they select an option **Then** feedback is saved to a `classification_feedback` table (new migration)
- **And** if "Whitelist sender" selected, sender is added to `whitelist_entries`
- **And** the feedback link disappears after submission

### Story B3.2: Gmail reclassification detection + learn banner

As a **user**,
I want Kyrra to notice when I move emails in Gmail,
So that my Gmail actions teach Kyrra too.

**Acceptance Criteria:**
- **Given** reconciliation loop detects a Kyrra label removed in Gmail **When** user visits dashboard **Then** HelpKyrraLearnBanner appears
- **And** banner is dismissible (×) + CTA "Expliquer" opens FeedbackSheet
- **And** dismissing records implicit signal without explicit feedback
- **And** new migration for `label_change_signals` table

---

## Epic B4: Recap Complet

### Story B4.1: Fix recap data queries + preferences

As a **user**,
I want the Recap to work end-to-end with my preferences,
So that I receive my "coffee moment" daily.

**Acceptance Criteria:**
- **Given** the recap cron runs **When** generating HTML **Then** it queries `user_integrations` + `user_settings` (not non-existent `users` table)
- **And** respects `recap_enabled` and `recap_frequency` from `user_settings`
- **And** first-of-month Recap includes monthly value stats (FR52)
- **And** recap tokens are generated for each "À voir" email (FR85 in-email reclassification)

### Story B4.2: 1h post-signup email

As a **user**,
I want to receive an email 1 hour after signup confirming the scan results,
So that I know Kyrra is active during the Friday→Monday gap.

**Acceptance Criteria:**
- **Given** onboarding scan completes **When** 1 hour passes **Then** email sent via Postmark with scan results + "Premier Recap demain matin"
- **And** email uses same Postmark integration as Recap

---

## Epic B5: Tests & Observabilité

### Story B5.1: Critical unit tests (fingerprinting + pipeline + PII)

As a **developer**,
I want tests on the critical path,
So that regressions are caught before they reach users.

**Acceptance Criteria:**
- **Given** the fingerprinting engine **When** tested **Then** 25+ tests cover: 10 tool signatures, 3 domains, 9 subject patterns, null case, layer priority
- **And** PII stripper: 20+ tests cover all regex patterns + Art.9 patterns
- **And** classification pipeline integration test with mocked Supabase/Gmail/LLM
- **And** `pnpm test` in CI passes with >60% coverage on packages/shared + key worker modules
- **And** vitest installed in `apps/worker`

### Story B5.2: Monitoring alerts for founders

As a **founder**,
I want to be alerted when something goes wrong,
So that I can react before users notice.

**Acceptance Criteria:**
- **Given** the monitoring cron runs hourly **When** anomalies are detected **Then** email sent to ADMIN_USER_IDS via Postmark
- **And** alerts for: token revocations, reclassification rate >10%, reconciliation gap >10min, LLM errors >5%
- **And** worker healthcheck endpoint `/health` for Railway

---

## Epic B6: RGPD & Beta Launch

### Story B6.1: RGPD consent minimal

As a **user**,
I want to give consent before Kyrra processes my emails,
So that the service is legally compliant.

**Acceptance Criteria:**
- **Given** user has authenticated but not yet connected Gmail **When** they visit `/connect-gmail` **Then** consent checkbox is required: "J'autorise Kyrra à classifier mes emails par IA"
- **And** consent timestamp stored in `user_settings`
- **And** link to CGU + Privacy Policy (static pages)

### Story B6.2: Clean uninstall flow

As a **user**,
I want to remove Kyrra completely from my Gmail,
So that my inbox returns to its pre-Kyrra state.

**Acceptance Criteria:**
- **Given** user clicks "Désinstaller Kyrra" in settings **When** confirmed **Then** all Kyrra labels removed from Gmail (using `deleteKyrraLabels()` from gmail.ts)
- **And** Gmail watch stopped
- **And** OAuth revoked
- **And** Account data deleted (ON DELETE CASCADE)
- **And** redirect to `/login` with message "Votre boîte est restaurée"

### Story B6.3: CGU + Privacy Policy pages

As a **user**,
I want to read the Terms of Service and Privacy Policy,
So that I understand how my data is handled.

**Acceptance Criteria:**
- **Given** user navigates to `/legal/cgu` or `/legal/privacy` **Then** static pages display the legal text
- **And** link accessible from Settings and from consent screen

### Story B6.4: Smoke test E2E

As a **founder**,
I want to validate the complete flow before inviting beta testers,
So that we know the product works end-to-end.

**Acceptance Criteria:**
- **Given** a Playwright test script **When** executed **Then** it runs: login → connect Gmail → wait scan → check dashboard → reclassify → verify Gmail label changed
- **And** uses a test Gmail account (not personal)
- **And** documented in README: "How to run the smoke test"
- **And** all assertions pass

---

## FR Coverage Map (Beta Epics)

| FR | Epic | Story |
|----|------|-------|
| FR7 | B1, B2 | B1.2, B2.1 |
| FR9 | B0 | B0.3 (sanitizeForLLM) |
| FR20-21 | B0 | B0.4 |
| FR27-28 | B1 | B1.1 |
| FR29 | B2 | B2.1 (whitelist in settings) |
| FR30 | B2 | B2.1, B2.2 |
| FR31 | B6 | B6.2 |
| FR34 | Deferred | Dashboard detailed mode (post-beta) |
| FR38 | B2 | B2.1 |
| FR43-44 | Deferred | Confidence display + rationale (post-beta) |
| FR45 | Deferred | Learning tracking (post-beta) |
| FR46 | B3 | B3.1 |
| FR47 | B3 | B3.2 |
| FR50-55 | B4 | B4.1 |
| FR56-60 | Deferred | Win-back, re-engagement (post-beta) |
| FR61-68 | Deferred | Stripe, billing, referral (post-beta) |
| FR69-70 | B6 | B6.1, B6.3 |
| FR77 | B5 | B5.2 |
| FR84 | B6 | B6.2 |
| FR85 | B4 | B4.1 (recap tokens) |

## Dependency Flow

```
Epic B0 (Auth & Security)
  └→ Epic B1 (Pipeline Production-Ready)
       ├→ Epic B2 (Dashboard Fonctionnel)
       ├→ Epic B3 (Trust & Feedback)
       └→ Epic B4 (Recap Complet)
            └→ Epic B5 (Tests & Observabilité)
                 └→ Epic B6 (RGPD & Beta Launch)
```

## Definition of Done (Beta Quality)

1. Code complet : zero TODO pour cette story
2. Tests : fonctions métier testées (unit + edge cases)
3. Pas de hardcoding : valeurs dynamiques lues depuis DB
4. Sécurité : zero SECRET dans apps/web, PII scan passe, Zod validation
5. UI : Responsive 375px+, WCAG AA, prefers-reduced-motion
6. CI passe : lint + types + tests
7. Deployable : Docker build réussit
