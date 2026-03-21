# Brainstorming Beta Readiness — Kyrra

**Date:** 2026-03-21
**Participants:** Mary (Analyst), John (PM), Winston (Architect), Sally (UX), Bob (Scrum Master), Murat (Test Architect)

## Verdict Unanime

Le sprint-status affiche 44/44 stories "done" (100%). La complétion réelle est d'environ **40%**. Le code est architecturalement solide mais fonctionnellement incomplet.

## 3 Blockers Critiques (consensus 6/6 agents)

1. **Whitelist jamais consultée dans la classification** — Les contacts connus seront classifiés comme du bruit. Faux positif garanti. `classification.ts:66` TODO.
2. **User role + exposure mode hardcodés** à "CEO"/"normal" — Le LLM est aveugle au profil. `classification.ts:87-88, 115-116`.
3. **Settings page coquille vide** — Zero widget interactif. Server actions existent mais aucune UI ne les appelle.

## Findings Sécurité P0 (Winston)

- Tokens OAuth en clair (pas AES-256) — `auth/callback/google/route.ts:72-73`
- `sanitizeForLLM()` importée mais jamais appelée — risque RGPD Art.9
- `idempotency_key` avec `Date.now()` — non-idempotent, doublons possibles
- `deleteAccount` utilise `admin.deleteUser()` avec ANON_KEY — ne fonctionne pas
- CI workflow trigger sur `main` mais branche = `master` — CI ne tourne jamais
- Recap query table `users` inexistante dans les migrations
- Rate limiting webhook in-memory seulement (inefficace serverless)

## Couverture Tests (Murat)

- Actuel : 36 tests / ~5-8% couverture (seulement safety rules)
- Cible Beta : ~150 tests / ~60%
- Zero test sur : classification pipeline, fingerprinting, LLM gateway, Gmail API, webhooks, Server Actions
- Bug CI : workflow pointe sur `main`, branche est `master`

## UX Completude (Sally)

- 8/12 micro-interactions implémentées
- 3 gaps P0 : login bypass pre-OAuth, settings non interactifs, navigation gear icon manquante
- Recap email template complet et conforme
- Mobile responsive OK

## Scope Cuts Recommandés pour Beta (John)

- Stripe billing → beta gratuite
- Progressive degradation → pas de plans pendant beta
- Dashboard detailed mode → mode simple suffit
- Clean uninstall auto → manuel pour 10 users
- Referral tracking → simple `?ref=` dans URL suffit

## Roadmap 3 Sprints (John + Bob)

- Sprint 1 (1 semaine) : Pipeline fonctionnel + deploy + settings interactifs
- Sprint 2 (1 semaine) : Confiance + engagement + tests critiques
- Sprint 3 (1 semaine) : RGPD minimal + monitoring + smoke test → BETA LANCÉE

## Estimation Effort Total

- P0 Sécurité : 4-5 jours
- P1 MVP fonctionnel : 8-9 jours
- P2 Hardening : 5 jours
- Total : ~17-19 jours de travail
