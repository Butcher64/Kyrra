---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - notion_export/content/Kyrra/Récolte infos.md
  - notion_export/content/Kyrra/Kyrra Squelette.md
  - notion_export/content/Kyrra/Échanges externes.md
  - notion_export/content/Kyrra/Documentation intéressante.md
  - notion_export/content/Kyrra/Dossier texte pour dev/l'idée Kyrra.md
  - notion_export/content/Kyrra/Dossier texte pour dev/La cible.md
  - notion_export/content/Kyrra/Dossier texte pour dev/le fonctionnement.md
  - notion_export/content/Kyrra/Dossier texte pour dev/L'interface et actions.md
  - notion_export/content/Kyrra/Dossier texte pour dev/Cas d'usage et particulier.md
  - notion_export/content/Kyrra/Questionnaire Terrain/Questionnaire dirigeants.md
  - notion_export/content/Kyrra/Questionnaire Terrain/Questionnaire DRH.md
  - notion_export/content/Kyrra/Questionnaire Terrain/Questionnaire DSI.md
  - notion_export/content/Kyrra/Questionnaire Terrain/Copywriting.md
  - notion_export/content/Kyrra/Mails de prospection ML/Templates.md
  - notion_export/content/Kyrra/test prompt.md
date: 2026-03-09
author: Thomas
---

# Product Brief: Kyrra

## Executive Summary

Kyrra is an AI-powered email filtering SaaS designed for business leaders (CEOs, HR Directors, IT Directors) who are overwhelmed by unsolicited commercial prospecting emails. Unlike traditional spam filters that treat all commercial emails the same, Kyrra uses semantic AI to intelligently classify incoming prospecting emails by relevance — blocking the noise while surfacing genuinely valuable business opportunities.

Born from the founders' direct experience in B2B prospecting, Kyrra sits at the intersection of "AI offense" (mass email tools like Lemlist, Instantly) and "AI defense" (intelligent filtering). The product acts as a cognitive firewall: it doesn't just filter spam, it qualifies commercial solicitations based on the user's role, industry, current needs, and desired exposure level.

Kyrra does not compete with Gmail or general email clients. It targets a premium niche: business leaders receiving 15+ unsolicited prospecting emails per week, for whom the cost of missed opportunities and cognitive drain far exceeds the subscription price.

The core tagline captures the essence: **"Silence the noise. Keep what matters."** (From Old Norse "Al Kyrra" — "all is calm")

---

## Core Vision

### Problem Statement

The proliferation of AI-powered sales automation tools has created an asymmetry crisis in professional email: sending mass personalized prospecting emails has never been easier, but receiving inboxes have not evolved to cope. Business leaders — particularly SMB CEOs and HR Directors — are drowning in unsolicited commercial emails that bypass traditional spam filters because they are technically legitimate, often personalized, and sent from real domains.

The most painful emails are not obvious mass spam — those are easy to delete. The real problem is AI-personalized prospecting emails (tools like Lemlist, Instantly) that mimic genuine correspondence, requiring 10-15 seconds of reading before the user realizes it's automated outreach. Multiplied by 15-20 such emails daily, this creates significant cognitive drain.

The result: critical emails get buried, cognitive load increases, decision-making suffers, and genuine business opportunities are missed in the noise.

### Problem Impact

- **Time drain**: Business leaders spend 30+ minutes daily manually triaging commercial emails. At an implicit hourly rate of 150-300 EUR for a CEO, this represents 1,500-3,000 EUR/month of wasted executive time
- **Cognitive overload**: Constant interruptions from AI-personalized but irrelevant solicitations fragment focus and reduce productivity — each email requiring 10-15 seconds of reading to identify as prospecting
- **Missed opportunities**: Legitimate business proposals get lost among dozens of irrelevant pitches — users develop "delete reflexes" that catch genuinely valuable emails too
- **Growing acceleration**: The volume of prospecting emails is accelerating as AI sending tools become mainstream, with no relief in sight — the problem gets worse every quarter
- **No adequate solution exists**: Current email filters (Gmail, Outlook) cannot distinguish between valuable commercial proposals and unwanted mass prospecting — they see "commercial" but cannot assess "relevant to this user's needs"

### Why Existing Solutions Fall Short

