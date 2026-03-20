---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete, validated, edit-post-validation]
lastEdited: '2026-03-15'
editHistory:
  - date: '2026-03-15'
    changes: 'Post-validation edits: added FR84 (clean uninstall), FR85 (in-email correction token), FR86 (multilingual FR+EN); refined FR45 (added metric), FR58 (defined inactivity threshold), FR82 (clarified OR clause)'
inputDocuments:
  - planning-artifacts/product-brief-Kyrra-2026-03-09.md
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
projectClassification:
  projectType: 'saas_b2b (MVP-1) / email_integration_tool (MVP-0)'
  productPattern: 'invisible_saas + middleware'
  domain: 'data_privacy_ai'
  complexity: 'HIGH (near-critical)'
  complexityTags: [distributed_state, regulatory_blocker, trust_sensitive]
  trustModel: 'zero_error_tolerance'
  context: 'greenfield'
  regulatoryDependencies: ['RGPD users+senders', 'DPA sub-processors', 'Gmail security verification']
  preLaunchGates: ['Gmail security audit (MVP-1)', 'Outlook admin consent (MVP-1)']
  keyRisks: ['Gmail API instability', 'state consistency Supabase×Gmail×LLM', 'LLM data retention']
  resilience: ['degraded modes per dependency', 'LLM bypass 60% rule-based', 'email queue Supabase downtime', 'backup email provider SES', 'CGV limitation responsabilité']
  prdSections: ['Invisible Product Architecture', 'Data Processing & Privacy Architecture', 'Integration Architecture & Constraints', 'Resilience & Degraded Modes', 'Trust & Transparency Architecture']
---

# Product Requirements Document - Kyrra

**Author:** Thomas
**Date:** 2026-03-10

## Executive Summary

Kyrra is an AI-powered B2B email management system that restores inbox sanity for business leaders overwhelmed by the explosion of AI-generated prospecting emails. Acting as an intelligent middleware between email providers (Gmail, Outlook) and users, Kyrra classifies incoming emails using contextual business intelligence — not generic rules — then surfaces what matters through graduated labels, one-line summaries, and a daily recap dashboard.

The product targets SMB executives and decision-makers (CEO, DRH, DSI) who waste 30-60 minutes daily sorting through irrelevant solicitations. Kyrra eliminates this cognitive load by automatically categorizing emails into three tiers (À voir / Filtré / Bloqué), auto-whitelisting known contacts from sent history, and adapting filtering intensity through user-controlled exposure modes (Strict / Normal / Permissive). Nothing is ever deleted from your inbox — quarantined emails remain in Gmail with labels. Classification metadata retained for 90 days; aggregated stats retained longer.

### What Makes This Special

Kyrra occupies a unique position at the intersection of email filtering and intelligent summarization with B2B contextual awareness. Existing tools either block (Mail In Black, spam filters) or summarize (Shortwave, Superhuman) — none combine both with domain-specific intelligence that understands the difference between a relevant supplier proposal and generic outreach in the user's specific industry.

Three capabilities define the differentiation:
1. **Contextual business AI** — A dual-layer model (universal prospecting detection + per-role relevance scoring) that learns the user's professional context, not just sender reputation
2. **Intelligent summarization** — Important emails are pre-digested with one-line summaries, giving users a 30-second overview of their day before opening a single message
3. **User-controlled intelligence** — Kyrra proposes, the user decides. Exposure modes, graduated labels, and full transparency (confidence scores, classification rationale) ensure trust in a zero-error-tolerance system

The timing is critical: AI prospecting tools have fundamentally broken the sending/receiving asymmetry of professional email since 2024. Kyrra applies the same weapon (AI) on the receiver's side — the right product at the inflection point.

## Project Classification

| Dimension | Value |
|-----------|-------|
| **Type** | SaaS B2B (MVP-1) / Email Integration Tool (MVP-0) |
| **Pattern** | Invisible SaaS + Middleware |
| **Domain** | Data Privacy AI |
| **Complexity** | HIGH (near-critical) — distributed state, regulatory blocker, trust-sensitive |
| **Trust Model** | Zero error tolerance |
| **Context** | Greenfield |
| **Regulatory Dependencies** | RGPD (users + senders), DPA sub-processors, Gmail security verification |
| **Pre-launch Gates** | Gmail security audit (MVP-1), Outlook admin consent (MVP-1) |
| **Resilience Architecture** | Degraded modes per dependency, LLM bypass (60% rule-based), email queue, backup email provider |

## Success Criteria

### User Success

The fundamental user success signal for an invisible SaaS is **absence of friction** — when users stop thinking about email noise, Kyrra has succeeded. The dashboard provides the conscious "value confirmation" moment; the labels provide the unconscious daily benefit.

| Metric | MVP-0 Target | MVP-1 Target | Measurement |
|--------|-------------|-------------|-------------|
| Weekly engagement (app OR Recap) | ≥70% at W5 | ≥65% MAU | Analytics + email open tracking |
| Reclassification rate | <5% | <3% | User label corrections / total classified |
| Reclassification rate trend | Decreasing over 5 weeks | Continuously decreasing | Weekly cohort analysis — proves AI learns from corrections |
| Whitelist false positive rate | 0% | 0% | Known contacts incorrectly filtered |
| TTFV perceived | <5 min | <3 min | Instant scan stats at onboarding ("Kyrra analyzed 847 emails, 312 were noise") |
| Time-to-trust | ~2-3 weeks | ~1-2 weeks | Measured via quarantine check rate decline |
| Quarantine check rate | High W1 (normal), declining W3-4 | Low steady state | Frequency of user reviewing filtered emails — trust proxy |
| Recap Click Rate | >25% | >30% | Email analytics |
| Dashboard session frequency | 3x/week | 4x/week | App analytics |
| Sean Ellis test ("very disappointed") | >40% at W4 | >50% quarterly | PMF survey — primary for MVP-0 |

**Success moments (in order):**
1. Onboarding scan completes → "Kyrra analyzed 847 emails, 312 were noise" (minute 3)
2. First morning with a visibly cleaner inbox (Day 1)
3. Opening the dashboard and seeing filtering stats + important email summaries with confidence scores (Day 1)
4. Receiving first Kyrra Recap and grasping the day in 30 seconds (Day 2)
5. Stopping checking quarantine because trust is established (Week 2-3)
6. Forgetting Kyrra exists because the inbox just works (Week 3+)

### Business Success

| Metric | MVP-0 (Beta) | MVP-1 (12 months) | Alert Threshold |
|--------|-------------|-------------------|-----------------|
| Active users | 30 active at W5 / 50 enrolled | 500 paying | <20 active at W5 → pivot |
| Sean Ellis PMF test | >40% "very disappointed" | >50% | <30% → critical value problem |
| Payment intent signal | ≥5 users willing to pay | 10% monthly conversion (free→pro) | <3 signals → pricing/value problem |
| MRR | N/A (free beta) | 7,500€ (500 × 15€) | <3,000€ at M12 → growth problem |
| Churn | <10% monthly | <8% monthly (<5% from M18) | >15% → trust or value issue |
| CAC payback | N/A | <3 months (CAC max ~45€) | >6 months → unit economics broken |
| Referral rate | Track only | >5% users share at least 1x | <2% → add viral mechanics |

**Free plan paywall (defined now, activated MVP-1):** Free = 30 emails classified/day, no Recap, no summaries. Pro = unlimited + Recap + summaries + advanced stats. Prevents "free-to-paid" resistance by establishing value tiers from the start.

**Viral mechanism:** Recap email footer includes "Share Kyrra" referral link with tracking. Dashboard includes "Invite a colleague" CTA.

### Technical Success

