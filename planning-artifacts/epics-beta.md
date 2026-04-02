---
stepsCompleted: [design, validated]
status: 'active'
createdAt: '2026-03-21'
lastReconciled: '2026-04-01'
context: 'Post-brainstorm — replaces original 44 stories marked done (scaffold only). Reconciled 2026-04-01: added B1.4-B1.9, B2.4-B2.6, B5.3 for work done outside BMAD + known bugs.'
---

# Kyrra — Beta Sprint Epics & Stories

## Context

Le brainstorming du 2026-03-21 (6 agents BMAD) a révélé que la complétion réelle est ~40%, pas 100%. Ce document définit les epics et stories pour atteindre un MVP-0 Beta testable.

## Epic List

### Epic B0: Auth & Security Fixes
Un utilisateur peut se connecter de manière sécurisée et le code est production-safe.
**Blockers résolus:** Auth flow, token encryption, PKCE, CI fix

### Epic B1: Pipeline Production-Ready
La classification fonctionne vraiment — whitelist, labels dynamiques, pré-filtrage, profil utilisateur, idempotency.
**Blockers résolus:** Whitelist check, user settings dynamiques, sanitize LLM, labels dynamiques, pré-filtrage, parsing From, DKIM
**Reste à faire:** saveLabelsConfig atomique, classification_result legacy

### Epic B2: Dashboard Fonctionnel
L'utilisateur peut voir ses stats, configurer Kyrra, et naviguer dans l'app.
**Blockers résolus:** Settings interactifs, navigation, empty states
**Reste à faire:** Compteur bloqués, loading states, page scan temps réel

### Epic B3: Trust & Feedback Loop
L'utilisateur peut corriger les erreurs et Kyrra apprend réellement.
**Blockers résolus:** Feedback sheet connecté, Gmail reclassification detection

### Epic B4: Recap Complet
Le Recap quotidien fonctionne end-to-end avec préférences.
**Blockers résolus:** Table users, recap preferences, template finalisé

### Epic B5: Tests & Observabilité
Le code est testé, le CI fonctionne, les fondateurs sont alertés.
**Blockers résolus:** Tests critiques, CI fix, monitoring alerts
**Reste à faire:** Fix tests classification.ts (mocks obsolètes)

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

### Story B1.4: Labels dynamiques (système complet)

> *Ajoutée lors de la réconciliation BMAD 2026-04-01. Travail réalisé hors BMAD le 2026-04-01 sur feat/dynamic-labels.*

As a **user**,
I want my emails classified with dynamic, customizable labels instead of 3 fixed categories,
So that the classification matches my actual workflow.

**Acceptance Criteria:**
- **Given** the user has configured labels **When** an email is classified **Then** it receives one of the user's dynamic labels (not A_VOIR/FILTRE/BLOQUE)
- **And** table `user_labels` stores id, user_id, name, description, prompt, color, gmail_label_id, is_default, position
- **And** 7 default labels: Important, Transactionnel, Notifications, Newsletter, Prospection utile, Prospection, Spam
- **And** `prompt-builder.ts` assembles system prompt dynamically from user labels + user profile
- **And** `label-resolver.ts` maps fingerprint/prefilter results to the correct dynamic label
- **And** Gmail labels are created/synced via `ensureDynamicLabels()` and applied via `applyDynamicLabel()`
- **And** `email_classifications.label_id` FK references `user_labels`
- **And** migration 023 creates `user_labels` table with RLS policies

### Story B1.5: Pré-filtrage rapide (metadata-first pipeline)

> *Ajoutée lors de la réconciliation BMAD 2026-04-01. Travail réalisé hors BMAD le 2026-04-01.*

As a **system**,
I want to classify ~80% of emails without fetching their body,
So that API calls are minimized and classification is faster.

**Acceptance Criteria:**
- **Given** an email arrives **When** the pipeline processes it **Then** metadata is fetched first (headers only, no body)
- **And** known domains (LinkedIn, SendGrid, etc.) are classified immediately via `prefilter.ts`
- **And** noreply senders are classified without body fetch (60+ SaaS domains exempted)
- **And** body is fetched lazily only when LLM classification is needed
- **And** never-exchanged senders get a different treatment path

### Story B1.6: Fix pipeline critiques (parsing, DKIM, whitelist)

> *Ajoutée lors de la réconciliation BMAD 2026-04-01. Travail réalisé hors BMAD le 2026-04-01.*

As a **user**,
I want my known contacts to never be misclassified due to technical parsing bugs,
So that I can trust Kyrra's classifications.

**Acceptance Criteria:**
- **Given** a sender like `"Name <email@domain.com>"` **When** parsed **Then** `extractEmailAddress()` strips angle brackets correctly
- **And** DKIM allowlist includes 25+ legitimate providers (amazonses, sendgrid, google, etc.) to prevent false positives
- **And** whitelist scan has no cap (was hardcoded to 100, now unlimited)
- **And** transactional/auth emails always get classification_result `A_VOIR` (never FILTRE/BLOQUE)