| Solution | What it does | What it misses |
|----------|-------------|----------------|
| **Gmail/Outlook native filters** | Basic spam detection, keyword rules, "Promotions" tab | Zero business-context classification — treats all commercial emails identically. Cannot distinguish a relevant partnership from mass prospecting |
| **SaneBox** | Behavioral importance sorting into smart folders | No prospecting-specific classification — sorts by "important/not important", not "relevant opportunity vs noise". $7/mo for generic sorting |
| **Superhuman** | Premium email client with Auto Labels including "cold pitches" | Binary label (cold pitch yes/no) — no relevance scoring, no user preference system, and requires switching to a new email client ($30/mo). The filter is a feature, not the product |
| **Clean Email / Spark / Canary** | Inbox cleanup and organization | Rule-based or general AI — no semantic understanding of commercial intent vs business relevance |
| **Prospecthor** | Prospecting email detection | Niche tool with limited traction. No user preference system, no exposure control, no AI summaries. 19.99 EUR/mo |

**The gap**: No solution today offers fine-grained, role-aware classification of commercial prospecting emails — distinguishing between "this SEO agency pitch is relevant to my current needs" and "this generic SaaS pitch is noise" — while letting the user control their exposure level.

### Proposed Solution

Kyrra is an intelligent middleware that connects to existing email providers (Gmail/Outlook) via API and applies a multi-layer AI analysis to every incoming email:

1. **Whitelist auto-detection** — Known contacts and historical correspondents pass through instantly. Built automatically by scanning Sent Items (6 months), requiring zero manual setup
2. **Semantic AI classification** — Unknown senders are analyzed for commercial intent, relevance to the user's profile, and quality of personalization
3. **Smart categorization with simple UX** — Backend classifies into 4 granular categories (Non-commercial, Opportunity, Exploration, Noise), but the user-facing experience is streamlined: emails land in either their Inbox or a single "Filtered" folder, with the Kyrra Recap providing the nuanced breakdown
4. **User-controlled exposure** — A sensitivity slider lets users adjust their openness from "completely closed" to "actively seeking opportunities"
5. **Kyrra Recap** — Periodic email digests summarize filtered activity, highlight opportunities, and report time saved
6. **One-line AI summaries** — Every filtered email gets an instant summary (e.g., "Recruitment agency — Java senior developer profile"), enabling 1-second triage decisions

The user stays in their existing email client. Kyrra works invisibly in the background, creating smart folders/labels. Nothing is ever deleted without explicit consent — Kyrra filters, never censors.

**Initial target**: Business leaders (CEOs, HR Directors) in companies of 20-250 employees who receive 15+ prospecting emails per week. Self-service onboarding via Gmail OAuth, no IT validation required for individual adoption. Enterprise deployment path (IT validation package) available for team rollouts.

### Key Differentiators

1. **Dual-layer AI with collective intelligence** — A universal detection model learns prospecting patterns across all users (templates, sequences, sender behaviors), creating a collective moat that improves with scale. A personal preference layer adapts to each user's role, industry, and needs. New competitors start at zero; Kyrra's detection model compounds daily
2. **Founded by prospectors** — The founding team runs B2B prospecting campaigns professionally, giving unique insider knowledge of how outbound emails are crafted, sequenced, and personalized — they know the playbook from both sides
3. **User-controlled exposure** — Unlike binary block/allow solutions, Kyrra's slider and tag system lets users define exactly what types of solicitations they want, from which industries, at what intensity
4. **Premium UX as a product, not a background filter** — An ergonomic, dynamic interface for managing solicitation preferences with a Superhuman-level experience. The cockpit IS the product, not just the algorithm behind it
5. **Trust-first architecture** — Zero data retention, EU hosting, nothing ever deleted without consent. Founded by local entrepreneurs (Bordeaux) who stake their reputation on transparency — not a faceless SaaS from Silicon Valley. Includes a dedicated IT/DSI validation package: technical architecture documentation, DPA template, data flow diagrams, and LLM provider transparency (model used, server location, data handling policy) to unblock enterprise adoption even in SMBs with IT governance
6. **Perfect market timing** — The market is shifting from "AI offense" (sending tools) to "AI defense" (filtering tools) in 2026. Mass prospecting tools have created the problem; Kyrra is the antidote
7. **Quantifiable ROI** — A business leader spending 30+ minutes daily on email triage at an implicit hourly rate of 150-300 EUR recovers the 15 EUR/month subscription in the first hour of use
8. **One-line AI summaries** — Every filtered email gets an instant AI-generated summary, enabling 1-second triage decisions instead of 15-second reads. Identified as the single most valued feature across all user personas

---

## Target Users

### Primary Users

#### Marc — CEO, PME industrielle (30-80 employés) — Persona d'acquisition