> *Detailed measurable targets formalized in [Non-Functional Requirements](#non-functional-requirements). NFRs take precedence in case of conflict.*

| Metric | Target | Rationale |
|--------|--------|-----------|
| Email processing latency | <2 min end-to-end | Email is async; users expect minutes, not seconds |
| Email reconciliation gap | <5 min | Polling job catches missed Gmail Pub/Sub notifications (0.5-1% loss rate) |
| System uptime | 99.5% | Email tolerance is higher than real-time apps |
| LLM bypass rate | ≥60% rule-based | Cost resilience + speed; LLM only for ambiguous cases |
| LLM classification accuracy | >95% | On the 40% that reach the model; validated via reclassification feedback |
| LLM cost per user | <0.70€/month | Alert at 0.50€; degraded mode (80% bypass) triggered at 1€/user |
| Infrastructure cost per user | <2€/month | LLM + Supabase + Postmark + hosting combined |
| Zero data retention compliance | 100% | Email content never persisted; metadata with legal basis only |
| Metadata auto-purge | <90 days | RGPD compliance — automated deletion of stored metadata |
| Data access/deletion response | <72h | Legal obligation 30 days, target 72h for trust |
| Incident notification | <72h to CNIL | RGPD breach notification requirement |
| Degraded mode recovery | <5 min | When any dependency fails, graceful fallback within 5 min |

### Measurable Outcomes

**North Star Metric (evolving):**
- **MVP-0:** Weekly retention rate ≥70% at W5 — proves the core value proposition
- **MVP-1:** WAU (Weekly Active Users) — combines invisible value (labels) + conscious engagement (dashboard/Recap)

**Trust Score (composite):**
Reclassification rate + whitelist accuracy + confidence score acceptance + quarantine check decline rate = single trust indicator. Target: >85/100. Below 70 = emergency product review.

**Product-Market Fit signal:** Sean Ellis test >40% "very disappointed" at W4 beta.

**AI Learning signal:** Reclassification rate must be monotonically decreasing across beta weeks. Stagnation = static filter, not AI — requires immediate model tuning.

## Product Scope

### MVP-0 — Beta (8 weeks dev + 5 weeks beta)

**Gmail integration only.** Core classification engine + graduated labels + Kyrra Recap + web dashboard.

| Feature | Priority | Success Gate |
|---------|----------|-------------|
| Gmail OAuth + API middleware | P0 | Connects and syncs without error |
| Whitelist auto-generation (6-month sent scan) | P0 | >95% known contacts identified |
| AI classification (3 labels: À voir / Filtré / Bloqué) | P0 | <5% reclassification rate |
| LLM bypass for obvious cases (fingerprints, rules) | P0 | ≥60% emails classified without LLM |
| One-line email summaries (important emails) | P0 | Users report understanding email in <5 sec |
| Confidence score per classification | P0 | Visible to user, builds trust in zero-error-tolerance system |
| Web dashboard (stats, summaries, label breakdown) | P0 | 3x/week average session frequency |
| Onboarding instant scan stats ("wow moment") | P0 | TTFV <5 min perceived |
| Email reconciliation polling job | P0 | <5 min gap on missed Pub/Sub notifications |
| Kyrra Recap (daily HTML email) | P0 | >25% open rate, >15% click rate |
| Exposure mode selector (3 modes) | P1 | Deployed W3-4 beta after threshold calibration |
| Ghost Bouncer auto-reply template | P2 (future consideration — no FR in MVP scope) | Deferred to V1.1+ backlog |

**Pre-launch gates:** Gmail API sensitive scopes in testing mode (<100 users, no audit required), RGPD compliance self-assessment, AIPD simplified (internal privacy impact assessment), DPA with LLM provider, Supabase EU Frankfurt.

### Growth Features — MVP-1 (Post-Beta)

| Feature | Business Driver |
|---------|----------------|
| Outlook integration (Microsoft Graph API) | 40%+ of B2B market uses Outlook |
| Gmail security verification (sensitive scopes) | Required for >100 users |
| AIPD formal (external privacy impact assessment) | Required before Gmail security audit |
| Landing page with premium UX | Conversion funnel for organic/paid traffic |
| Free plan paywall activation | Revenue enablement (30 emails/day free vs Pro unlimited) |
| Enhanced dashboard (advanced stats, trends, filtering history) | User retention + premium feel |
| Team plan (shared whitelist, admin console) | ARPU expansion (19€/user) |
| Dual-model AI (universal + per-role) | Classification accuracy improvement |
| Adaptive Recap (daily/weekly based on volume) | Reduce notification fatigue |
| Stripe billing integration | Revenue enablement |
| Referral mechanism in Recap + dashboard | Viral growth driver |

### Vision — Future (V1.1 / V2 / V3)

| Horizon | Features |
|---------|----------|
| V1.1 | IMAP/SMTP support, calendar integration, browser extension |
| V2 | Multi-role support (DRH, DSI personas), collective intelligence model trained on aggregated data |
| V3 | Email composition assistant, predictive sender scoring, API marketplace for CRM integration |

> *See [Project Scoping & Phased Development](#project-scoping--phased-development) for detailed phase breakdown, success gates, entry triggers, and contingencies.*

## User Journeys

### Journey 1: Marc — The Clean Inbox Morning (Primary User, Success Path)

**Marc, 47, CEO of a 12-person digital acquisition agency in Lyon.** His inbox is a warzone — 60+ emails daily, half of which are SaaS vendors, recruitment agencies, and "partnership opportunities" from people he's never met. He's tried Gmail filters, but they're too rigid. He's tried unsubscribing, but the prospecting emails aren't newsletters — they're personalized cold outreach that slips through every filter. He spends 25 minutes every morning just deleting noise before he can start working.

**Opening Scene:** Monday morning, 8:15 AM. Marc opens Gmail on his phone with his coffee, bracing for the usual wall of unread emails. But something's different. His inbox has 23 emails instead of the usual 55+. Three new Gmail labels catch his eye: "Kyrra — À voir" (4), "Kyrra — Filtré" (18), "Kyrra — Bloqué" (10). The emails in his main inbox are the ones that matter — his accountant, two clients, his business partner.

**Rising Action:** Curious, Marc opens the Kyrra dashboard on his phone. The first thing he sees: "32 emails filtered overnight — 94% confidence average." A clean breakdown: 10 blocked (obvious mass prospection), 18 filtered (personalized but irrelevant outreach), 4 flagged as "worth a look" (a coworking space proposal in his sector, a SaaS tool his competitor uses). Below that, one-line summaries of his 5 important emails — he grasps his morning in 20 seconds without opening a single message. Each filtered email shows a confidence score: "Filtered — 96% confidence" on an obvious cold email, "À voir — 72% confidence" on an ambiguous one.

**Climax:** Marc clicks on "Kyrra — À voir" and finds a proposal from a marketing automation vendor. Normally, he'd have deleted it without reading. But Kyrra flagged it as potentially relevant because it matches his agency's sector. He reads the summary: "Marketing automation SaaS offering agency-specific pricing, references 3 agencies similar to yours." He decides to respond. Kyrra just saved him from dismissing a genuinely useful lead buried in the noise.

**Resolution:** By 8:25 AM, Marc is done with email. Ten minutes instead of thirty-five. He checks his Kyrra Recap email over lunch — a quick HTML digest confirming what was filtered, with stats: "This week: 156 emails filtered, 12 opportunities surfaced, 23 minutes saved daily." After two weeks, he stops checking the quarantine. He simply trusts it. When his business partner asks how he handles his inbox, Marc shares his referral link. He can't imagine going back.

**Requirements revealed:** Gmail OAuth + label sync, AI classification engine (3 tiers), confidence scores, one-line summaries, web dashboard (mobile-responsive), Kyrra Recap email, onboarding scan, referral mechanism.

---

### Journey 2: Marc — The False Positive Crisis (Primary User, Edge Case)

**Same Marc, Week 1 of using Kyrra.** Trust is still building — he checks "Kyrra — Filtré" every morning.

**Opening Scene:** Wednesday, 9 AM. Marc's biggest client, Dupont & Fils, has a new procurement director. She emails Marc from her personal address (not the usual @dupont-fils.fr) about renewing their contract. Kyrra classifies it as "Filtré — 68% confidence" because the sender is unknown and the email mentions pricing — a pattern common in prospecting.

**Rising Action:** Marc discovers the email in the filtered label at 11 AM — two hours after it arrived. His stomach drops. He opens the Kyrra dashboard, sees the classification rationale: "Unknown sender, pricing language detected, no prior exchange history." He understands the logic — Kyrra couldn't have known — but the anxiety spike is real. This is exactly what he feared.

**Climax:** Marc reclassifies the email as "Non-commercial" with one click. Kyrra immediately learns: this sender is now whitelisted, and the system adjusts its model for future emails from personal addresses that reference known company domains. Marc also replies to the client — the 2-hour delay wasn't catastrophic, but it was uncomfortable.

**Resolution:** Marc checks the dashboard the next day. The reclassification rate for his account dropped from 4.2% to 3.8% — the system learned. Over the next week, two similar edge cases (new contacts at existing clients) are correctly classified as "À voir" instead of "Filtré." The confidence score display helped Marc understand WHY the error happened, which prevented him from losing trust entirely. By Week 3, his quarantine check rate drops to once every 2-3 days. Trust recovered — because the system was transparent about its uncertainty.

**Requirements revealed:** Reclassification mechanism (one-click), classification rationale display, learning feedback loop, confidence score transparency, sender whitelisting from reclassification, cross-domain sender correlation (personal email → company domain inference).

---

### Journey 3: Nathalie — The Overwhelmed DRH (Secondary User, V2 Expansion)

**Nathalie, 39, DRH of a 200-person industrial company in Toulouse.** She receives 80+ emails daily — half are recruitment agency pitches, employer branding vendors, training providers, and workplace wellness platforms. Her actual HR work (employee relations, legal compliance, contract negotiations) drowns in commercial noise. Unlike Marc, she can't simply ignore prospecting — some recruitment agencies send relevant candidates, and some training providers offer mandatory compliance training.

**Opening Scene:** Nathalie has been using Kyrra for a month (V2 with DRH role profile). Her exposure mode is "Permissive" because she genuinely needs to evaluate some commercial proposals. Her inbox this morning: 15 real emails, 8 "À voir," 42 "Filtré," 17 "Bloqué."

**Rising Action:** She opens the dashboard. The "À voir" category is her goldmine — Kyrra understands that a recruitment agency email mentioning a "Développeur senior Java" matches her current open position (synced from her calendar invite: "Entretien dev Java — 14h"). A generic email from the same agency about "office management profiles" was correctly filtered. She scans the one-line summaries: 3 of the 8 "À voir" emails are worth opening. Five seconds per summary. Done in under a minute.

**Climax:** Nathalie switches to "Strict" mode before a critical employee negotiation day — she needs zero distractions. Kyrra's threshold tightens: only whitelisted senders and emails classified with >95% confidence as non-commercial reach her inbox. Everything else queues silently. At 6 PM, she switches back and reviews the day's filtered emails in one batch via the Recap.

**Resolution:** Nathalie's weekly time on email dropped from 8 hours to 4.5 hours. The DRH-specific model understands the nuance between a relevant recruiter and a generic pitch. Her team lead asks about the tool — she forwards the referral link. Kyrra's role-based intelligence is the differentiator that generic filters can never match.

**Requirements revealed:** Role-specific AI profiles (DRH, DSI, CEO), exposure mode switching with immediate effect, contextual classification (calendar integration in V2), batch review workflow, role-based model training.

---

### Journey 4: Sophie — The Cautious Freelancer (Free Plan User)

**Sophie, 34, independent management consultant based in Bordeaux.** She receives 30 emails daily — manageable, but 10-15 are prospecting from SaaS tools, coworking spaces, and accounting platforms. She doesn't want to pay 15€/month for email filtering — her margins are tight — but the free plan's 30 emails/day classification would cover her prospecting volume perfectly.

**Opening Scene:** Sophie discovers Kyrra through a LinkedIn post from Marc (referral). She signs up, connects Gmail in 3 minutes. The onboarding scan runs: "Kyrra analyzed 412 emails from the last 6 months. 178 were commercial noise. 12 known contacts whitelisted from your sent history." She's impressed — the numbers match her gut feeling.

**Rising Action:** Day 1, Sophie's free plan kicks in. Kyrra classifies 18 emails (within her 30/day limit). 11 filtered, 2 "À voir," 5 left in inbox. No Recap email (Pro only), no summaries (Pro only). She checks the dashboard — basic stats only: "11 filtered today." It's useful but feels limited. She notices the "Unlock Recap + Summaries → Pro 15€/month" prompt.

**Climax:** After two weeks, Sophie hits the 30/day limit on an exceptionally busy Tuesday — 36 emails arrived, 6 weren't classified. Those 6 happened to include 3 obvious prospecting emails she had to sort manually. The friction is subtle but real: the product works well enough that the gap is noticeable.

**Resolution:** Sophie upgrades to Pro at the end of Month 1. The Recap email and summaries are what convince her — she realizes the 15€/month saves her 45 minutes weekly, worth 3x her hourly rate. She's not Kyrra's highest-value user, but she's proof that the free→Pro funnel works. Her CAC was zero (organic referral from Marc).

**Requirements revealed:** Free plan limitations (30 emails/day, no Recap, no summaries), upgrade prompts (non-aggressive), onboarding scan stats, referral attribution tracking, free-to-Pro conversion funnel, graceful degradation at plan limits.

---

### Journey 5: Thomas, Hadrien & Félix — The Founders Operating Kyrra (Admin/Ops)

**Thomas, Hadrien and Félix, co-founders of Kyrra.** Week 3 of MVP-0 beta with 35 active users. They wear every hat: support, ops, monitoring, and product decisions.

**Opening Scene:** Monday 7:30 AM. Thomas opens the admin dashboard. Overnight stats: 2,847 emails processed across 35 users. 62% handled by rules (above the 60% target), 38% by LLM. Average processing latency: 1m12s. One anomaly flag: user #17 (a recruiter) had a 12% reclassification rate last week — way above the <5% target.

**Rising Action:** Hadrien investigates user #17. The admin panel shows classification logs (metadata only, no email content — RGPD compliant): the recruiter receives emails from candidates AND recruitment agencies. Kyrra's model struggles to distinguish candidate responses from agency prospecting — both mention job titles, salaries, and CVs. Hadrien flags this as a model edge case and adds "recruiter role" to the V2 backlog.

**Climax:** Thursday 2 PM. The Gmail Pub/Sub notification system drops 3 notifications (0.1% loss rate, expected). The reconciliation polling job catches the gap within 4 minutes — no user impact. But simultaneously, the LLM provider has a 15-minute latency spike. Kyrra's degraded mode kicks in: emails that would normally go to the LLM are classified by rules with lower confidence scores. Users see "Filtré — 61% confidence (degraded mode)" instead of the usual 85%+. Félix monitors the recovery — LLM latency normalizes, the queue drains in 8 minutes. Three users noticed slightly lower confidence scores but no emails were lost.

**Resolution:** Friday. The founders review the weekly beta report: Sean Ellis survey sent to all 35 active users. 14 responses (40% response rate). 9 said "very disappointed" if Kyrra disappeared (64% — well above the 40% target). LLM cost for the week: 18.40€ across 35 users = 0.53€/user/month (within the <0.70€ target). Thomas writes the weekly changelog email to beta users. Hadrien plans the next sprint. Félix reviews the AIPD checklist. The system works — now they need to scale it.

**Requirements revealed:** Admin dashboard (user-level stats, anomaly detection, classification logs), reconciliation job monitoring, degraded mode visibility, LLM cost tracking, beta survey tooling, per-user reclassification analytics, RGPD-compliant admin access (metadata only).

---

### Journey Requirements Summary

| Capability Area | Journeys That Require It | Priority |
|----------------|-------------------------|----------|
| Gmail OAuth + label sync | All user journeys | P0 |
| AI classification (3 labels) | Marc, Nathalie, Sophie | P0 |
| Confidence scores + rationale | Marc (both), Nathalie | P0 |
| One-line email summaries | Marc, Nathalie (Pro only) | P0 |
| Web dashboard (user-facing) | Marc, Nathalie, Sophie | P0 |
| Kyrra Recap email | Marc, Nathalie (Pro only) | P0 |
| Onboarding scan + instant stats | Marc, Sophie | P0 |
| Reclassification mechanism | Marc (false positive) | P0 |
| Learning feedback loop | Marc (false positive) | P0 |
| Reconciliation polling job | Founders (ops) | P0 |
| Free plan limits + upgrade prompts | Sophie | MVP-1 |
| Exposure mode selector | Marc, Nathalie | P1 (W3-4 beta) |
| Admin dashboard (ops) | Founders | P1 |
| Role-specific AI profiles | Nathalie | V2 |
| Referral mechanism | Marc, Sophie | MVP-1 |
| Degraded mode handling | Founders (ops) | P0 |

## Domain-Specific Requirements

### Compliance & Regulatory

**RGPD / GDPR (dual obligation):**
- **User data:** Consent-based processing, right to access/delete/portability, data minimization. Legal basis: contract.
- **Sender data (third-party):** Metadata of non-consenting senders processed under legitimate interest. Requires documented Legitimate Interest Assessment (LIA) included in AIPD.
- **Email content:** Zero retention — content processed in-memory, only classification result + confidence score + PII-stripped summary stored. LLM receives headers + first 500 characters + last 50 characters only (captures greeting + CTA pattern, not full body).
- **PII stripping (3 layers):** (1) LLM prompt instruction to exclude personal data from summaries, (2) regex post-processing on returned summaries (phone, email, address, financial patterns), (3) monitoring of regex-flagged summaries to measure and reduce LLM leakage rate.
- **Summary retention:** Summaries purged at 90 days alongside raw metadata. Only weekly aggregates survive.
- **Metadata retention — Two-level aggregation:**
  - **Level 1 (personal):** Per-user, weekly aggregates — retained 1 year, subject to RGPD rights. Powers personal dashboard ("This year: 5,200 emails filtered").
  - **Level 2 (anonymous):** Cross-user, daily aggregates — retained indefinitely, outside RGPD scope. Powers marketing metrics ("Kyrra filtered 2M emails").
  - **Raw metadata** (sender, subject, timestamps): auto-purge at 90 days maximum.
- **Whitelist storage:** Addresses stored as **SHA-256 hashes** (non-reversible). Two levels: hash of full address (exact match) + hash of domain (domain-level match). Cross-domain inference (personal email → company domain) performed in-memory only, never persisted.
- **Data Subject Rights:** Automated pipeline, response within 72h (target), 30 days (legal max).
- **Sub-processor DPA:** Required with LLM provider, email delivery (Postmark/SES), hosting (Supabase), logging service. Each DPA must cover: EU data residency, zero training on user data, explicit coverage of partial content transfer (500+50 chars).

**Secret des correspondances (French law, Art. 226-15 Code pénal):**
- Automated email classification touches correspondence privacy law. Defense: explicit user consent (OAuth + CGU), fully automated processing, zero content retention.
- **CGU must include dedicated paragraph** on correspondence secrecy and consent to automated processing.

**AI Learning & Training:**
- **MVP-0 / MVP-1:** Learning via derived rules only (whitelist additions, domain patterns, reclassification signals). No ML fine-tuning on personal data.
- **V2 (collective model):** Requires separate explicit consent + anonymized training data. Not in scope for MVP.

**AIPD (Privacy Impact Assessment):**
- **MVP-0:** Simplified internal AIPD. Sufficient for <100 users beta.
- **MVP-1:** Formal AIPD — external DPO review. Required before Gmail security verification audit.

**Gmail API Compliance:**
- **MVP-0 (<100 users):** Sensitive scopes (gmail.modify) in "testing" mode — no Google security audit required for <100 users, but scopes remain sensitive.
- **MVP-1 (>100 users):** Same sensitive scopes require Google security verification (~1,500€, 4-8 weeks). Must comply with Gmail API Limited Use Policy.
- **Labels referenced by internal ID** (never by name) — resilient to user renaming/reorganizing. Auto-recreation with notification if user deletes a label.

**Microsoft Graph API (MVP-1 Outlook):**
- Admin consent required for enterprise tenants. Microsoft publisher verification required.

### Technical Constraints

**Security:**
- OAuth tokens encrypted at rest (AES-256) and in transit (TLS 1.3).
- Token refresh with graceful degradation — notify user, pause processing, never lose data.
- No email content stored anywhere — classification pipeline stateless for content.
- **Prompt injection resistance (P0):** Emails are untrusted content passed to LLM. Mitigations: (1) strict sandbox separation between system prompt and email content, (2) system/developer messages resistant to injection, (3) LLM output must be structured JSON with enum-constrained values (category + score 0-100), (4) output outside expected format → automatic fallback to rules engine.
- **Zero email content in application logs (P0).** Log only: email_id, classification_result, confidence_score, processing_time. LLM requests never logged in full. Logging service must have signed DPA.
- **Debug mode (controlled):** Activated per-user with explicit consent (in-app notification), 24h max, auto-purge after resolution, full audit trail. Only for production incident investigation.
- Audit log of all data access (who accessed what metadata, when).

**Privacy by Design:**
- LLM receives headers + first 500 chars + last 50 chars only — captures greeting + CTA pattern, sufficient for 95%+ classification accuracy.
- PII stripping 3-layer pipeline on all generated summaries.
- LLM provider contractually bound to zero data retention.
- Supabase Row Level Security (RLS) — users access only their own data, enforced at database level.
- **Admin access model:** Dashboard shows aggregates by default. Access to detailed metadata requires documented justification, logged in audit trail.

**Distributed State Consistency:**
- Three systems: Supabase (classification results), Gmail (labels), LLM (processing).
- **Gmail is master, Supabase is replica.** If states disagree, Gmail wins.
- **Label changes in Gmail = implicit reclassification.** User removing/adding Kyrra labels detected by polling, synced to Supabase as correction signal.
- **Reconciliation polling (adaptive):** 5 minutes during business hours (8h-19h), 30 minutes off-hours. Compares label state Gmail vs Supabase — detects missed Pub/Sub AND user label modifications.
- Idempotent processing — same email processed twice produces identical results.
- Queue-based architecture — dependency downtime queues emails, zero loss guarantee.

**Gmail API Technical:**
- Labels by ID, stored mapping label_id ↔ kyrra_category in Supabase.
- **Rate limiting:** Exponential backoff + progressive scan for onboarding whitelist (6-month sent history).

**LLM Dependency:**
- Multi-provider readiness: primary (GPT-4o-mini or Claude Haiku), fallback provider.
- Cost circuit breaker: alert at 0.50€/user, degraded mode (80% bypass) at 1€/user.
- Latency circuit breaker: LLM response >10s → route to rules engine.

**Kyrra Recap Email (privacy-safe):**
- Recap contains **functional summaries** (role + urgency + action required, no PII): "Email from your accountant: action required this week (fiscal)" — not "Durand Comptabilité: TVA Q4, sign by Friday, 47K€."
- Sensitive details (names, amounts, exact dates) available only in dashboard.
- Postmark sees functional summaries, not exploitable correspondence content.

### Integration Requirements

| Integration | Protocol | MVP Phase | Constraints |
|------------|----------|-----------|-------------|
| Gmail | REST API + Pub/Sub | MVP-0 | OAuth 2.0, labels by ID, adaptive polling, rate limiting with backoff |
| Outlook | Microsoft Graph API | MVP-1 | Admin consent enterprise, publisher verification |
| LLM Provider | REST API | MVP-0 | Headers + 500+50 chars, zero retention DPA, structured JSON output, prompt injection hardened |
| Supabase | PostgreSQL + Realtime | MVP-0 | EU Frankfurt, RLS enforced, 90-day raw purge, two-level aggregates |
| Postmark | SMTP API | MVP-0 | Recap delivery (functional summaries only), transactional |
| SES (backup) | SMTP API | MVP-1 | Fallback if Postmark fails |
| Stripe | Payment API | MVP-1 | Subscription billing, webhook-driven |
| Logging service | API | MVP-0 | DPA required, zero email content policy enforced |

### Risk Mitigations

> *See [Risk Mitigation Strategy](#risk-mitigation-strategy) in Project Scoping section for full probability/impact analysis with contingencies.*

| Risk | Severity | Mitigation | Detection |
|------|----------|-----------|-----------|
| False positive on critical email | CRITICAL | Confidence scores, never delete, quarantine review, one-click reclassification | Reclassification rate, quarantine check rate |
| Prompt injection via email content | HIGH | Sandboxed prompt, structured JSON output, format validation, rules fallback | Output format monitoring, anomalous confidence scores |
| Gmail API scope rejection | HIGH | Sensitive scopes in testing mode for beta, security audit prep early | Pre-submit review, budget 1,500€ + 8 weeks |
| Secret des correspondances complaint | MEDIUM | Explicit CGU consent, automated processing, zero retention, LIA documented | Legal monitoring, complaint tracking |
| LLM provider price increase | MEDIUM | 60-80% rule bypass, multi-provider, cost circuit breaker | LLM cost per user tracking |
| RGPD complaint from sender | MEDIUM | LIA documented, metadata-only, 90-day purge, hashed whitelist, rapid deletion | Data request tracking |
| Distributed state desync | MEDIUM | Gmail-master adaptive polling, delta detection, idempotent processing | Reconciliation gap monitoring |
| Email content in logs (accidental) | MEDIUM | Zero content logging policy (P0), logging service DPA, controlled debug mode | Log audit, pre-commit lint rules |
| Gmail label deletion by user | LOW | Labels by ID, auto-recreation, user notification | Polling delta detection |
| LLM data leak | HIGH | DPA zero-retention, 500+50 chars only, PII stripping, provider audit rights | Annual compliance review |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Fingerprinting Engine — First Line of Defense (Core Technical Innovation)**
Multi-layer fingerprinting engine handles 65-70% of classification without any AI (target, requires empirical validation in MVP-0 beta). Three detection layers: (1) **Technical header fingerprints** (~40%): X-Mailer signatures, Message-ID patterns from prospecting tools (Lemlist, Apollo, Instantly, Woodpecker), DKIM domain mismatches, bulk-send timestamp clustering, malformed List-Unsubscribe headers. (2) **Domain reputation** (~15%): known prospecting tool sending domains, freshly registered domains, SPF/DMARC patterns. (3) **Subject pattern matching** (~10%): common prospecting templates. **Fingerprint library requires monthly updates** — prospecting tools evolve, signatures change. This maintenance cadence is part of the competitive moat.

**2. Prompt Engineering + Hybrid Architecture (MVP Innovation)**
MVP innovation is architectural, not algorithmic. No proprietary model — GPT-4o-mini or Claude Haiku with well-crafted system prompt + user business context achieves 95%+ accuracy on the ambiguous 30-35%. The innovation is the **hybrid rules+LLM architecture**: cost resilience, latency resilience, privacy resilience (65-70% of emails never leave the system). Proprietary fine-tuned model = V2 milestone with anonymized collective training data and separate consent.

**3. Invisible SaaS Architecture with Value Reinforcement**
Primary value delivered inside Gmail (labels, clean inbox). Dashboard and Recap are secondary value confirmation layers. Critical invisible SaaS pattern: **monthly value stats integrated in first Recap of each month** — "March 2026: 1,247 emails filtered, ~8h saved, estimated value 320€." Prevents involuntary churn from users forgetting they pay. No separate email — same channel, enriched content. **Churn reason tracking via behavioral proxies:** "forgot" = no app/Recap activity 30+ days with reclassification <3% (product worked). "Unsatisfied" = reclassification >8% OR support ticket OR labels disabled. **Win-back email** 7 days post-churn: "Kyrra misses you — 847 emails would have been filtered this month."

**4. Privacy-First AI Processing**
Headers + 500+50 chars, PII stripping 3-layer pipeline, structured JSON output, zero content retention. Novel approach to AI + privacy tension. Most competitors either ignore privacy (US-based) or avoid AI entirely (rule-based only).

**5. Trust Architecture for Zero-Error-Tolerance**
Confidence scores visible **only on doubt** (<75% confidence) — not on every email. Power users can opt into full score visibility via dashboard advanced mode. Classification rationale available on demand. Graduated labels (never delete), exposure modes, quarantine-check-rate as trust metric. **Push notification for low-confidence "À voir" emails** (P1) — reduces anxiety without requiring quarantine review.

### UX Innovation

**Dashboard dual mode:**
- **Simple mode** (default for non-tech): One number ("23 emails filtered today"), one alert if doubt ("1 email needs your attention"). Clean, minimal, zero cognitive load.
- **Detailed mode** (opt-in for power users): Full stats, rules vs LLM breakdown, confidence score distribution, reclassification history, filtering trends.

**Exposure modes with functional descriptions:**
- **Strict** — Known contacts only, maximum filtering
- **Normal** — Intelligent filtering, balanced approach
- **Permissive** — More proposals visible, active opportunity search

Mode switch accessible from Recap email (one-click deep link) + dashboard.

**Onboarding-to-trial flow:**
14-day Pro trial for all new users (full features). After trial: downgrade to free plan (30 emails/day classified, no Recap, no summaries) or upgrade to Pro. Shows full value before any limitation.

### Defense Against Commoditization

**Threat:** Gmail (Gemini) and Outlook (Copilot) may add native prospecting filtering within 18 months.

**MVP defense (available now):**

| Advantage | Why Platforms Won't Replicate |
|-----------|------------------------------|
| **Specialized fingerprinting engine** | Platform providers use generic spam models. Kyrra's library is B2B-prospection-specific, updated monthly |
| **Transparency** (confidence scores, rationale) | Platform AI is opaque by design |
| **Kyrra Recap** (filtered email digest) | Platforms silently hide filtered emails — no summary, no digest |
| **Cross-provider** (Gmail + Outlook) | Google won't improve Outlook, Microsoft won't improve Gmail |

**V2+ defense (long-term moat):**

| Advantage | Why It's Defensible |
|-----------|-------------------|
| **Per-role business context** (CEO ≠ DRH ≠ DSI) | Requires domain-specific training data platforms don't have |
| **Collective intelligence model** | Aggregated anonymized data from thousands of B2B users — network effect |
| **User-controlled exposure modes** | Too complex for platform mass UX |

### Validation Approach

| Innovation | Validation Method | MVP-0 Signal | MVP-1 Signal (500 users) | V1.1 Signal (2,000 users) |
|-----------|------------------|-------------|--------------------------|---------------------------|
| Fingerprinting engine | Measure rules-only rate | ≥65% without LLM, <3% FP | Ratio maintained ≥60% | Library update cadence <monthly |
| Prompt engineering | Reclassification on LLM emails | <5% | <3% across diverse profiles | Stable across model updates |
| Invisible SaaS | Retention without app usage | ≥70% W5 | Churn "forgot" <20% total | Monthly value stats open rate >40% |
| Privacy-first AI | Compliance assessment | Zero complaints | Gmail audit passed | Annual DPO review clean |
| Trust architecture | Quarantine check trajectory | Declining W1→W3 | Steady low state | New user trust established <2 weeks |

### Risk Mitigation

| Innovation Risk | Fallback |
|----------------|----------|
| Fingerprinting <50% detection | Increase LLM routing (+cost), invest in header pattern library |
| Prompt engineering inaccurate | Increase context, add user business context at onboarding, fine-tuning at V2 |
| Too invisible = churn | Monthly value stats in Recap, push notifications for high-value filtered emails, win-back emails |
| Google/Outlook native filtering | Double down on specialization + transparency + cross-provider + Recap |
| Privacy too restrictive for UX | Opt-in richer summaries in Recap (user consent) |
| Trust not established | Trust calibration period — first 2 weeks conservative, borderline → "À voir" |

## SaaS B2B Specific Requirements

### Project-Type Overview

Kyrra is a **single-tenant-per-user SaaS** (not multi-tenant in the enterprise sense) for MVP-0/MVP-1. Each user has isolated data (Supabase RLS). The Team plan (MVP-1) introduces lightweight multi-tenancy: shared whitelist + admin console within an organization, but each user retains individual classification preferences and exposure modes.

### Tenant Model

**MVP-0 / MVP-1 Pro (Individual):**
- Single user per account. Complete data isolation via Supabase Row Level Security.
- Each user has: own OAuth tokens, own whitelist (hashed), own classification history, own exposure mode settings, own reclassification feedback.
- No data sharing between users.

**MVP-1 Team Plan:**
- Organization-level entity: company name, admin user(s), member list.
- **Shared whitelist:** Organization-wide known contacts. Individual whitelists still exist — team whitelist is additive.
- **Admin console:** Admin views team-level aggregated stats. Cannot view individual user's email metadata or classification details.
- **Admin access by consent:** Admin can request temporary access (48h) to a team member's detailed stats for troubleshooting. Member receives notification and must accept. Logged in audit trail.
- **Individual autonomy preserved:** Each team member keeps own exposure mode and preferences. Admin cannot override individual settings.
- **Billing:** Single invoice per organization, per-seat pricing (19€/user/month).
- **Weekly team report:** Sent to admin — "Your team saved 40h this week by filtering 3,200 emails." Key selling feature for the Team plan.

**Team plan funnel:** Pro user (dirigeant) → equips their team → Team plan. Primary buyer: dirigeant TPE (5-15 persons) or Office Manager/DAF PME (20-100 persons).

**V2+ Enterprise (Future):**
- SSO (SAML/OIDC), directory sync (Azure AD, Google Workspace).
- Role-based team configuration (all DRH get DRH profile by default).
- Organization-wide policy controls.

### RBAC & Permission Matrix

| Role | View Own Data | View Team Stats | Manage Billing | Manage Members | View Member Details | System Admin |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| Free User | ✅ | — | — | — | — | — |
| Pro User | ✅ | — | ✅ (own) | — | — | — |
| Team Member | ✅ | ✅ (aggregated) | — | — | — | — |
| Team Admin | ✅ | ✅ (aggregated) | ✅ (team) | ✅ | By consent (48h, logged) | — |
| Kyrra Founders (ops) | Metadata only | ✅ (all, aggregated) | — | — | On justification (audit logged) | ✅ |

**Key principle:** No role can view another user's email metadata without explicit consent or documented justification.

### Subscription Tiers

| Tier | Price | Limits | Features | Target |
|------|-------|--------|----------|--------|
| **Trial** | Free (14 days) | Unlimited | Full Pro features. CTA conversion push at day 7-10 | All new users |
| **Free** | 0€ | 30 emails/day | Basic classification + labels, dashboard (simple mode), no Recap, no summaries | Low volume, price-sensitive (Sophie) |
| **Pro** | 15€/month | Unlimited | Full classification, Recap (daily + monthly stats), summaries, dashboard (simple + detailed), exposure modes, confidence scores, referral | Individual decision-makers (Marc) |
| **Team** | 19€/user/month | Unlimited | All Pro + shared whitelist, admin console, team stats, weekly team report, priority support (SLA 4h) | Organizations 3+ users |

**Trial-to-conversion flow:**
- **Day 7:** Primary CTA — "7 days with Kyrra: 287 emails filtered, ~3.5h saved. Keep this for 15€/month." Push hard J7-J10.
- **Day 14:** Last reminder before trial ends.
- **Day 15:** Progressive degradation begins — lose detailed dashboard (keep simple mode).
- **Day 22:** Lose summaries. Message: "34 emails summarized this week — unlock for 15€/month."
- **Day 30:** Lose Recap. Classification continues on 30 emails/day free.
- Each loss accompanied by a value reminder showing what was lost in concrete terms.

**Billing mechanics:**
- Stripe subscription, monthly billing, cancel anytime.
- Trial → **post-trial grace period** (day 15-30) with progressive feature loss, then full Free plan activates at day 30. No charge at any point unless user explicitly upgrades.
- **Dunning:** Failed payment → 3 retry attempts over 7 days → grace period 7 days (product works, banner warning in dashboard + Recap). Pattern detection: 3rd failed cycle → grace reduced to 3 days.

### Acquisition & Growth Model

**Primary channel: Product-Led Growth (PLG).** Paid acquisition not viable at 15€/mois (CAC too high for SEM). Only viable channels:

| Channel | Mechanism | Phase |
|---------|-----------|-------|
| **Referral** (P0) | `?ref=` tracking in all shared links + "How did you discover Kyrra?" at signup | MVP-0 |
| **Organic/SEO** | Landing page + blog content on email productivity | MVP-1 |
| **Product Hunt launch** | One-time boost for initial traction | MVP-1 launch |
| **Word of mouth** | Monthly value stats in Recap (screenshot-worthy) | MVP-0 |
| **LinkedIn organic** | Founders sharing beta insights, user testimonials | MVP-0 |

**Referral tracking minimum (P0):** Attribution parameter on all shareable links, source tracking at registration, referral dashboard for users ("You referred 3 people").

**Note:** Free users retain referral capability via dashboard share button and referral link. Recap-based viral loop (referral link in footer) is a Pro-only incentive — deliberate trade-off to encourage upgrade while preserving Free-user viral potential through the dashboard channel.

### Support Model

| Tier | Support Channel | SLA | Phase |
|------|----------------|-----|-------|
| All users | FAQ / Help Center in-app | Self-service | MVP-0 |
| Pro | Email support | 24h response | MVP-1 |
| Team | Email support (priority) | 4h response | MVP-1 |
| Beta users | Direct founder contact (Slack/email) | Best effort, same day | MVP-0 |

Support = trust safety net during the time-to-trust phase (weeks 1-3).

### Business Milestones

| Milestone | Target | Metric |
|-----------|--------|--------|
| MVP-0 Beta validation | W5 beta | 30 active users, Sean Ellis >40%, ≥5 payment intent |
| MVP-1 Launch | M6 | Landing page live, Stripe active, 100 paying users |
| Product-Market Fit | M12 | 500 paying Pro users, 7,500€ MRR, churn <8% |
| **Founder viability** | **M18** | **~600 Pro users = 3 founders paid 2K€ net/month** |
| Growth phase | M24 | 2,000+ users, Team plan revenue >30% of MRR |

### Implementation Considerations

**Technology stack (pragmatic monolith + worker):**
- **API layer (serverless):** Next.js API routes on Vercel — webhook handling, dashboard API, user actions
- **Background workers (persistent):** Node.js process on Railway/Fly.io (~5$/month) — reconciliation polling, Recap generation, onboarding whitelist scan, fingerprint library updates
- **Database:** Supabase (PostgreSQL) EU Frankfurt — RLS, Realtime, Auth
- **Frontend:** Next.js + React on Vercel — dashboard, landing page, admin
- **Email delivery:** Postmark (primary) + SES (fallback)
- **LLM:** OpenAI API (GPT-4o-mini) primary, Anthropic (Haiku) fallback
- **Payments:** Stripe
- **Total infra MVP-0:** ~30-50$/month | **At 2,000 users:** ~900-1,000$/month (~3% MRR — healthy)

**Monolith → services migration triggers (metrics-based, not user-based):**
- Pipeline p95 latency > 3 minutes → extract classification engine as separate service
- Supabase cost > 30% of MRR → evaluate database optimization or migration
- Worker processing queue backlog > 30 minutes → scale workers horizontally

**Development timeline:** See [Development Timeline (Final)](#development-timeline-final) in Project Scoping section for sprint-level breakdown.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Problem-Solving MVP** — Prove that AI can reliably classify B2B prospecting emails with <5% reclassification rate and that users trust an invisible AI managing their inbox.

**Resource Requirements:** 3 co-founders (Thomas, Hadrien, Félix) — full-stack development + ops + legal prep. No external hires for MVP-0. 8 weeks development + 5 weeks beta. **Legal budget: 1K€** (template adaptation or external lawyer if needed).

**Scope Freeze Rule:** No new P0 features after sprint 2 kick-off. Any addition post-sprint-2 = P1 minimum.

### Technical Smoke Test (Sprint 1-4, 10 users)

**Purpose:** Validate the classification pipeline works in production before investing in UX layers. NOT a product beta — a technical validation with 10 hand-picked early adopters.

**Scope:**

| Feature | Purpose |
|---------|---------|
| Gmail OAuth + Pub/Sub pipeline | Core infrastructure validation |
| Fingerprinting engine (3 layers) | Rules-only classification rate measurement |
| LLM classification (headers + 500+50 chars) | AI accuracy validation |
| 3 graduated Gmail labels | User-visible output |
| Whitelist auto-generation (hashed) | False positive prevention |
| Reclassification mechanism (one-click in Gmail) | Error correction signal |
| Reconciliation polling (adaptive) | Missed email detection |
| Degraded mode (rules fallback) | Resilience validation |
| Daily stats email (plain text, cron script) | Minimal user feedback loop — "34 emails classified, 22 filtered, 8 blocked, 4 à voir" |

**Success gate (end of sprint 4):** Fingerprinting rate ≥50%, LLM reclassification <8%, zero missed emails, pipeline p95 latency <3 min. If these pass → proceed to MVP-0 Beta. If not → iterate sprint 5-6 on engine before building UX.

**Contingency:** If sprint 4 overruns by >1 week, cut all P1 features from MVP-0 Beta AND feedback modal.

### MVP-0 Beta (Sprint 5-8 + Weeks 9-13, 50 users)

**Purpose:** Full product validation — classification + UX + engagement + trust.

**P0 Features (must ship for beta):**

| Feature | Success Gate |
|---------|-------------|
| Web dashboard (simple mode default + detailed opt-in) | 3x/week session frequency |
| One-line email summaries (PII-stripped) | Users understand email in <5 sec |
| Confidence scores (visible only on doubt <75%) | Trust proxy — quarantine check declining |
| Onboarding instant scan stats ("wow moment") | TTFV <5 min |
| Kyrra Recap (daily HTML email, functional summaries) | >25% open rate |
| Referral tracking (`?ref=` + source attribution) | Attribution data collected |
| FAQ / Help Center in-app | Self-service support available |
| Mini-feedback modal (dashboard reclassification) | 3 options: faux positif / mauvaise catégorie / whitelist expéditeur |
| Banner "help Kyrra learn" (when Gmail reclassification detected) | Opt-in explicit feedback capture |
| Automated monitoring alerts (hourly cron → email/Slack founders) | Token errors, high reclassif, reconciliation gap, LLM errors |

**P1 Features (deploy during beta weeks 3-4):**

| Feature | Deploy When |
|---------|-------------|
| Exposure mode selector (Strict / Normal / Permissif) | After threshold calibration W3 |
| Classification rationale display | W2-3 |
| Push notification for low-confidence "À voir" | If trust metrics are low at W2 |

**Won't-Have (MVP-0):** Outlook, Stripe, Team plan, landing page, Ghost Bouncer, dual-model AI, calendar integration.

**Pre-launch gates:** Gmail API sensitive scopes in testing mode (<100 users), RGPD self-assessment, AIPD simplified (CNIL template), DPA with LLM provider, Supabase EU Frankfurt. Gmail security audit submitted during beta (week 10-11).

**Legal prep (parallel, sprint 3-4):** Designated founder + evenings/weekends. CGU template SaaS FR, privacy policy, AIPD simplified. If overruns → engage external lawyer (budget 1K€).

### Post-MVP — MVP-1 Sequenced (Month 4-12)

**MVP-1a — Revenue Activation (Month 4-6):**

| Feature | Why Now |
|---------|---------|
| Landing page (premium UX) | First public surface, conversion funnel |
| Stripe billing + subscription management | Revenue enablement |
| Trial 14j → progressive degradation → Free/Pro | Conversion optimization |
| Gmail security verification (in progress since W10-11) | Blocker for >100 users |
| AIPD formal (external) | Required for Gmail audit |
| "Early access limited" positioning | While audit in progress |

**MVP-1b — Expansion (Month 7-9):**

| Feature | Why Now |
|---------|---------|
| Outlook integration (Microsoft Graph API) | 40%+ B2B market |
| Enhanced dashboard (trends, history, stats) | Retention + premium feel |
| Adaptive Recap (daily/weekly) | Notification fatigue reduction |
| Email support (SLA 24h Pro) | Retention at scale |

**MVP-1c — Scale (Month 10-12):**

| Feature | Why Now |
|---------|---------|
| Team plan (19€/user, shared whitelist, admin, weekly report) | ARPU expansion |
| Free plan activation (30 emails/day) | Freemium funnel |
| Referral mechanism in Recap + dashboard | Viral growth |
| Win-back email (7 days post-churn) | Churn recovery |
| Monthly value stats in first Recap of month | Invisible SaaS value reminder |

### Expansion Phases (V1.1 / V2 / V3)

| Phase | Entry Trigger | Features | Exit Criteria |
|-------|--------------|----------|---------------|
| **V1.1** | MVP-1 milestone met (500 paying, <8% churn) + p95 >3min | IMAP/SMTP, browser extension, classification engine extracted as service, SES backup | Stable at 2,000 users, infra <5% MRR |
| **V2** | V1.1 stable + >50 requests for role profiles + consent mechanism ready | Multi-role AI (DRH, DSI, CEO), collective intelligence model, SSO/directory sync, calendar integration | PMF validated on multi-role, >5K users |
| **V3** | V2 PMF + >10K users + platform API demand | Email composition assistant, predictive sender scoring, CRM API marketplace, Slack/Teams | Platform revenue >20% of total |

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| Fingerprinting <50% accuracy | Medium | High | Extensive header library, pattern testing pre-beta | Increase LLM routing (accept higher cost) |
| LLM classification <90% accuracy | Low | Critical | Prompt iteration, structured JSON validation | Increase context, try different model |
| Gmail Pub/Sub unreliable | Medium | Medium | Adaptive reconciliation polling (5min business hours) | Full polling fallback |
| Sprint 4 overrun >1 week | Medium | High | Scope freeze after sprint 2, ruthless P0 focus | Cut all P1 + feedback modal from beta |

**Market Risks:**

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| Users don't trust invisible AI | Medium | Critical | Confidence scores, transparency, trust calibration period | More conservative defaults |
| Gmail/Outlook add native filtering | Medium | High | Specialize B2B + transparency + cross-provider + Recap | Pivot to enterprise features |
| <30 active beta users at W5 | Medium | Critical | Founders' network for initial 50 | Extend beta 4 weeks, iterate onboarding |

**Resource Risks:**

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| 8-week dev too tight | Medium | Medium | Scope freeze, smoke test first | Launch with P0 only |
| Legal prep delays launch | Medium | High | Start sprint 3-4 parallel, templates, 1K€ budget | Simplified CGU, iterate before MVP-1 |
| Gmail security audit delays MVP-1 | High | High | Submit during beta (W10-11), 1,500€ budgeted | Stay "early access" <100 users |

### Development Timeline (Final)

| Period | Focus | Deliverable |
|--------|-------|-------------|
| **Sprint 1-2** (W1-2) | Gmail OAuth + Pub/Sub + base pipeline + fingerprinting engine | Pipeline functional, first labels appearing |
| **Sprint 2** | **SCOPE FREEZE** — no new P0 after this point | — |
| **Sprint 3-4** (W3-4) | LLM integration + reconciliation + degraded mode + whitelist scan | Technical Smoke Test ready |
| **Sprint 3-4** (parallel) | Legal prep: CGU, privacy policy, AIPD (designated founder + evenings) | Legal docs draft |
| **W4** | **TECHNICAL SMOKE TEST** — 10 users deployed | Classification accuracy validated |
| **Sprint 5-6** (W5-6) | Dashboard + Recap + onboarding + summaries + feedback modal | MVP-0 Beta ready |
| **Sprint 7-8** (W7-8) | Help center + referral tracking + monitoring alerts + polish | Beta-ready product |
| **W9-13** | **MVP-0 BETA** — 50 users, 5 weeks | Sean Ellis >40%, 30 active at W5 |
| **W10-11** | Gmail security audit submitted (parallel to beta) | Audit in progress |

## Functional Requirements

This section defines the **capability contract** for Kyrra. Every feature must trace back to a functional requirement listed here. UX designers will design for these capabilities, architects will support them, and epics will implement them. If a capability is not listed, it will not exist in the final product.

### Email Classification & Intelligence

- FR1: System can classify incoming emails into three categories (Non-commercial / Filtered / Blocked) using a dual-layer engine (fingerprinting rules + LLM)
- FR2: System can classify 60-70% of emails using rule-based fingerprinting without invoking the LLM
- FR3: System can detect prospecting tool signatures from email headers, domain reputation, and subject patterns
- FR4: System can route ambiguous emails to the LLM with truncated content sufficient for classification while preserving privacy
- FR5: System can produce a structured classification result with category, confidence score (0-100), and one-line summary for each email
- FR6: System can fall back to rules-only classification when LLM is unavailable or latency exceeds threshold
- FR7: User can switch between exposure modes (Strict / Normal / Permissive) with a functional description of each mode's behavior; mode change applies to newly received emails only
- FR8: System can strip PII from generated summaries using a multi-layer pipeline (prompt instruction, regex post-processing, monitoring)
- FR9: System can resist prompt injection from email content through sandboxed prompts, structured JSON output, and format validation
- FR86: System can classify emails written in French, English, or mixed FR/EN content with a reclassification rate ≤5% regardless of email language composition, without requiring user language configuration

### Email Provider Integration & Synchronization

- FR10: User can connect their Gmail account via OAuth and grant required permissions
- FR11: System can receive new email notifications via Gmail Pub/Sub and process them within target latency
- FR12: System can apply graduated Gmail labels (Kyrra — À voir / Kyrra — Filtré / Kyrra — Bloqué) to classified emails
- FR13: System can detect and reconcile missed Pub/Sub notifications via adaptive polling with frequency adjusted to expected email activity
- FR14: System can detect user label changes in Gmail and interpret them as implicit reclassification signals
- FR15: System can reference labels by internal ID and auto-recreate deleted labels with user notification
- FR16: System can maintain Gmail as the source of truth, with Supabase as synchronized replica
- FR17: System can automatically renew Gmail Pub/Sub watch subscriptions before expiration without manual intervention
- FR18: System can detect external OAuth revocation (user revoking access from Google/Microsoft settings or password change) and gracefully pause processing with user notification
- FR19: User can connect one or more email accounts to Kyrra, with whitelists and classification operating across all connected accounts (MVP-1 for Outlook addition, V1.1 for true cross-provider unified inbox)

### Onboarding & Account Management

- FR20: User can create a Kyrra account and initiate the signup/onboarding flow with clear value proposition, including proactive guidance about expected email provider security alerts during beta
- FR21: User can authenticate to the Kyrra web application, with the option to link authentication to their email provider OAuth (single sign-on flow)
- FR22: User can complete onboarding in under 5 minutes (OAuth connect + initial scan)
- FR23: System can scan the user's sent email history (6 months) and auto-generate a hashed whitelist of known contacts, with user review of auto-whitelisted contacts during onboarding before activation
- FR24: System can display onboarding scan results as an instant value demonstration (e.g., "847 emails analyzed, 312 were noise, 42 contacts whitelisted")
- FR25: System can display real-time progress of the initial onboarding scan to the user
- FR26: System can resume interrupted onboarding and present scan results on user return
- FR27: System can store whitelist entries in non-reversible hashed form at address and domain levels
- FR28: System can automatically whitelist senders when user reclassifies an email as non-commercial
- FR29: User can manage their whitelist (view entries, add/remove contacts)
- FR30: User can access a unified settings page to manage all personal preferences (exposure mode, whitelist, Recap, notifications, privacy, account)
- FR31: User can delete their account, export their data (RGPD portability), and revoke OAuth access to their email provider
- FR32: User can maintain service continuity when migrating between email providers, preserving whitelist, preferences, and classification history on their Kyrra account
- FR84: User can perform a clean uninstall that removes all Kyrra labels from every email in their mailbox (regardless of reception date) and restores it to its pre-Kyrra state, with a single confirmation action from the account settings page

### User Dashboard & Analytics

- FR33: User can view a web dashboard with email filtering statistics (daily/weekly/monthly breakdown)
- FR34: Dashboard can display in two modes: simple (one headline number + alert) and detailed (full stats, trends, confidence distribution, reclassification history); detailed mode is user-initiated (opt-in toggle or equivalent accessible from the dashboard), not settings-buried
- FR35: User can view one-line summaries of important emails received
- FR36: User can view classification details for any processed email (category, confidence score, classification rationale on demand)
- FR37: User can view the classification timestamp for any processed email (when Kyrra received and classified it)
- FR38: User can switch between exposure modes (Strict / Normal / Permissive) from the dashboard
- FR39: User can access the dashboard from mobile devices (responsive design)
- FR40: System can display contextual in-app notifications to the user (plan limit approaching, degraded mode active, reclassification confirmed, system maintenance)
- FR41: System can track and display differential value (emails caught by Kyrra but not by native provider filtering)

### Trust & Feedback Loop

- FR42: User can reclassify any email with one click (via dashboard or Gmail label change)
- FR43: System can display confidence scores selectively (only on doubt, <75% confidence) with opt-in full visibility
- FR44: System can display classification rationale explaining why an email was classified in a given category
- FR45: System can automatically improve classification accuracy over time by incorporating reclassification signals, whitelist changes, and domain pattern updates — without requiring explicit user action; improvement measured by decreasing weekly reclassification rate across user cohorts until reaching steady-state below the MVP-0 target (<5%)
- FR46: User can provide feedback on classifications via a mini-feedback modal (false positive / wrong category / whitelist sender)
- FR47: System can detect Gmail-based reclassifications and prompt the user to provide explicit feedback ("help Kyrra learn" banner)
- FR48: User can receive visual confirmation when a reclassification (via Gmail or dashboard) has been processed by the system
- FR49: System can inform users when operating in degraded mode, with adjusted confidence score display reflecting reduced classification certainty
- FR85: User can reclassify a filtered email directly from within the email itself via a tokenized one-click link (zero authentication required), with the token valid for 7 days and single-use

### Kyrra Recap & Communications

- FR50: System can generate and send a Kyrra Recap HTML email with functional summaries (role + urgency + action, no PII) — only when there is meaningful content to communicate
- FR51: Recap can include filtering statistics, important email summaries, and a referral link
- FR52: Recap can include monthly value stats in the first email of each month (e.g., "March: 1,247 emails filtered, ~8h saved")
- FR53: User can access exposure mode switching directly from the Recap email via deep link
- FR54: User can customize Recap preferences (frequency, delivery time, content scope)
- FR55: User can unsubscribe from the Kyrra Recap email independently of their Kyrra account (one-click unsubscribe in every Recap)
- FR56: System can generate a win-back email 7 days post-churn with personalized filtering stats, subject to user's marketing communication consent (not sent if user has unsubscribed from Recap or opted out of marketing emails)
- FR57: Founders can send operational communications to users (changelog, maintenance notices, incident notifications)
- FR58: System can detect user inactivity (no dashboard visit for 7+ consecutive days) and trigger a re-engagement email with personalized filtering stats during beta
- FR59: System can send push or email notifications for low-confidence classifications requiring user attention, even when the user is not active in the app
- FR60: System can notify users through an alternative channel (in-app banner at next login) when the primary email channel is unavailable due to OAuth token invalidation

### Subscription & Growth

- FR61: System can manage subscription tiers (Trial 14 days / Free / Pro / Team) with appropriate feature gating
- FR62: System can enforce plan limits (30 emails/day for Free plan) with graceful degradation — emails beyond the limit remain unclassified in the user's inbox without Kyrra labels
- FR63: System can progressively degrade features post-trial (dashboard detail day 15, summaries day 22, Recap day 30) with value reminders
- FR64: User can upgrade, downgrade, or cancel their subscription
- FR65: System can manage subscription plan transitions (upgrade/downgrade) with clear rules for feature access timing and data continuity
- FR66: System can track referral attribution and display referral status to users in real-time (invitations sent, signups completed, rewards earned or pending)
- FR67: System can reward referrers with subscription benefits (e.g., one free Pro month per successful referral conversion)
- FR68: User can share Kyrra with others through a ready-to-use sharing mechanism (pre-formatted referral link, share button, suggested message)

### Privacy, Compliance & Administration

- FR69: User can provide explicit informed consent for core automated AI processing (single consent), with separate opt-in controls for secondary features (Recap email, email summaries, anonymous aggregated statistics)
- FR70: User can view and consult the Terms of Service and Privacy Policy at any time, and must re-consent when these documents are updated
- FR71: User can view a privacy dashboard showing what personal data Kyrra holds, retention periods, and upcoming purge dates
- FR72: System can process data opposition requests from third-party senders (email senders whose metadata is processed under legitimate interest)
- FR73: System can process third-party data subject access requests (Art. 15 RGPD) by verifying sender identity and retrieving associated metadata
- FR74: System can notify affected users within regulatory deadlines in case of a data breach
- FR75: System can enforce zero email content in all application logs and restrict debug mode (per-user consent, 24h max, auto-purge, audit trail)
- FR76: Founders can view an admin dashboard with system-wide aggregated stats, per-user anomaly detection, and classification logs (metadata only)
- FR77: System can generate automated monitoring alerts for business metrics (reclassification rates, LLM errors) AND infrastructure health (worker status, job execution, cron failures, reconciliation gaps)
- FR78: Admin dashboard can display real-time LLM cost per user and system-wide, with circuit breaker status visibility
- FR79: Admin dashboard can display cost-per-email and cost-per-user-segment analytics to identify disproportionate LLM usage patterns
- FR80: Founders can update the fingerprinting rules library (add, modify, remove detection signatures)
- FR81: System can expose a public status page displaying current system health and any active degraded modes
- FR82: System can apply content sanitization (detection and redaction of Art. 9 RGPD sensitive data patterns — health, political opinions, financial data) to email excerpts before LLM transmission; when pattern detection is not feasible on truncated content, the system relies on the documented legal basis (legitimate interest + DPA zero-retention) and logs the transmission metadata (email_id, timestamp, reason) — not content — to the security audit trail
- FR83: User can pause and resume email classification processing without deleting their account; paused state stops all email processing, label application, and Recap generation while preserving account data, preferences, and whitelist (RGPD Art. 7(3) — right to withdraw consent for specific processing)

## Non-Functional Requirements

> **Precedence rule:** In case of conflict between Success Criteria targets and NFR specifications, NFRs take precedence for measurable quality attributes.

### Performance

| Requirement | Target | Phase | Rationale |
|------------|--------|-------|-----------|
| Email classification end-to-end latency | <2 min (p95) | MVP-0 | Email is async; users expect minutes, not seconds. Degraded mode trigger at >3 min p95 |
| Rules-only classification latency | <5 sec | MVP-0 | Fingerprinting engine must be near-instant |
| LLM classification latency | <15 sec per email | MVP-0 | Circuit breaker at >10 sec → route to rules engine |
| Dashboard simple mode FCP | <1 sec | MVP-0 | First meaningful content must appear instantly |
| Dashboard detailed mode TTI | <3 sec | MVP-0 | Acceptable for opt-in detailed view |
| Dashboard API response | <500 ms (p95) | MVP-0 | Stats queries must remain fast as data grows; requires pre-aggregation at scale |
| Dashboard API mobile payload | <200 KB per request | MVP-0 | Lazy loading for detailed stats on mobile connections |
| Onboarding scan throughput | 6 months of sent history in <10 min for typical user (500 sent emails) | MVP-0 | Acceptable wait during one-time setup |
| Onboarding progress refresh | Update at least every 3 seconds | MVP-0 | Continuous feedback prevents perceived freeze |
| Reconciliation polling cycle | Complete per-user poll in <30 sec | MVP-0 | Must fit within 5-min business-hours interval |
| Concurrent dashboard sessions | 100 simultaneous at MVP-1 (500 users, ~20% peak concurrency) | MVP-1 | Conservative for initial scale |
| Recap HTML email size | <80 KB total | MVP-0 | Gmail truncates at 102 KB; safe margin |
| Recap generation pipeline | Stats pre-aggregated nightly; all Recaps generated and queued within 15 min for up to 2,000 users | MVP-0 | Delivered by 7:00 AM user local time |
| Metadata purge impact | Purge operations must not degrade dashboard response times; run off-peak with bounded batch sizes | MVP-0 | Prevents lock contention on business-hours queries |
| Reclassification propagation | Dashboard reclassification action → Gmail label update: <10 seconds | MVP-0 | User trust requires immediate visible feedback when correcting a classification |
| Low-confidence notification delivery | <5 min from classification completion to push/email notification for emails classified with <75% confidence | P1 | Reduces false positive discovery latency (Marc's 3h gap); aligned with FR59 |
| Audit trail DB isolation | Security audit trail stored in separate database/schema from business data | MVP-1 | Prevents mutual performance impact (vacuum, backup, query load) |

### Security

#### MVP-0 (Required for Beta)

| Requirement | Target |
|------------|--------|
| OAuth token storage | Encrypted at rest (AES-256), encrypted in transit (TLS 1.3) |
| Email content persistence | Zero — content processed in-memory only, never written to disk or database |
| LLM request content | Truncated input only; LLM provider contractually bound to zero data retention |
| Application logs | Zero email content in any log entry; log only email_id, classification_result, confidence_score, processing_time |
| PII in summaries | <0.5% leakage rate; measured via automated regex scanning on 100% of summaries, with monthly manual review of 5% random sample to calibrate regex precision |
| Prompt injection resistance | 100% of LLM outputs validated against expected JSON schema; malformed output → automatic rules fallback |
| Database access isolation | Supabase Row Level Security enforced — users access only their own data at database level |
| Admin data access | Aggregated stats by default; individual metadata access requires documented justification + audit trail |
| Debug mode constraints | Per-user consent required, 24h maximum duration, automatic purge after resolution, full audit trail |
| Whitelist data | Non-reversible hashing; cross-domain inference in-memory only, never persisted |
| Rate limiting (public endpoints) | Auth: 10 attempts/min per IP; Dashboard API: 100 requests/min per user; Public: 30 requests/min per IP. Internal workers authenticated via service tokens are exempt |
| Recap email anti-spoofing | Sent from dedicated subdomain (e.g., recap.kyrra.io) with DKIM signing, SPF, and DMARC enforced |
| Auth error messages | Uniform regardless of whether account exists or password is wrong (prevent user enumeration) |
| Webhook authentication | All inbound webhooks (Gmail Pub/Sub, Stripe) validated via cryptographic signature verification; unsigned/invalid requests rejected and logged |
| Security headers | Content-Security-Policy, X-Frame-Options: DENY, Strict-Transport-Security, CORS restricted to kyrra.io domains on all responses |
| Public identifiers | All user-facing identifiers in URLs (referral codes, share links) must be opaque, non-sequential, non-guessable (UUID v4 or random tokens) |
| Vulnerability patching | Critical CVEs patched within 48h; high within 7 days |
| RGPD response time | Data subject requests (access, deletion, portability) completed within 72h (target), 30 days (legal maximum) |

#### MVP-1 (Required for Paid Launch)

| Requirement | Target |
|------------|--------|
| Session management | Sessions expire after 24h inactivity; password change or OAuth revocation invalidates all active sessions immediately |
| Admin authentication | MFA required for admin dashboard; sessions limited to 8h for Kyrra founders, 4h for external team admins |
| Dependency scanning | Automated vulnerability scanning on every build; critical vulnerabilities block deployment |
| Security audit trail | Retained minimum 1 year, separate from operational logs (30 days); covers data access, admin actions, authentication events, and OAuth token usage (grant, refresh, revocation) |
| Backup security | Encrypted at rest, stored in separate EU region from primary data; executed via replica/snapshot (no live DB impact); all access logged in security audit trail |
| Anomalous access detection | Unusual query volume, off-hours admin access, bulk metadata retrieval detected and trigger alerts within 5 minutes |
| Environment separation | Production data never used in development or staging; test environments use synthetic data only |

#### V1.1+ (Maturity)

| Requirement | Target |
|------------|--------|
| Column-level encryption | Sensitive fields beyond OAuth tokens encrypted at column level in addition to disk-level encryption |

### Scalability

| Requirement | Target | Phase | Rationale |
|------------|--------|-------|-----------|
| MVP-0 capacity | 50 users, ~3,000 emails/day | MVP-0 | Beta scope |
| MVP-1 capacity | 500 users, ~30,000 emails/day | MVP-1 | First paid milestone |
| V1.1 capacity | 2,000 users, ~120,000 emails/day | V1.1 | Pre-enterprise scale |
| LLM cost per user | <0.70€/month; alert at 0.50€; degraded mode (80% bypass) at 1.00€/user | MVP-0 | Unit economics viability |
| Infrastructure cost per user | <2€/month (LLM + Supabase + Postmark + hosting combined) | MVP-0 | Margin preservation at 15€/month price |
| Total infra cost at 2,000 users | <1,000€/month (~3% of MRR) | V1.1 | Healthy SaaS margin threshold |
| Database growth | Metadata auto-purge at 90 days; weekly aggregates retained 1 year; anonymous aggregates indefinite | MVP-0 | Bounded storage growth per user |
| Service extraction triggers | Pipeline p95 >3 min → extract classification engine; Supabase cost >30% MRR → optimize DB; Worker queue backlog >30 min → horizontal scaling | V1.1 | Metrics-based, not user-count-based |
| Worker architecture | Stateless workers, horizontally scalable when queue backlog exceeds threshold | MVP-0 | Architecture constraint for future scale |

### Reliability

| Requirement | Target | Phase | Rationale |
|------------|--------|-------|-----------|
| System uptime (Kyrra-owned) | 99.5% (excludes scheduled maintenance) | MVP-0 | Email is async; tolerance higher than real-time apps |
| End-to-end availability | Tracked separately; degraded mode counted as "available" | MVP-0 | External dependencies (Gmail, LLM) outside Kyrra's SLA |
| Email loss rate | 0% — zero emails may be lost or silently unprocessed | MVP-0 | Fundamental trust requirement |
| Reconciliation gap | <5 min detection of missed Pub/Sub notifications | MVP-0 | Safety net for Gmail notification reliability |
| Degraded mode activation | <30 sec from dependency failure detection to fallback activation | MVP-0 | Users experience lower confidence, not outage |
| Degraded mode recovery | <5 min from dependency restoration to normal operation | MVP-0 | Automatic recovery, no manual intervention |
| Email processing idempotency | Same email processed twice produces identical classification result | MVP-0 | Prevents duplicate labels or conflicting states |
| Queue durability | Emails queued during dependency downtime survive system restart | MVP-0 | Zero loss guarantee during outages |
| Gmail Pub/Sub watch renewal | Automated renewal at least 24h before 7-day expiration; missed renewal triggers automatic switch to full polling mode | MVP-0 | Gmail watches expire after 7 days; missed renewal = silent email loss |
| OAuth token refresh | Automatic refresh with graceful degradation — notify user, pause processing, never lose data | MVP-0 | Silent token management |
| Recap delivery rate | >99% — Postmark primary, SES fallback | MVP-0 | Core value delivery channel |
| Recap inbox placement | >98% inbox placement rate, monitored weekly via Postmark deliverability reports | MVP-0 | Silent spam classification = invisible failure |
| Data backup | Daily automated backups with <24h RPO (Recovery Point Objective) | MVP-0 | Standard for user data protection |
| Disaster recovery | <4h RTO (Recovery Time Objective) | MVP-1 | Acceptable for async email processing |
| Monitoring check interval | <1 min for critical metrics (pipeline status, LLM availability, OAuth token validity) | MVP-0 | Anomaly-to-alert total time <6 minutes |
| Monitoring alert delivery | <5 min from anomaly detection to founder notification | MVP-0 | Early warning for operational issues |
| Code rollback | <5 min for code rollback; database migrations must be backward-compatible (additive only); destructive schema changes require separate documented rollback plan | MVP-0 | Deployment safety |
| Deployment process | Code review required before production deployment; hotfixes documented with post-mortem within 48h | MVP-1 | Operational maturity |
| Operational log retention | 30 days for application errors and performance traces; no email content. **Exception:** classification result logs (email_id, classification, confidence_score) follow metadata retention policy (90 days), not operational log policy | MVP-0 | Debugging post-incident; classification logs needed for reclassification rate trending and AI learning signal analysis |

### Integration

| Requirement | Target | Phase | Rationale |
|------------|--------|-------|-----------|
| Gmail API compliance | Full compliance with Gmail API ToS and Limited Use Policy | MVP-0 | Mandatory for Google security verification |
| Gmail API rate limiting | Exponential backoff + progressive scan; respect all quota limits | MVP-0 | Required to avoid API suspension |
| LLM provider failover | Automatic switch from primary to fallback within 30 sec of primary failure | MVP-0 | Multi-provider resilience |
| LLM response format | Structured JSON with enum-constrained values; non-compliant response → rules fallback | MVP-0 | Prevents garbage classification |
| Email delivery failover | Automatic switch to SES within 5 min of Postmark failure | MVP-1 | Recap delivery continuity |
| Supabase dependency | Application continues classification (queue-based) during Supabase downtime up to 30 min | MVP-0 | Core pipeline must not stop for database outage |
| Stripe webhook reliability | Idempotent webhook processing; retry handling for missed events | MVP-1 | Billing state consistency |
| Third-party DPA coverage | All sub-processors must have signed DPA covering EU data residency and zero training on user data | MVP-0 | RGPD sub-processor obligation |
| Domain warm-up | Progressive email volume ramp-up plan for recap.kyrra.io before beta launch | MVP-0 | Deliverability prerequisite |

### Accessibility

| Requirement | Target | Phase | Rationale |
|------------|--------|-------|-----------|
| WCAG compliance | Level AA (WCAG 2.1) for dashboard and settings pages | MVP-1 | B2B standard; French RGAA compliance |
| Keyboard navigation | All dashboard actions achievable via keyboard | MVP-1 | Power users and assistive technology |
| Screen reader compatibility | All interactive elements properly labeled (ARIA) | MVP-1 | Inclusive design baseline |
| Color contrast | Minimum 4.5:1 for text, 3:1 for UI components | MVP-0 | Low effort, high impact baseline |
| Responsive breakpoints | Desktop (1024px+), tablet (768px+), mobile (375px+) | MVP-0 | Dashboard must work on all devices |
| Recap email accessibility | HTML renders correctly in all major email clients; plain-text fallback available | MVP-0 | Email client diversity |
