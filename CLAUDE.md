# CLAUDE.md - Kyrra Project Memory

> **Auto-update** : Mettre a jour ce fichier apres chaque decision majeure.
> **Derniere MAJ** : 2026-03-20
> **Phase actuelle** : Implementation (Phase 4 — 44/44 stories done, all 8 epics complete)

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

Ce projet utilise **BMAD v6.0.4** (installe dans `Kyrra/_bmad/`).
Commandes heritees du parent `C:\Users\Thomas\Documents\CLAUDE\.claude\commands`.

**Phase actuelle** : Solutioning (Phase 3)
- [x] Product Brief (complete)
- [x] PRD (complete — 86 FRs, version post-validation + edits)
- [x] Validate PRD (complete — 5/5 Excellent, Pass, 2026-03-16)
- [x] UX Design (complete — 14 steps, Nordic Calm direction, 2026-03-19)
- [x] Architecture (complete — 8 steps, 28 validations, 2026-03-17)
- [x] Epics & Stories (complete — 8 epics, 44 stories, 84/86 FRs, 2026-03-19)
- [x] Check Implementation Readiness (complete — READY, 0 critical, 0 major, 2 minor, 2026-03-20)

**Parcours recommande** : Option A (complet) — voir CLAUDE.md parent

---

## Le Produit Kyrra

**Probleme** : Asymetrie envoi/reception emails — outils IA facilitent l'envoi massif, boites saturees
**Solution** : IA entrainee pour classifier les emails de prospection B2B avec precision metier
**Differentiation** : Aucun concurrent ne fait de classification metier fine (prospection vs spam vs interne)

**Cibles MVP** : Dirigeants TPE/PME (decideurs directs, cycle court)
**Cibles V2** : DRH, DSI

**Fonctionnement cle** :
- Middleware API Gmail (MVP-0) / Outlook (MVP-1)
- Dual-engine : Fingerprinting (65-70% rule-based) + LLM (30-35% ambigus)
- Whitelist auto via scan des Sent Items (6 mois, SHA-256 hashed)
- 3 labels Gmail gradues : "A voir" / "Filtre" / "Bloque"
- 3 modes d'exposition : Strict / Normal / Permissive
- Kyrra Recap (email recapitulatif quotidien, Pro+)
- Score de confiance + resume 1 ligne par email (Pro+)
- Dashboard web (simple + detailed mode)
- Gmail = source de verite, Supabase = replica

**Pricing final** : Trial 14j → Free (30 emails/jour) → Pro 15EUR/mois → Team 19EUR/user/mois

---

## Contraintes Critiques

- **RGPD** : Zero Data Retention, hebergement EU, human-in-the-loop (quarantaine, jamais suppression directe)
- **Faux positifs** : Risque mortel — toujours surclasser en cas de doute
- **Couts IA** : ~0.001EUR/email (marginal) — GPT-4o-mini ou Claude Haiku

---

## Source de Verite

L'export Notion complet est dans `notion_export/content/Kyrra/`.
Fichiers cles :
- `Dossier texte pour dev/` — Brief produit complet (idee, cible, fonctionnement, interface, cas d'usage)
- `Recolte infos` — Etude de marche, concurrence, RGPD, pricing
- `Kyrra Squelette` — Logique de tri + organigramme
- `Questionnaire Terrain/` — Questionnaires dirigeants, DRH, DSI + copywriting

---

## Decisions Projet

| Date | Decision | Raison |
|------|----------|--------|
| 2026-03-09 | Installation BMAD v6.0.4 dediee au projet | Projet independant de Hacksprint |
| 2026-03-09 | Import export Notion complet | Source de verite pour le product brief |
| 2026-03-10 | Product Brief complete | Base pour le PRD |
| 2026-03-12 | PRD complete (12 etapes, 81 FRs, polish) | Pret pour UX/Architecture |
| 2026-03-16 | PRD valide et edite (86 FRs, rating 5/5) | Validation BMAD complete — 3 FRs ajoutes (clean uninstall, token in-email, multilingual), 7 FRs affines |
| 2026-03-17 | Architecture complete (8 steps, 28 corrections validees) | Turborepo monorepo, Supabase+Railway+Vercel, dual-engine, 5 ADRs, 10 enforcement rules |
| 2026-03-19 | UX Design complete (14 steps, Nordic Calm) | shadcn/ui+Motion+Magic UI, Next.js 16, OKLch, 12 micro-interactions, 6 custom components, 7 experience principles |
| 2026-03-19 | Epics & Stories complete (8 epics, 44 stories) | 84/86 FRs couverts, FR19+FR32 differes MVP-1, validation pass |
| 2026-03-20 | Implementation Readiness PASS | 0 critical, 0 major, 2 minor — READY FOR IMPLEMENTATION |
| 2026-03-12 | Pricing finalise : Free/Pro 15EUR/Team 19EUR | Valide durant PRD step 8 (scoping) |
| 2026-03-12 | Dual-engine classification (fingerprint + LLM) | Optimisation couts + latence |
| 2026-03-12 | 3 labels gradues + 3 modes exposition | Simplifie vs 4 categories initiales |
| 2026-03-12 | Gmail = source de verite, Supabase = replica | Reconciliation adaptive polling |

---

## Memory Update Protocol

Mettre a jour ce fichier quand :
1. Decision technique validee
2. Document majeur complete
3. Phase du projet change
4. Preference clarifiee