**Context:** Marc, 44, dirige une menuiserie industrielle de 45 personnes près de Lyon. Il gère encore ses emails personnellement — pas d'assistante dédiée, pas d'office manager. Son entreprise a une présence digitale (site web, référencement) qui attire les prospecteurs. Secteurs privilégiés : industrie, BTP, services. Il est en phase de croissance, ce qui influence directement quelles opportunités commerciales sont pertinentes.

**Problem Experience:** Marc reçoit 18-22 emails de prospection par jour. Il a développé un "réflexe suppression" : il scanne les 3 premières lignes et supprime en masse. Ce réflexe lui fait régulièrement rater des propositions pertinentes (fournisseur machines-outils, consultant certification ISO). Il estime perdre 35 minutes/jour en tri manuel — soit ~2,500 EUR/mois de temps dirigeant gaspillé.

**Current Workarounds:** Règles Gmail manuelles (fragiles, contournées par les prospecteurs), "heure email" dédiée le matin (déborde toujours), dossier "à voir plus tard" qui accumule 200+ emails non lus.

**Success Vision:** Marc ouvre son email le matin : sa boîte ne contient que les vrais échanges. En 2 minutes avec son café, il lit le Kyrra Recap qui lui dit "17 emails de prospection filtrés, 2 opportunités identifiées dont 1 fournisseur machines-outils pertinent pour votre phase de croissance". Il clique sur les 2 résumés, archive le reste sans effort.

**Discovery channels:** Clubs dirigeants (APM, BNI, CCI) comme canal principal, bouche-à-oreille entre pairs, LinkedIn secondaire.

#### Nathalie — DRH, entreprise tech (100-150 employés) — Persona d'expansion

**Context:** Nathalie, 38, DRH d'une scale-up tech de 120 personnes à Bordeaux. She recruits actively and receives solicitations from recruitment agencies — some are relevant, unlike for Marc. She is not an IT decision-maker: she must convince the CIO and her manager.

**Problem Experience:** Nathalie reçoit 12-15 emails de prospection par jour, dont des cabinets RH, éditeurs SIRH, consultants bien-être au travail. Le problème : elle ne peut pas tout bloquer car certains cabinets proposent des profils qu'elle cherche activement. Elle perd 25 minutes/jour à distinguer le pertinent du bruit.

**Current Workarounds:** Dossier "Prospection RH" dans Outlook qu'elle parcourt une fois par semaine (souvent trop tard pour les bonnes propositions).

**Success Vision:** Kyrra distingue automatiquement les cabinets de recrutement pertinents (profils tech seniors) des éditeurs SaaS génériques. En mode "Ouvert aux affaires" pendant ses périodes de recrutement, elle reçoit les opportunités RH tout en filtrant le reste. Le dashboard de métriques lui permet de justifier le renouvellement auprès de son N+1.

**Champion Path:** Nathalie discovers Kyrra, installs the individual version. To move to team deployment, she uses the Kyrra IT package (data flow diagram, DPA template, architecture documentation, LLM provider transparency) to convince the CIO. The visual "which data flows where" diagram is critical for approval. Note: this champion path is a V1.1 motion — MVP focuses on self-service Marc-type users.

**Persona Hierarchy (Go-to-Market):** Marc = acquisition persona (self-service, direct buyer, short sales cycle). Nathalie = expansion persona (champion path, longer cycle, higher LTV). MVP targets Marc exclusively; Nathalie's champion path built in V1.1.

### Secondary Users

#### Sophie — Consultante RH freelance (Plan gratuit)

**Context:** Sophie, 32, consultante indépendante en transformation RH. Volume de prospection modéré (6-8/semaine). Rejoint Kyrra pour les résumés 1 ligne, pas le filtrage massif.

**Value:** One-line summaries for rapid triage. Adaptive Recap frequency (monthly/on-demand — weekly is overkill for low volume). Natural ambassador in her LinkedIn network of business leaders.

**Repositioning:** Free plan as volume strategy (train the AI model) and organic acquisition (word-of-mouth), not direct revenue. Limited to 50 analyzed emails/month to prevent infrastructure overload. Upsell path: one-line summaries extended to ALL emails (not just prospecting) as premium V2 feature.

**Threshold to define (step-04-metrics):** Minimum number of free users needed for meaningful model improvement. Below threshold, free plan has negative ROI.

#### IT Decision Makers (DSI)

