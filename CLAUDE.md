# CLAUDE.md - Kyrra Project Memory

> **Auto-update** : Mettre a jour ce fichier apres chaque decision majeure.
> **Derniere MAJ** : 2026-04-17
> **Phase actuelle** : Stabilization Sprint — Backend pipeline fixes (B8-B10, 13 stories)

## 2026-04-17 — Pipeline unblocked (P1 done)

**Root cause** : `getHistory` envoyait `historyTypes=messageAdded,labelAdded,labelRemoved`
en CSV, mais Gmail API exige des query params REPETES. Chaque cycle reconciliation
echouait avec `400 INVALID_ARGUMENT` → 0 emails classifies depuis l'onboarding.

**Fix** : `apps/worker/src/lib/gmail.ts:664-672` utilise `params.append('historyTypes', ...)` trois fois. Commit `f3c0e09`, deploy Railway `7e6109cf` SUCCESS 11:23 CEST.

**Verif** : Reconciliation loop tourne (updated_at advance toutes les 5min), plus d'erreurs 400.
User B 66ae990b-4316-43ca-ad71-61c27927af1c — watch_history_id=994140, pipeline operationnel.

**Backlog non traite** : emails recus entre onboarding (14/04) et fix (17/04) pas re-queues.
Decision deferee — si critique, scan forward via `gmail.users.messages.list`.

**Ops tool ajoute** : `scripts/bootstrap-history-id.mjs` — bootstrap manuel historyId hors worker.

---

## Quick Context

**Projet** : Kyrra - SaaS B2B de filtrage intelligent d'emails par IA
**Concept** : Pare-feu cognitif anti-prospection pour dirigeants
**Tagline** : "Faites taire le bruit. Gardez l'essentiel."
**Fondateurs** : Thomas, Hadrien, Felix
**Langue communication** : Francais | **Docs** : Anglais

---

## BMAD Framework

Ce projet utilise **BMAD v6.2.2** (officiel bmad-code-org, installe dans `Kyrra/_bmad/`).
Skills chargees automatiquement depuis `.claude/skills/` (heritees du parent).

### REGLE ABSOLUE : Toujours suivre BMAD en phase Implementation

**Ne JAMAIS coder sans passer par les workflows BMAD.** Chaque session doit :
1. Verifier l'etat du sprint en cours (`/bmad-sprint-status`)
2. Planifier le sprint si necessaire (`/bmad-sprint-planning`)
3. Traiter chaque feature/bug comme une story (`/bmad-dev-story`)
4. Faire une code review apres chaque bloc significatif (`/bmad-code-review`)
5. Mettre a jour les epics apres chaque story completee

**Contexte** : Un drift majeur a eu lieu entre 2026-03-21 et 2026-04-01 — tout le travail
(labels dynamiques, profiling, pipeline fixes, 14 commits) a ete fait hors BMAD.
Les epics-beta.md sont desynchronises du code reel. A NE PLUS REPRODUIRE.

### Phases completees (1-3)

- [x] Product Brief, PRD (86 FRs, valide 5/5), UX Design (Nordic Calm), Architecture, Epics & Stories (8 epics, 44 stories), Implementation Readiness (READY)

### Phase 4 — Implementation (en cours)

- [x] Beta Epics B0-B7 complete (33/33 stories, 2026-04-02)
- [x] feat/dynamic-labels merge dans master (PR #2, 2026-04-02)
- [x] **Audit complet projet** (2026-04-11) — 27 issues backend identifiees
- [ ] **Sprint Stabilization B8-B10** (13 stories) — **en cours**
  - B8: Pipeline Critical Fixes (5 stories) — transactions, label retry, race conditions
  - B9: Pipeline Robustness (5 stories) — timeouts, rate limiting, circuit breaker
  - B10: Test Infrastructure (3 stories) — classification, prefilter, prompt-builder tests

> Detail des stories et bugs : `planning-artifacts/epics-stabilization.md`

---

## Le Produit Kyrra

**Probleme** : Asymetrie envoi/reception emails — outils IA facilitent l'envoi massif, boites saturees
**Solution** : IA entrainee pour classifier les emails avec precision metier via labels dynamiques personnalisables
**Differentiation** : Labels IA configurables par l'utilisateur (aucun concurrent), profil user injecte dans le prompt

**Cibles MVP** : Dirigeants TPE/PME | **Cibles V2** : DRH, DSI

**Fonctionnement cle** :
- Middleware API Gmail (MVP-0) / Outlook (MVP-1)
- Dual-engine : Fingerprinting (rule-based) + LLM GPT-4o-mini (ambigus)
- Pre-filtrage rapide : metadata-only fetch, domaines connus, lazy body fetch
- Whitelist auto via scan des Sent Items (6 mois, SHA-256 hashed)
- **7 labels dynamiques par defaut** (Important, Transactionnel, Notifications, Newsletter, Prospection utile, Prospection, Spam) — personnalisables
- Prompt LLM assemble dynamiquement par utilisateur (labels + profil user)
- 3 modes : Strict / Normal / Permissive | Scan : Free 500 / Pro 10,000 / Admin illimite
- Gmail = source de verite, Supabase = replica

**Pricing** : Trial 14j → Free (30 emails/jour) → Pro 15EUR/mois → Team 19EUR/user/mois

---

## Contraintes Critiques

- **RGPD** : Zero Data Retention, hebergement EU, human-in-the-loop (quarantaine, jamais suppression directe)
- **Faux positifs** : Risque mortel — toujours surclasser en cas de doute
- **Couts IA** : ~0.001EUR/email (marginal) — GPT-4o-mini
- **Column-level security** : `user_settings` a des GRANT par colonne (migration 022 + 024). Toute nouvelle colonne updatable par le user doit etre ajoutee au GRANT.

---

## Artifacts de reference

| Document | Chemin |
|----------|--------|
| Epics beta (B0-B7) | `planning-artifacts/epics-beta.md` |
| Epics stabilization (B8-B10, bugs audit) | `planning-artifacts/epics-stabilization.md` |
| Design labels dynamiques | `docs/superpowers/specs/2026-04-01-dynamic-labels-onboarding-design.md` |

---

## Memory Update Protocol

Mettre a jour ce fichier quand :
1. Decision technique validee
2. Document majeur complete
3. Phase du projet change
4. Preference clarifiee
