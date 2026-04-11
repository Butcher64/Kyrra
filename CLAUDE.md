# CLAUDE.md - Kyrra Project Memory

> **Auto-update** : Mettre a jour ce fichier apres chaque decision majeure.
> **Derniere MAJ** : 2026-04-11
> **Phase actuelle** : Stabilization Sprint — Backend pipeline fixes (B8-B10, 13 stories)

---

## Quick Context

**Projet** : Kyrra - SaaS B2B de filtrage intelligent d'emails par IA
**Concept** : Pare-feu cognitif anti-prospection pour dirigeants
**Tagline** : "Faites taire le bruit. Gardez l'essentiel."
**Nom** : Du nordique ancien "Al Kyrra" (tout est calme) / "Kyrro" (silence profond)
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
- [x] Product Brief (complete)
- [x] PRD (complete — 86 FRs, version post-validation + edits)
- [x] Validate PRD (complete — 5/5 Excellent, Pass, 2026-03-16)
- [x] UX Design (complete — 14 steps, Nordic Calm direction, 2026-03-19)
- [x] Architecture (complete — 8 steps, 28 validations, 2026-03-17)
- [x] Epics & Stories (complete — 8 epics, 44 stories, 84/86 FRs, 2026-03-19)
- [x] Check Implementation Readiness (complete — READY, 0 critical, 0 major, 2 minor, 2026-03-20)