**Context:** Not direct users, but critical gatekeepers for enterprise deployment (Nathalie's champion path). Need technical documentation, data flow diagrams, DPA templates, and LLM provider transparency. Relevant for V1.1, not MVP.

### User Journey

**Discovery:**
- Marc: Recommendation from a peer at a business club (APM, BNI, CCI). Hears "this tool saved me 30 minutes a day on prospecting emails."
- Nathalie: LinkedIn post or colleague recommendation. Interest piqued by "AI that distinguishes relevant recruiters from generic pitches."
- Sophie: LinkedIn organic content, word-of-mouth in HR consultant networks.

**Onboarding (Zero-Friction, ~90 seconds):**
- OAuth Gmail/Outlook connection — nothing else on Day 1
- Single field: "What is your role?" (CEO / HR Director / IT Director / Other) — changes entire classification logic. This single field provides 80% of classification value.
- Quick scan: 50 most recent emails analyzed in ~30 seconds → instant diagnostic displayed ("You received X prospecting emails this week"). Full 6-month Sent Items scan runs asynchronously in background.
- Profile built progressively through usage (feedback, reading patterns, whitelist auto-build), not through initial questionnaire. Progressive profiling captures real behavior, not declared intentions.
- Expectation management messaging: "Kyrra improves every day — here's what I learned from your week."

**Day 0-1 Bridge (Critical retention window):**
- Instant diagnostic from quick scan (minute 1)
- Email "1 hour after signup" with first observations: "I've started analyzing your inbox. Here's what I see so far: X emails from unknown senders this week, Y that look like automated prospecting."
- First Kyrra Recap within 24-48 hours, even partial: "Yesterday I filtered 12 prospecting emails. 1 opportunity identified. You saved ~15 minutes."

**Core Usage (MVP = email-only interface):**
- Emails silently classified in background — Inbox (real emails) vs Filtered (prospecting)
- Every filtered email includes a one-line AI summary in human language ("Probably a sales pitch — SEO agency proposing audit" NOT "Confidence score: 0.87")
- Each filtered email contains a feedback link: "This is not prospecting" — opens a simple web page for correction. Ultra-accessible, one click. Builds trust through transparency.
- Safety net: alerts for "uncertain high-stakes" emails — limited to emails from addresses close to the user's contact graph (not full semantic analysis of all emails, which would cost ~16% of Pro subscription in LLM calls)
- 3 exposure modes controlled via email reply to Recap: "Concentré" (maximum filtering) / "Ouvert aux affaires" (relevant opportunities pass through) / "Veille opportunités" (passive discovery mode)
- Role-aware classification: same email from a recruitment agency = Opportunity for Nathalie, Noise for Marc
- Architecture note: requires dual-model system — universal model (prospecting detection, shared across users) + per-role model (relevance scoring, personalized). Infrastructure is 2x more complex than single-model.

**Recap (Second Product Pillar):**
- Recap is NOT an accessory feature — it's a standalone value proposition
- Format: lightweight HTML email, designed to avoid Gmail Promotions tab
- Mobile-first: optimized for 30-second reading on iPhone between meetings
- Frequency adaptive: daily for high-volume users (Marc), weekly/monthly/on-demand for low-volume (Sophie)
- Content: filtered count, opportunities highlighted with summaries, time saved estimate, market intelligence from prospecting trends (what sectors are targeting you, trending pitches)

**Success Moment:** First Recap that says "I filtered 17 prospecting emails, surfaced 2 real opportunities, and saved you 25 minutes." Marc thinks: "This already paid for itself."

**Long-term:**
- Kyrra Recap becomes a Monday morning ritual (Marc with his coffee)
- Business phase awareness: user profile enriched over time (growth/consolidation) influences opportunity scoring
- Dashboard metrics for enterprise users (V1.1): emails filtered/month, sectors, trends — ROI justification for renewal

**UI Roadmap:**
- MVP: Email-only interface (Recap + feedback links + mode commands via email reply)
- V1.1: Web app dashboard (metrics, settings, history, champion path for Nathalie)
- V2: Browser extension integrated into Gmail/Outlook (inline labels, one-click feedback, mode toggle)

**Adaptive features (V2 vision, noted):**
- Predictive exposure mode changes based on business calendar/seasonality
- One-line summaries extended to ALL emails (premium feature)
- Scheduled mode changes (Nathalie auto-switches to "Ouvert" during recruitment periods)
- Temporary thematic filter ("I'm specifically looking for a cybersecurity expert this week")
- Certified sender program (long-term vision): businesses pay to be whitelisted, creating a marketplace dynamic

---

## Success Metrics

### North Star Metric

**Recap Click Rate** — % of users who click on at least one email summary within the Kyrra Recap. When this metric exceeds 30%, monthly churn drops below 2%. This single metric captures the full value chain: email filtered → Recap sent → Recap opened → content relevant → user clicks.

### Engagement Doctrine: Two Modes

Kyrra has two distinct engagement modes — metrics must NOT be mixed in reporting:

1. **Passive mode (the core):** Invisible filtering + Recap. This is success. Metrics: Recap open rate, Recap click rate, correction curve, Trust Score.
2. **Active mode (the exception):** Dashboard for setup, diagnosis, support. Metrics: setup completion, label config rate, support resolution. A "passive-only" user (Recap only, never visits dashboard) is a SUCCESS, not a ghost user.

### User Success Metrics

**Core Value Indicator: Emails correctly filtered, labeled, and invisible before the user sees them.**

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Prospecting detection rate** | % of prospecting emails correctly identified | 70% D1, 85% D7, 92% D30 (progressive learning) |
| **False positive rate** | Legitimate emails classified as prospecting | <1% post-whitelist (D3+). First 48h: "uncertain" mode — over-classify as uncertain rather than filter |
| **Filtered-before-read rate** | % of prospecting emails labeled before user sees them | >95%. Emails seen in-progress: label WITHOUT moving (avoid "disappearing email" effect) |
| **Label accuracy** | Emails sorted into correct graduated labels | >92% at M3 (below 92%, users collapse to 2 labels and ignore graduation) |
| **Label confusion rate** | Emails manually moved between Kyrra labels by user | <8% (high confusion = model misjudging graduation) |
| **Correction rate curve** | "Not prospecting" clicks/week, tracked as trend | W1: ~8, W2: ~4, W3: ~1, W4: ~0. Descending = learning. Stagnation = broken |
| **Recap Click Rate (North Star)** | % of Recaps where user clicks ≥1 summary | >30% (correlates with <2% churn) |
| **Recap open rate** | % of Recap emails opened | 60% M1, stabilizing 35-45% M6+. Decline ≠ failure if churn stays low |
| **Estimated time saved** | (Emails filtered × 12 sec avg) per day | >20 min/day for Marc-type users |

**Trust Score (composite metric):**
- Correction rate descending week-over-week ✓
- Zero false positives on known contacts ✓
- User stops manually checking the Filtered folder (measured by declining dashboard visits to filtered email view)
- Time-to-trust: number of days before user stops verifying Kyrra's work

### Graduated Label System (Core Product Mechanic)

Kyrra proposes a graduated labeling taxonomy during setup. User selects which levels they want; Kyrra creates corresponding labels in their mailbox.

**Default graduation:**

| Label | Purpose | User controls |
|-------|---------|---------------|
| **Kyrra — Opportunités** | Relevant prospecting matching user's sector, role, needs | Visible near inbox |
| **Kyrra — À explorer** | Potentially interesting, not urgent | Sorted into label, surfaced in Recap |
| **Kyrra — Bruit** | Irrelevant generic prospecting | Archived in label, counted in Recap |
| **Kyrra — À bannir** | Zero tolerance category — blacklisted | Auto-archived or auto-deleted (user choice) |

**Adaptive dimensions:** Sender sector, email tool fingerprint, personalization quality, exposure mode, user role.

**Label system instrumentation:**

| Metric | What it reveals |
|--------|----------------|
| **Label usage distribution** | Which labels are actually used vs ignored. If 80% of users only use Opportunités + Bruit, 4-level graduation is wasted |
| **Customization rate** | % of users who modify default labels. Low = good defaults. High = bad defaults |
| **Label vs Delete ratio** | % of users enabling auto-delete on "À bannir". If >50%, "never delete" philosophy may be too conservative |
| **Setup label config rate** | % of users who complete label configuration during onboarding |
| **Post-setup modification rate** | % of users who change label config after first week |

**Critical rule: Kyrra never deletes without explicit consent.** Default = label + archive. Deletion opt-in per label.

### Onboarding Micro-Funnel (Instrumented)

Every second of the first 5 minutes is tracked.

| Step | Metric | Target |
|------|--------|--------|
| OAuth authorization | Completion rate | >90% |
| Role selection | Time + completion | <10 sec, >95% |
| Label configuration | Completion rate | Track (no hard target — defaults must work) |
| Quick scan (50 emails) | Time to diagnostic | <30 seconds |
| Diagnostic displayed | Read vs close rate | >80% read |
| Time-to-First-Correct-Filter | First email correctly filtered without correction | <24 hours |
| "1h post-signup" email | Open rate | >70% |
| First Recap | Open rate + click rate | >80% open, >40% click |

### Recap Quality Metrics (Second Product Pillar)

| Metric | What it reveals | Target |
|--------|----------------|--------|
| **Read time** | <30s = good (mobile scan). >3min = too long. <5s = not engaging | 20-45 seconds |
| **Click-through by content type** | Which sections generate clicks: opportunities? stats? time saved? | Track to optimize layout |
| **Recap unsubscribe rate** | Users who keep Kyrra but opt out of Recap | <3% (losing Recap = losing churn prevention) |
| **Recap frequency preference** | % choosing daily vs weekly vs on-demand | Track to validate adaptive frequency |

### Business Objectives

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Monthly churn** | % of Pro users unsubscribing | <5%/month M3, <3%/month M12 |
| **Churn type tracking** | Active (dissatisfied) vs passive (forgot/card expired) | Track separately. Passive mitigation: Recap value reminder + pre-expiration card alert |
| **Ghost user rate** | Paying users with no Recap opened in 7 consecutive days | Alert at Day 7 → re-engagement email with cumulative value. Based on Recap non-opened (not dashboard) |
| **Support tickets per user** | Tickets/user/month | <0.5 |
| **Free → Pro conversion** | % of free users upgrading | >8% within 6 months |
| **Spontaneous referral rate** | % of new users from existing user referral | >15% M6 (replaces NPS) |
| **MRR growth** | Monthly Recurring Revenue | 10% MoM target |
| **Organic acquisition %** | % from word-of-mouth / referral | >40% |

**Recap as churn prevention:** Every Recap includes cumulative value: "This month: 89 filtered, 3 opportunities, ~3h20 saved. Since signup: 247 filtered, ~6h saved."

**Market sizing (to refine):** Thousands of Marc-type CEOs in France (PME 30-80, no assistant, digital presence, 15+ prospecting/week).

### Key Performance Indicators (Technical)

| KPI | Measurement | MVP Target |
|-----|-------------|------------|
| **Filtered-before-read rate** | Prospecting classified before user opens inbox | >95% |
| **Provider sync failure rate** | Silent sync failures, per provider | <0.5% Gmail, <1% Outlook. Gmail push fail silently ~2%; Outlook webhooks expire after 3 days |
| **Label sync reliability** | Kyrra labels ↔ mailbox labels consistency | >99.5% |
| **Multi-provider support** | Supported providers at MVP | Gmail API + Outlook API only. IMAP/SMTP deferred to V1.1 |
| **Multi-mailbox support** | 2-3 accounts per Kyrra profile | Supported from MVP |
| **API email cost** | Rate limits, quotas, push costs at scale | Track from M1 — real cost bottleneck (not LLM) |
| **LLM cost per user/month** | AI analysis cost per paying user | <2 EUR (decreasing with new models) |
| **Classification precision** | Correct identification after learning | >85% D7, >92% D30 |
| **Classification recall** | % of prospecting detected | >95% |
| **Uptime** | Service availability | >99.5% |

### Critical Technical Challenges (Flagged for Architecture)

1. **Real-time bidirectional sync** — #1 risk. Gmail (pub/sub) vs Outlook (webhooks, 3-day expiry). Silent failures must be auto-detected and recovered.
2. **Label system as contract** — Labels ARE the product's visible surface. Sync breaks = product invisible.
3. **Multi-mailbox unified profile** — Shared preferences, unified whitelist, sender deduplication.
4. **IMAP/SMTP (V1.1)** — No push, polling only, label support varies. Only if validated by demand.
5. **"Disappearing email" problem** — Classify while user is in inbox: label silently, don't move.

---

## MVP Scope

### Phased Approach: MVP-0 (Beta) → MVP-1 (Public)

Scope split into two phases. MVP-0 validates core value with 20-30 beta testers. MVP-1 is the public launch.

**Timeline:** 4 sprints × 2 weeks dev + 5 weeks beta = MVP-1 at M4-M5.

**Stack:** Monolith pragmatique — Supabase (EU Frankfurt) + Node/Next.js + Postmark. Boring technology that ships. EU hosting confirmed for GDPR compliance.

---

### MVP-0: Closed Beta (8 weeks dev, 5 weeks beta)

**Goal:** Validate AI classification + graduated labels + Recap for business leaders. Gmail only, no dashboard, no landing page.

**Beta composition (intentional, not first-come):**
- 15 CEO/dirigeants PME (Marc personas)
- 5 DRH (validate per-role classification works)
- 5 freelances/consultants (test low-volume value)
- 5-10 testers outside direct network (2nd-circle contacts for honest feedback)
- 100% Gmail (note which testers also have Outlook for MVP-1)

#### MVP-0 Features

**1. Email Connection (Gmail Only)**
- Gmail API — OAuth 2.0, push notifications via pub/sub
- Multi-mailbox — Up to 2 Gmail accounts per profile
- Bidirectional label sync with edge case handling (rename, delete, duplicate — 10 scenarios tested before launch)
- Whitelist auto-build from Sent Items (6 months)
- Silent failure detection + auto-recovery
- API quota management (modeling, batching, alerts at 70%/90%, fallback to polling)
- Clean uninstall — One button restores mailbox to pre-Kyrra state

**2. AI Classification (Single LLM Prompt, Dual-Section)**
- Single LLM prompt (GPT-4o-mini or Claude Haiku) with two logical sections: (1) prospecting detection (universalizable) and (2) relevance scoring (personalizable). When dual-model arrives in MVP-1, sections split into two calls — no refactoring needed.
- Input: email content + user role + past corrections
- Progressive learning: 70% D1 → 85% D7 → 92% D30
- One-line AI summaries in human language
- Uncertain mode first 48h (over-classify as uncertain)
- Multilingual FR+EN from day 1
- One-click correction with token (zero auth)
- LLM hosted in EU (Azure OpenAI EU West or AWS Bedrock EU)

**3. Graduated Labels (3 Labels — Names finalized before beta)**
- **Kyrra — À voir** — Relevant prospecting worth reviewing (visible near inbox)
- **Kyrra — Filtré** — Generic irrelevant prospecting (archived)
- **Kyrra — Bloqué** — Zero tolerance, blacklisted (auto-archived or auto-deleted, user choice)
- Label config during onboarding (rename, enable/disable)
- Label-without-move for in-progress emails

*Label names are professional and premium. "À voir / Filtré / Bloqué" replaces earlier names — no vulgar terms in Gmail sidebar. Kyrra— prefix groups labels visually and acts as permanent branding.*

**4. Exposure Modes**
- 3 presets: "Concentré" / "Ouvert aux affaires" / "Veille opportunités"
- Mode switching via Recap reply
- Role at signup changes classification

**5. Kyrra Recap Premium (replaces dashboard at MVP-0)**
- First Recap within 24-48h
- Daily frequency
- Mobile-first email, avoids Promotions tab
- **Two-layer rendering:**
  - Top: pre-generated PNG image with trend chart + visual stats (renders 95% of clients)
  - Body: simple enriched text (numbers, lists, links) — renders everywhere
- "À voir" emails with one-line summaries (clickable → original in Gmail)
- Top filtered senders (domain-level grouping)
- Time saved + cumulative value ("Since signup: X filtered, ~Yh saved")
- Action buttons: change mode, give feedback, view in Gmail
- Mandatory unsubscribe + one-click header (RFC 8058)
- Deliverability: SPF/DKIM/DMARC, domain warmed from Sprint 1, tested with Mail-Tester

**6. Beta Onboarding (Simplified)**
- Pre-OAuth trust message: "Essayez sans risque. Un clic pour tout annuler, votre boîte revient exactement comme avant."
- Google Form: role, sector, email volume, expectations
- OAuth link (minimal scope)
- Slack/WhatsApp channel for feedback

#### MVP-0 Dev Sprints

| Sprint | Duration | Deliverable |
|--------|----------|-------------|
| **Sprint 1** | 2 weeks | Gmail OAuth + sync engine + label creation. **Domain warming starts now.** |
| **Sprint 2** | 2 weeks | LLM classification + whitelist + one-line summaries |
| **Sprint 3** | 2 weeks | Recap premium (text + PNG) + deliverability testing |
| **Sprint 4** | 2 weeks | Clean uninstall + correction tokens + label edge cases + polish |

#### MVP-0 Success Gates

**Gate 1: Technical (Beta week 2-4)**
- [ ] Gmail sync <0.5% silent failure
- [ ] Label sync bidirectional >99.5%
- [ ] Classification >70% D1
- [ ] Recap delivered <48h, avoids Promotions >90%
- [ ] Spam report rate <0.1%

**Gate 2: User (Beta week 4-6)**
- [ ] Correction curve descending >80% of users
- [ ] Recap Click Rate >20%
- [ ] <1% false positive post-whitelist
- [ ] 5+ users say "can't go back" (unprompted)
- [ ] Honest feedback from out-of-network testers validates value

**Decision:** Both gates → proceed to MVP-1. Any fail → iterate, extend beta.

---

### MVP-1: Public Launch (+2-3 months after MVP-0)

**Goal:** Public launch with full product surface.

#### MVP-1 Additions

**7. Outlook API Integration**
- Microsoft Graph API — OAuth 2.0, webhooks (auto-renewal)
- Folder-based labeling (Outlook folders ≠ Gmail labels)
- 3 mailboxes on Pro (mixed Gmail + Outlook)
- Provider-specific sync failure monitoring

**8. Dual-Model AI Architecture**
- Universal model (collective) — Prospecting patterns across all users
- Per-role model (personalized) — Fine-tuned relevance
- Activated at ~500 users; single prompt remains as fallback

**9. Dashboard Web App**
- **Home:** Real-time stats, label breakdown, trend chart, time saved, confidence indicator. Pre-calculated, first paint <1s.
- **Emails:** Filtered list with summaries. Sender grouping by domain. Filter by label/date/sector. One-click correction.
- **Settings:** Mailboxes, labels, mode, role, Recap frequency, billing, clean uninstall.
- **UX:** Superhuman-level premium polish. Mobile responsive. Progressive disclosure. Reassurance-first.

**10. Landing Page (Built on beta verbatims)**
- Hero: "Faites taire le bruit. Gardez l'essentiel." + CTA above the fold
- Use cases: Dirigeants PME + DRH + Freelances/Indépendants
- Beta testimonials. Trust signals (RGPD, EU, clean uninstall).
- FAQ "Pour votre DSI" (data hosting, LLM, GDPR, data flow, DPA on request)
- SEO-optimized, Core Web Vitals, mobile-first

**11. Polished Onboarding**
- Pre-OAuth explainer + clean uninstall trust signal
- Role selection, label config, quick scan diagnostic, "1h email"

**12. Pricing**
- **Trial Pro 14 jours** — Credit card required, not charged. Single entry path.
- **Pro 15€/mois** — Unlimited, daily Recap, 3 mailboxes, dashboard
- **Free** — 50 emails/month, weekly Recap, 2 mailboxes
- **Team 30€/mois/user** — "Coming soon" (V1.1)

#### MVP-1 Success Gate

**Gate 3: Business (M3-M6 post launch)**
- [ ] <5% monthly churn Pro
- [ ] >8% Trial → Pro conversion
- [ ] Referral rate >10%
- [ ] Support <0.5 tickets/user/month
- [ ] Unit economics: LLM + API < 3€/user/month

**Decision:** Gate 3 → scale/fundraise. Fail → diagnose, pivot.

---

### Pre-Launch Requirements

| Requirement | Phase | Priority |
|-------------|-------|----------|
| Domain warming (SPF/DKIM/DMARC) | MVP-0 Sprint 1 | Critical |
| API quota modeling | MVP-0 Sprint 1 | Critical |
| Label names finalized | MVP-0 pre-Sprint 1 | Critical |
| Label sync edge cases (10 scenarios) | MVP-0 Sprint 4 | Critical |
| Deliverability testing | MVP-0 Sprint 3 | Critical |
| Beta recruitment (25-30, intentional) | MVP-0 pre-Sprint 1 | Critical |
| Feedback channel (Slack/WhatsApp) | MVP-0 pre-beta | Important |
| Multilingual testing (FR/EN/mixed) | MVP-0 Sprint 2 | Important |
| Landing page from beta verbatims | MVP-1 | Important |

### Out of Scope

| Feature | Deferred to | Rationale |
|---------|-------------|-----------|
| **IMAP/SMTP** | V1.1 | +40% complexity, ~5-10% users |
| **Full IT validation package** | V1.1 | MVP-1 has FAQ page |
| **Sender grouping by company** | V1.1 | Domain grouping in MVP-1 |
| **Advanced analytics** | V1.1 | Builds on data |
| **Ghost Bouncer** | V1.1 | Not core |
| **Browser extension** | V2 | High effort |
| **All-email summaries** | V2 | Different value prop |
| **Scheduled modes** | V2 | Manual covers 80% |
| **Thematic filters** | V2 | Complex |
| **Certified sender** | V2+ | Needs mass |
| **API / integrations** | V2 | Slack, CRM |

### Future Vision

**V1.1 (M6-M9):** IMAP/SMTP, full IT package, company sender grouping, advanced dashboard, Ghost Bouncer

**V2 (M9-M18):** Browser extension, all-email summaries, scheduled modes, thematic filters, API

**V3 (M18+):** Certified sender marketplace, B2B intelligence, multi-language, team analytics

**Geographic expansion:** Belgium (francophone) + Switzerland (romande) = ~25-28K total addressable targets. Same language, GDPR framework, zero localization cost.

**The moat:** Every email improves the universal model. Every correction sharpens per-role scoring. At 10,000 users, competitors start at zero — Kyrra is 12+ months ahead.