### Story B1.7: Profiling utilisateur dans l'onboarding

> *Ajoutée lors de la réconciliation BMAD 2026-04-01. Travail réalisé hors BMAD le 2026-04-01 sur feat/dynamic-labels.*

As a **user**,
I want to configure my profile during onboarding (role, sector, interests),
So that Kyrra's AI classification is tuned to my context.

**Acceptance Criteria:**
- **Given** the onboarding flow **When** user reaches `/configure-profile` **Then** they can set role, sector, company description, unwanted prospection types (chips), and interests
- **And** profile data is stored in `user_settings` (sector, company_description, prospection_non_sollicitee, interests, profile_configured)
- **And** migration 024 adds these columns with column-level GRANT
- **And** profile data is injected into the LLM system prompt via `buildSystemPrompt()`
- **And** onboarding flow: whitelist scan → profile → labels → inbox scan → dashboard

### Story B1.8: Fix saveLabelsConfig atomique

> *Bug connu identifié 2026-04-01.*

As a **system**,
I want label configuration saves to be atomic,
So that a failed insert doesn't leave the user with zero labels.

**Acceptance Criteria:**
- **Given** the user saves their label configuration **When** the server action executes **Then** the delete + insert is wrapped in a Supabase RPC transaction
- **And** if the insert fails, the delete is rolled back
- **And** the user never ends up with 0 labels due to a partial failure

### Story B1.9: Fix classification_result legacy

> *Bug connu identifié 2026-04-01.*

As a **system**,
I want classification_result to be derived from the dynamic label position,
So that dashboard counters and filters work correctly with the new label system.

**Acceptance Criteria:**
- **Given** an email is classified with a dynamic label **When** saved to `email_classifications` **Then** `classification_result` is derived from label position (e.g., position >= 5 → BLOQUE, position 3-4 → FILTRE, position 1-2 → A_VOIR)
- **Or** `classification_result` is deprecated and all queries use `label_id` + `user_labels.position` directly
- **And** existing dashboard queries are updated accordingly

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

### Story B2.4: Fix compteur "bloqués aujourd'hui" = 0

> *Bug connu identifié 2026-04-01.*

As a **user**,
I want the dashboard to show accurate counts of blocked/filtered emails,
So that I can see the value Kyrra provides.

**Acceptance Criteria:**
- **Given** the dashboard loads **When** it computes "bloqués aujourd'hui" **Then** it counts by `label_id` joined to `user_labels.position` (not by `classification_result = 'BLOQUE'`)
- **And** "filtrés" count uses label position thresholds instead of legacy classification_result
- **And** weekly chart data uses the same label-based counting
- **And** time saved calculation uses real filtered count

### Story B2.5: Loading states + feedback navigation

> *Bug connu identifié 2026-04-01.*

As a **user**,
I want instant visual feedback when navigating the dashboard,
So that the app feels responsive and professional.

**Acceptance Criteria:**
- **Given** a user clicks a navigation link **When** the page is loading **Then** a skeleton/loading state appears immediately (via `loading.tsx` in each route)
- **And** navigation links show an active/loading state on click (opacity or highlight)
- **And** no blank screen during page transitions
- **And** no excessive animations — reactive, not flashy

### Story B2.6: Page scan temps réel (onboarding)

> *Bug connu identifié 2026-04-01. Feedback critique de Thomas.*

As a **user**,
I want to see my emails being classified one by one during the onboarding inbox scan,
So that I understand what Kyrra is doing and feel confident in the results.

**Acceptance Criteria:**
- **Given** the inbox scan starts after label configuration **When** emails are being classified **Then** a dedicated page shows each email appearing with sender, subject, and assigned label (with color)
- **And** a progress counter shows emails processed / total
- **And** polling every 1-2s on recent classifications
- **And** when scan is complete, redirect to dashboard which is already populated with data
- **And** no generic spinner — real-time visibility is mandatory

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

### Story B5.3: Fix tests classification.ts (mocks obsolètes)

> *Bug connu identifié 2026-04-01.*

As a **developer**,
I want the classification pipeline tests to pass with the new dynamic labels architecture,
So that regressions are caught by CI.

**Acceptance Criteria:**
- **Given** the classification tests **When** executed **Then** all mocks reference the current imports (fetchEmailMetadata, fetchEmailBody, ensureDynamicLabels, applyDynamicLabel, etc.)
- **And** tests cover the pre-filter → fingerprint → LLM → label resolution flow
- **And** tests use UserLabel[] mock data instead of hardcoded A_VOIR/FILTRE/BLOQUE
- **And** `pnpm test` passes in CI

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
| FR7 | B1, B2 | B1.2, B1.4, B2.1 |
| FR8 | B1 | B1.4 (dynamic labels) |
| FR9 | B0 | B0.3 (sanitizeForLLM) |
| FR10-12 | B1 | B1.4 (label config), B1.7 (user profile) |
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