### Phase 4 — Implementation (en cours)
- [x] Beta Epics B0-B7 complete (33/33 stories, 2026-04-02)
- [x] feat/dynamic-labels merge dans master (PR #2, 2026-04-02)
- [x] Reconciliation BMAD completee (2026-04-01)
- [x] **Audit complet projet** (2026-04-11) — 4 agents paralleles, 27 issues backend identifiees
- [ ] **Sprint Stabilization B8-B10** (13 stories) — en cours
  - B8: Pipeline Critical Fixes (5 stories) — transactions, label retry, race conditions
  - B9: Pipeline Robustness (5 stories) — timeouts, rate limiting, circuit breaker
  - B10: Test Infrastructure (3 stories) — classification, prefilter, prompt-builder tests

---

## Le Produit Kyrra

**Probleme** : Asymetrie envoi/reception emails — outils IA facilitent l'envoi massif, boites saturees
**Solution** : IA entrainee pour classifier les emails avec precision metier via labels dynamiques personnalisables
**Differentiation** : Labels IA configurables par l'utilisateur (aucun concurrent), profil user injecte dans le prompt

**Cibles MVP** : Dirigeants TPE/PME (decideurs directs, cycle court)
**Cibles V2** : DRH, DSI

**Fonctionnement cle** :
- Middleware API Gmail (MVP-0) / Outlook (MVP-1)
- Dual-engine : Fingerprinting (rule-based) + LLM GPT-4o-mini (ambigus)
- Pre-filtrage rapide : metadata-only fetch, domaines connus, lazy body fetch
- Whitelist auto via scan des Sent Items (6 mois, SHA-256 hashed)
- **7 labels dynamiques par defaut** (Important, Transactionnel, Notifications, Newsletter, Prospection utile, Prospection, Spam) — personnalisables par l'utilisateur
- Prompt LLM assemble dynamiquement par utilisateur (labels + profil user)
- 3 modes d'exposition : Strict / Normal / Permissive
- Scan tier : Free 500 / Pro 10,000 / Admin illimite
- Dashboard web avec labels dynamiques
- Gmail = source de verite, Supabase = replica

**Pricing final** : Trial 14j → Free (30 emails/jour) → Pro 15EUR/mois → Team 19EUR/user/mois

---

## Etat Actuel du Code (2026-04-01)

### Branche `feat/dynamic-labels` (14 commits, a merger dans master)

**Pipeline classification :**
- Pre-filtrage rapide (metadata-first, lazy body fetch, domaines connus, noreply)
- Fix parsing From (extractEmailAddress, plus de `>`)
- Fix DKIM mismatch (allowlist 25+ providers legitimes)
- System prompt enrichi (transactionnel → toujours visible, profil user injecte)
- Prompt assemble dynamiquement depuis user_labels + user profile
- Label resolver (fingerprint/prefilter → label dynamique)
- Classification sauve label_id + classification_result (legacy compat)

**Onboarding (3 nouvelles etapes) :**
1. `/configure-profile` — role, secteur, description entreprise, prospection non voulue (chips), interets
2. `/configure-labels` — cards avec labels Gmail fusionne + defaults Kyrra, ajout/suppression/description
3. Inbox scan declenche apres config labels (inboxScanLoop separe)

**Schema DB :**
- Table `user_labels` (id, user_id, name, description, prompt, color, gmail_label_id, is_default, position)
- `email_classifications.label_id` FK → user_labels
- `onboarding_scans.labels_configured` + `gmail_labels` JSONB
- `user_settings` : sector, company_description, prospection_utile, prospection_non_sollicitee, interests, profile_configured
- Column-level GRANT pour les champs profil (migration 024)

**Fichiers cles modifies/crees :**
- `apps/worker/src/lib/prompt-builder.ts` — buildSystemPrompt(labels, profile)
- `apps/worker/src/lib/label-resolver.ts` — resolveLabel(), resolveLabelByName()
- `apps/worker/src/lib/prefilter.ts` — domaines connus, noreply, never-exchanged
- `apps/worker/src/lib/gmail.ts` — fetchEmailMetadata, fetchEmailBody, listUserGmailLabels, ensureDynamicLabels, applyDynamicLabel
- `apps/worker/src/classification.ts` — pipeline complet avec labels dynamiques
- `apps/worker/src/onboarding.ts` — split whitelist/labels/inbox + inboxScanLoop
- `apps/worker/src/lib/llm-gateway.ts` — systemPromptOverride, labelName, buildLegacyPrompt
- `apps/web/app/(auth)/configure-profile/page.tsx`
- `apps/web/app/(auth)/configure-labels/page.tsx` + LabelCard + AddLabelModal
- `apps/web/app/(auth)/actions/configure-profile.ts` + `configure-labels.ts`
- `packages/shared/src/types/user-label.ts` — UserLabel, DEFAULT_LABELS, LEGACY_RESULT_TO_DEFAULT_LABEL
- `supabase/migrations/023_create_user_labels.sql` + `024_add_user_profile_fields.sql`

### Bugs connus (resolus dans Beta Sprint)

1. ~~Dashboard "bloques aujourd'hui" toujours 0~~ → B2.4 done
2. ~~Tests classification.ts casses~~ → B5.3 done (a re-verifier dans B10.1)
3. ~~Navigation lente (2s)~~ → B2.5 done
4. ~~Pas de feedback au clic navigation~~ → B2.5 done
5. ~~Page scan temps reel manquante~~ → B2.6 done
6. ~~saveLabelsConfig non-atomique~~ → B1.8 done (migration 026)

### Bugs identifies par l'audit 2026-04-11 (Sprint Stabilization B8-B10)

1. **Classification save non-atomique** — 3 inserts sans transaction (classification + llm_usage + pipeline_health) → B8.1
2. **Label application silencieuse** — try/catch log "will reconcile" mais reconciliation ne rattrape pas → B8.2
3. **Race condition ensureDynamicLabels** — cache local, pas de protection concurrence → B8.3
4. **buildSystemPrompt sans validation** — labels vide = prompt LLM invalide → B8.4
5. **Email body taille non limitee** — format=full charge tout en memoire → B8.5
6. **Pas de timeout RPC Supabase** — loop peut hang indefiniment → B9.1
7. **Reclassification sans rate limit** — bulk = rate limit Gmail API → B9.2
8. **LLM timeout trop serre** — 14s avec SIGKILL a 20s = 6s marge → B9.3
9. **Circuit breaker trop permissif** — 70% bypass, 500EUR/h → B9.4
10. **Pas de validation env vars au startup** — erreurs tardives → B9.5

---

## Contraintes Critiques

- **RGPD** : Zero Data Retention, hebergement EU, human-in-the-loop (quarantaine, jamais suppression directe)
- **Faux positifs** : Risque mortel — toujours surclasser en cas de doute
- **Couts IA** : ~0.001EUR/email (marginal) — GPT-4o-mini
- **Column-level security** : user_settings a des GRANT par colonne (migration 022 + 024). Toute nouvelle colonne updatable par le user doit etre ajoutee au GRANT.

---

## Decisions Projet

| Date | Decision | Raison |
|------|----------|--------|
| 2026-03-09 | Installation BMAD v6.0.4 dediee au projet | Projet independant de Hacksprint |
| 2026-03-10 | Product Brief complete | Base pour le PRD |
| 2026-03-16 | PRD valide (86 FRs, 5/5) | Validation BMAD complete |
| 2026-03-17 | Architecture complete | Turborepo, Supabase+Railway, dual-engine |
| 2026-03-19 | UX Design complete (Nordic Calm) | shadcn/ui+Motion, Next.js 16 |
| 2026-03-19 | Epics & Stories complete (8 epics, 44 stories) | 84/86 FRs couverts |
| 2026-03-20 | Implementation Readiness PASS | 0 critical, 0 major |
| 2026-03-21 | Beta Epics B0-B6 (18 stories) | Pipeline, dashboard, trust loop, recap, RGPD |
| 2026-04-01 | **Labels dynamiques (7 defaults + custom)** | Remplace le systeme 3 labels fixe (A_VOIR/FILTRE/BLOQUE) |
| 2026-04-01 | **Profiling utilisateur dans onboarding** | Secteur, role, prospection non voulue, interets → injectes dans le prompt LLM |
| 2026-04-01 | **Pre-filtrage rapide** | Metadata-first, lazy body, domaines connus → 80% des emails sans body fetch |
| 2026-04-01 | **Fix pipeline critiques** | Parsing From, DKIM allowlist, whitelist 100→unlimited, transactionnel→A_VOIR |
| 2026-04-01 | **Plan modele custom Hugging Face** | Fine-tuning moyen-long terme quand assez de feedback data |
| 2026-04-11 | **Audit complet + Sprint Stabilization** | 27 issues backend, 13 stories (B8-B10), focus pipeline fiabilite |

---

## Specs & Plans

| Document | Chemin |
|----------|--------|
| Design spec labels dynamiques | `docs/superpowers/specs/2026-04-01-dynamic-labels-onboarding-design.md` |
| Plan implementation labels | `docs/superpowers/plans/2026-04-01-dynamic-labels-onboarding.md` |
| Epics beta | `planning-artifacts/epics-beta.md` |
| Brainstorm beta readiness | `planning-artifacts/brainstorm-beta-readiness-2026-03-21.md` |
| Epics stabilization | `planning-artifacts/epics-stabilization.md` |

---

## Memory Update Protocol

Mettre a jour ce fichier quand :
1. Decision technique validee
2. Document majeur complete
3. Phase du projet change
4. Preference clarifiee
