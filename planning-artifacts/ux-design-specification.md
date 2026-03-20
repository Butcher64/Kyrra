---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response, step-05-inspiration, step-06-design-system, step-07-defining-experience, step-08-visual-foundation, step-09-design-directions, step-10-user-journeys, step-11-component-strategy, step-12-ux-patterns, step-13-responsive-accessibility, step-14-complete]
status: 'complete'
completedAt: '2026-03-19'
lastStep: 14
inputDocuments:
  - planning-artifacts/product-brief-Kyrra-2026-03-09.md
  - planning-artifacts/prd.md
  - planning-artifacts/prd-validation-report.md
  - planning-artifacts/architecture.md
workflowType: 'ux-design'
project_name: 'Kyrra'
user_name: 'Thomas'
date: '2026-03-17'
---

# UX Design Specification — Kyrra

**Author:** Thomas
**Date:** 2026-03-17

---

## Executive Summary

### Project Vision

Kyrra is an **invisible SaaS** — a cognitive firewall for business leaders overwhelmed by AI-generated B2B prospecting emails. The primary value is delivered INSIDE Gmail through labels and a cleaned inbox. The web dashboard and Kyrra Recap email are secondary value confirmation layers. UX success = the user forgets Kyrra exists because their inbox just works.

**Dual UX personality:**
1. **Passive mode (the core):** User sees nothing — their inbox is clean. The daily Recap confirms value in 30 seconds.
2. **Active mode (the exception):** Dashboard for configuring, diagnosing, correcting. A "passive-only" user (never visits dashboard, reads Recap only) is a SUCCESS, not a ghost.

### Target Users

**Marc (acquisition persona)** — CEO SMB 30-80 employees, 18-22 prospecting emails/day, no assistant, tech-aware but not a geek. Wants: open his inbox in the morning and see only real conversations. Discovers the Recap with his morning coffee. Mobile-first for Recap, desktop for dashboard.

**Sophie (free plan)** — Freelance consultant, moderate volume (6-8/week), joins for one-line summaries. Natural LinkedIn ambassador. Free plan = acquisition channel, not a product.

**Founders (admin)** — Thomas, Hadrien, Félix. Admin dashboard for monitoring: LLM costs, reclassification rates, anomalies. No premium UX needed — functional and dense.

### UX Surfaces to Design

| Surface | Type | Priority | Technical Constraints |
|---------|------|----------|----------------------|
| Dashboard simple | Web page (Server Component) | MVP-0 P0 | FCP <1s, responsive, ANON_KEY only |
| Dashboard detailed | Web page (Client Component) | MVP-0 P0 (opt-in) | TanStack Query 30s refetch, Recharts |
| Kyrra Recap | HTML email | MVP-0 P0 | <80KB, mobile-first, avoid Promotions tab |
| Onboarding flow | Web pages (auth + scan) | MVP-0 P0 | OAuth PKCE, async scan, progress bar |
| Reclassification pending | Web page (Client Component) | MVP-0 | Poll 2s status, spinner, redirect |
| Onboarding progress | Web page (Client Component) | MVP-0 | Whitelist scan progress bar |
| Settings | Web page | MVP-0 | Exposure mode, whitelist, Recap prefs |
| Admin dashboard | Web page | MVP-0 (Supabase Studio for beta) | ADMIN_USER_IDS middleware |
| Token expired / confirmation | Static pages | MVP-0 | Zero-auth, redirect from Recap token |
| Login | Web page | MVP-0 | Supabase Auth Google OAuth |

### Key Design Challenges

**Challenge 1 — Zero-error trust building.**
Kyrra manages a CEO's emails. A false positive on a critical email can cost a deal. UX must build trust progressively: confidence scores visible below 75%, rationale available on demand, quarantine easily accessible. The first Recap must demonstrate value immediately ("312 emails were noise").

**Challenge 2 — Invisibility as a feature.**
The product succeeds when forgotten. But forgetting = involuntary churn (user forgets they pay). UX must inject "value confirmation moments" without being intrusive: monthly stats in Recap, cumulative total since signup, time saved estimate.

**Challenge 3 — Dual-mode dashboard without friction.**
Simple mode (one stat + one alert) AND detailed mode (charts, confidence distribution, history) in the same interface. Switching must be fluid — not a page change or a buried setting.

**Challenge 4 — Mobile-first Recap, desktop-first dashboard.**
Recap is read in 30 seconds on iPhone between meetings. Dashboard is consulted on desktop for analysis. Two different experiences to design separately.

**Challenge 5 — Onboarding in <5 min with a 5-10 min scan.**
The whitelist scan (6 months of sent history) can take 5-10 minutes for a power user. Architecture imposes async scan — user accesses dashboard DURING the scan. UX must manage this wait without making the product feel broken.

### Design Opportunities

**Opportunity 1 — The "coffee moment."**
The morning daily Recap can become a ritual. Design as a premium 30-second experience: quick visual scan, one single possible action (click an interesting email), polished aesthetic.

**Opportunity 2 — Transparency-as-trust.**
Confidence scores and classification rationale are a competitive UX advantage. Gmail/Outlook filter opaquely. Kyrra can show WHY — "Filtered 92% — Lemlist signature detected, domain created 3 days ago" — something nobody else does.

**Opportunity 3 — Progressive disclosure on dashboard.**
Simple mode is a "personal landing page": one number, one alert if doubt. Power users opt-in for detailed mode. This information architecture serves Marc (30 seconds) and founders (deep analysis) with the same URL.

**Opportunity 4 — Onboarding "wow moment."**
"Kyrra analyzed 847 emails. 312 were noise. 42 contacts auto-whitelisted." This first post-scan screen is the critical conversion moment — it deserves a spectacular design.

### Empathy Map Insights (Marc, Monday morning 8:15 AM)

**Before Kyrra:**
- Sees: 55+ unread emails, wall of text, real emails buried in noise
- Thinks: "Another 30 minutes of sorting before I can work"
- Feels: Morning anxiety, guilt (missing opportunities), decision fatigue (10-15 sec micro-decision per email)
- Does: "Email hour" 8:15-8:50, mass delete reflex, "to review later" folder accumulating 200+ unread

**Week 1 with Kyrra — Emotional transition:**
- Day 1-2: Relief mixed with distrust ("did it block something important?")
- Day 3: Surprise when Recap identifies a relevant opportunity he would have deleted
- Day 5: Stops checking the Filtered folder daily
- Day 7: Trust building — reclassification rate dropping
- Week 2+: Scans Recap in 30 seconds with coffee, dashboard visits become occasional

**UX Insights derived:**

| # | Insight | Design Implication | Surface |
|---|---------|-------------------|---------|
| E1 | Week 1 anxiety is the most critical design moment | Quick access to filtered emails from simple dashboard (not hidden in detailed mode) | Dashboard simple |
| E2 | Recap is an emotional object, not informational | Reassurance first ("0 emails need attention") BEFORE stats. Time saved displayed prominently | Recap HTML |
| E3 | Confidence scores are a transition tool, not permanent feature | Visible <75% only. Dashboard could show a composite Trust Score that increases weekly | Dashboard simple |
| E4 | Reclassification must be instantly gratifying | Animation + "Kyrra learned" message (not just "Reclassified") + Gmail label update <10s | Dashboard + Gmail |
| E5 | Marc wants an invisible guardian, not an email client | Vocabulary: "filtered / blocked / protected" not "sorted / organized". Dashboard = firewall control panel | All surfaces |
| E6 | The Recap "coffee moment" is a competitive advantage to design | Superhuman-level aesthetic. Stat hero, 2-3 "À voir" with summaries, max 3 scrolls on mobile. Zero visual noise | Recap HTML |

### Scenario Walkthrough — Signup to First Monday

**Micro-frictions identified:**

| # | Moment | Friction | Severity | UX Fix |
|---|--------|----------|----------|--------|
| W1 | OAuth consent screen | `gmail.modify` wording scares users | 🔴 Critical | Pre-OAuth reassurance screen (what we do / what we NEVER do) |
| W2 | 5-10 min scan | Progress bar at 12% → user closes tab | 🟡 High | Progressive results from 30s + "close safely, email when done" |
| W3 | Friday signup → Monday | 48h silence post-signup | 🟡 High | "1h post-signup" email with scan results + "first Recap Monday morning" |
| W4 | Gmail mobile labels | Labels hidden in hamburger menu | 📄 Design | Recap is the primary mobile channel, not labels |
| W5 | Recap buried in inbox | Arrived at 7am, scroll needed at 8:12am | 🟡 Medium | Distinctive subject line with numbers ("25 filtered, 2 to review") |
| W6 | Recap header too large | Logo + nav consuming mobile viewport | 🟡 High | Minimal 24px header, content visible without scroll on iPhone SE |
| W7 | "View in Gmail" link | Could redirect to dashboard instead of Gmail | 🔴 Critical | Direct Gmail deep link (`mail.google.com/...#inbox/MESSAGE_ID`) |
| W8 | Dashboard → filtered emails | Simple mode = 1 number, no link to filtered | 🟡 High | "View X filtered in Gmail →" link visible in weeks 1-3 |

**UX Rules from Walkthrough:**

1. **Recap = primary product on mobile.** Dashboard is secondary. Recap design quality must match an app.
2. **All Kyrra links lead to Gmail.** Never to dashboard unless user explicitly asks. Kyrra is a bridge, not a destination.
3. **Progressive results > complete results.** Show value in 30 seconds (partial) rather than waiting 5 minutes for final number.
4. **Pre-OAuth is the most critical conversion moment.** A CEO seeing `gmail.modify` without context abandons. Reassurance screen is P0.
5. **"1h post-signup" email bridges Friday→Monday.** Without it, 48h silence = doubt. With it, Marc knows Kyrra is working.
6. **Simple dashboard must serve Week 1 anxiety:** link to filtered emails alongside the main number. This link naturally fades from attention by week 3.

### Competitive UX Teardown

**Competitive Matrix:**

| UX Dimension | Gmail | SaneBox | Superhuman | Hey | Shortwave | Prospecthor | **Kyrra** |
|-------------|-------|---------|------------|-----|-----------|------------|-----------|
| Stays in Gmail | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | **✅** |
| Detects B2B prospecting | ❌ | ❌ | 🟡 binary | ❌ | ❌ | ✅ | **✅** |
| Graduated classification | ❌ | ❌ | ❌ | 🟡 manual | ❌ | ❌ | **✅** 3 levels |
| One-line summary | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | **✅** |
| Confidence score | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Classification rationale | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Recap email digest | ❌ | 🟡 austere | ❌ | ❌ | ❌ | ❌ | **✅** premium |
| Role-aware (CEO ≠ DRH) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** V2 |
| Free tier | ✅ | ❌ ($7+) | ❌ ($30) | ❌ ($99/yr) | ✅ | ❌ (€20) | **✅** |
| Premium design | 🟡 | ❌ | ✅✅ | ✅ | ✅ | ❌ | **Target ✅** |

**UX Rules from Teardown:**

| # | Rule | Source |
|---|------|--------|
| T1 | Instant feedback (<100ms) on every user action — reclassification, mode switch, whitelist add | Superhuman |
| T2 | 3 labels maximum. Never more. SaneBox proved 7+ folders = abandonment | SaneBox (anti-pattern) |
| T3 | Summaries = strict 1 line. If it exceeds 1 line, the summary is bad | Shortwave (anti-pattern 3-4 lines) |
| T4 | Recap is the automated Screener — same concept as Hey, zero manual action | Hey.com |
| T5 | Transparency = competitive differentiator. Nobody shows the "why". Kyrra does | All (common gap) |
| T6 | Recap links → Gmail directly. Never to dashboard. Email opens email | SaneBox (good), Shortwave (anti-pattern) |
| T7 | Premium design is non-negotiable. Prospecthor proves demand exists — its amateur UX is Kyrra's opportunity | Prospecthor (anti-pattern) |
| T8 | Kyrra is invisible → Recap is the ONLY product showcase. If Recap isn't beautiful, product doesn't exist | SaneBox (ugly digest = invisible product perceived as nonexistent) |

## Core User Experience

### Defining Experience

Kyrra's core user action is **the absence of action.** The product is invisible. The "core loop" is not a gesture — it's a NON-gesture: Marc opens Gmail and does NOT see 30 prospecting emails.

The conscious value touchpoint is the **Recap — 30 seconds of reading each morning.** This is the only moment Marc actively interacts with Kyrra daily.

**Interaction hierarchy (most frequent to rarest):**

| Interaction | Frequency | UX Criticality |
|-------------|-----------|----------------|
| Clean inbox (passive — Gmail labels) | Daily, unconscious | Infrastructure (invisible) |
| Read the Recap (30 sec) | Daily, conscious | **P0 — THE product** |
| Dashboard simple (1 stat) | 3x/week W1-2, then occasional | P0 — confirmation |
| Reclassify an email | ~4-8x/week W1, ~0 by W4+ | P0 — trust building |
| Switch exposure mode | 1-2x/month | P1 |
| Settings / Whitelist | 1x setup, then rare | P1 |
| Dashboard detailed | Opt-in, power users | P1 |

### Platform Strategy

**Three channels, each with a distinct UX role:**

| Channel | Role | Primary Device | Emotional Role |
|---------|------|---------------|----------------|
| **Gmail labels** | Invisible value — clean inbox | Phone + Desktop | Unconscious relief |
| **Recap email** | Conscious value — daily confirmation | **Phone (mobile-first)** | Reassurance + dopamine |
| **Dashboard web** | Control + diagnosis + correction | **Desktop-first** (responsive) | Mastery + transparency |

**No native app.** The Recap email IS the mobile app. Dashboard is responsive but desktop-optimized. This decision reduces development surface by 50% while covering 100% of use cases.

**Offline:** Not relevant. Kyrra processes emails server-side. If user is offline, emails are filtered anyway — they see results upon reconnection.

### Effortless Interactions

| Interaction | Current State (without Kyrra) | With Kyrra | How It Feels Magical |
|-------------|-------------------------------|------------|---------------------|
| Morning email sorting | 35 min of micro-decisions | 0 min — already done | Inbox is clean on open |
| Identifying relevant opportunities | Buried in noise, missed | Surfaced in Recap with 1-line summary | Marc discovers an opportunity he would have deleted |
| Whitelisting known contacts | Manual, one by one | Automatic (6-month Sent Items scan) | 42 contacts whitelisted without a single click |
| Detecting prospecting tools | Impossible for humans | Automatic fingerprinting (Lemlist, Apollo...) | "Kyrra detected this email was sent via Lemlist" |
| Correcting an error | Create a Gmail filter (fragile) | 1-click reclassification → system learns | "This sender will be recognized" — not just moved |

### Critical Success Moments

**The 5 make-or-break moments (chronological order):**

**Moment 1 — Pre-OAuth (second 30)**
Marc sees the Google permissions screen. `gmail.modify` is displayed. Without prior reassurance, he abandons. **If this moment fails = 0 users.**
→ Pre-OAuth screen: "what we do / what we NEVER do" + clean uninstall guarantee.

**Moment 2 — Scan "wow" (minute 3)**
"847 emails analyzed, 312 were noise, 42 contacts whitelisted." Proof that Kyrra understands the problem. If scan takes too long or shows wrong numbers, trust is lost on Day 1.
→ Progressive results from 30 seconds. Numbers refining in real-time.

**Moment 3 — First clean morning (Day 1)**
Marc opens Gmail: 19 emails instead of 55. Strongest emotional moment. If inbox is NOT visibly different (labels not applied, classification failed), product is dead.
→ Technical reliability = UX. Pipeline MUST work perfectly the first night.

**Moment 4 — First Recap (Day 1-2)**
30 seconds of reading. Marc sees: filtered emails, opportunities, time saved. If Recap is ugly, confusing, or lands in spam, Marc will never read it again.
→ Premium design, distinctive subject line, scannable content, direct Gmail links.

**Moment 5 — First reclassification (Week 1)**
Marc finds a false positive. Anxiety spikes. He reclassifies. If feedback is slow, cold, or absent ("Reclassified." full stop), trust drops. If feedback is warm and proves learning ("Kyrra learned — this sender will be recognized going forward"), trust strengthens.
→ Confirmation animation + learning message + Gmail label updated in <10s.

### Experience Principles

**Principle 1 — "Absence is the product"**
The best Kyrra screen is one Marc never sees. The clean inbox IS the product. Everything that adds visual noise betrays the concept. Every UI element must pass the test: "Does this contribute to calm?"

**Principle 2 — "30 seconds maximum"**
Recap reads in 30 seconds. Simple dashboard understood in 5 seconds. Onboarding scan shows value in 30 seconds. No Kyrra interaction should require more than 30 seconds of conscious attention.

**Principle 3 — "Gmail is the destination, Kyrra is the bridge"**
All links in Kyrra (Recap, dashboard, notifications) lead back to Gmail. User stays in their natural environment. Kyrra is not an app you "use" — it's an invisible service that expresses itself through Gmail.

**Principle 4 — "Show the why"**
Transparency is the differentiator. "Filtered 92% — Lemlist signature detected" says more than "Filtered". Every classification shows its confidence. Every error displays its rationale. Opacity is left to competitors.

**Principle 5 — "Doubt promotes"**
When in doubt, Kyrra promotes: a "probably noise" email is classified "À voir" rather than "Bloqué." UX reflects this: low-confidence emails are presented with distinct visual treatment inviting Marc to verify.

**Principle 6 — "Learn, don't obey"**
A reclassification is not an "undo" — it's a teaching moment. UX feedback must communicate: "Kyrra learned from your correction" (not "Email moved"). Reclassification rate drops each week — dashboard shows this.

**Principle 7 — "The Recap IS the mobile app"**
No native app. The Recap email is Kyrra's only mobile interface. It must be designed with app-level rigor: pixel-perfect, mobile-first, scannable, actionable.

## Desired Emotional Response

### Primary Emotional Goals

The product name contains the answer: **"Al Kyrra" — all is calm.** Calm is the primary emotion. Calm is not a passive state — it's an active state of confidence.

| Primary Emotion | What Marc Feels | What Marc Says |
|----------------|----------------|----------------|
| **Calm** (core) | "My inbox is under control. I have nothing to do." | "I open Gmail and it's clean." |
| **Trust** | "Kyrra knows what it's doing. I don't need to check anymore." | "I don't even check the Filtered folder." |
| **Relief** | "This problem that weighed on me for months is solved." | "I got my mornings back." |
| **Quiet pride** | "I found a smart tool that few people know about." | "Do you know Kyrra? It changed my life." |

**Secondary emotions (punctual moments):**

| Emotion | When | Importance |
|---------|------|-----------|
| **Surprise** | Recap identifies an opportunity Marc would have deleted | Conversion → retention moment |
| **Satisfaction** | "Time saved" number increases week over week | Churn prevention |
| **Mastery** | Marc switches exposure mode and sees immediate effect | Power user engagement |

### Emotional Journey Mapping

| Phase | Duration | Dominant Emotion | Parasitic Emotion to Neutralize | UX Response |
|-------|----------|-----------------|-------------------------------|-------------|
| **Discovery** (landing) | 30 sec | Curiosity + problem recognition | Skepticism ("another email tool") | Headline naming the exact problem. Peer social proof (business clubs). |
| **Pre-OAuth** | 10 sec | Hesitation | **Fear** (`gmail.modify` permissions) | Reassurance screen + clean uninstall guarantee. Transform fear → "it's safe." |
| **Onboarding scan** | 30s-5min | Impatience → wonder | Doubt ("does it really work?") | Progressive results in 30 sec. "Wow moment" ("312 were noise") dissolves doubt. |
| **Waiting for first morning** | 12-60h | Curiosity mixed with forgetting | Indifference (Friday evening → Monday) | "1h post-signup" email: emotional bridge. "Kyrra is active. First Recap Monday morning." |
| **First morning** | 2 min | **Relief** (clean inbox) | Distrust ("what did it block?") | Gmail labels visible + Recap with filtered summary. Distrust is normal and healthy — UX accompanies it. |
| **Week 1** | 7 days | Decreasing distrust → rising trust | Anxiety (possible false positive) | Confidence scores visible <75%. "View filtered" link on dashboard. Reclassification = "Kyrra learned." |
| **Week 2-3** | 7-14 days | Established trust | Monotony (Recap becomes routine) | Monthly stats in first Recap of month. Content variation (sector trends). |
| **Month 2+** | Ongoing | **Total calm** — forgets Kyrra | Involuntary churn (forgets they pay) | Monthly value reminder ("This month: 89 filtered, 3h20 saved"). Cumulative since signup. |
| **Reclassification** (edge) | 30 sec | Anxiety spike → relief | Trust loss ("it missed this") | Immediate "Kyrra learned" feedback + Gmail label <10s. Transparency (rationale) turns anger into understanding. |
| **Cancellation** (worst) | 5 min | Regret or indifference | — | Win-back email D+7: "847 emails would have been filtered." Instant clean uninstall — respecting departure reinforces trust for those who stay. |

### Micro-Emotions

**Trust vs Skepticism:**
Week 1 skepticism is EXPECTED and HEALTHY. UX does not fight skepticism — it channels it: "Verify, observe, trust." Each verification by Marc (opening the Filtered folder, confirming correctness) is a micro-moment of trust building. The "View filtered in Gmail" link in week 1 is not a UX failure — it's an **intentional** trust-building tool.

**Calm vs Anxiety:**
Anxiety appears only during a false positive or degraded mode. Degraded mode UX must be **honest but calm**: "Kyrra is operating in simplified mode — your emails are still filtered with slightly reduced confidence." No alarmism. Degraded mode banner: INFORMATIVE (yellow), not ALARMING (red).

**Satisfaction vs Indifference:**
Indifference risk appears at month 2+ when everything works. Marc no longer thinks about Kyrra. Product success but business risk. The monthly Recap with cumulative value ("Since signup: 1,247 filtered, ~8h saved, estimated value €320") is the anti-indifference mechanism.

**Pride vs Isolation:**
Marc wants to recommend Kyrra because it makes him feel he found a "smart thing" his peers don't know yet. Social pride. Recap must include a discreet but present sharing CTA: "A colleague drowning in prospection? Share Kyrra." Not aggressive — complicit.

### Design Implications

| Target Emotion | Surface | UX Approach |
|---------------|---------|-------------|
| **Calm** | Dashboard simple | One number. White space. No chart by default. Visual emptiness = calm. |
| **Calm** | Recap | Minimal header. Hero stat (time saved). Max 3 scrolls. Zero sidebar, zero ads. |
| **Trust** | Dashboard simple (W1) | "View filtered in Gmail" link — builds trust through verification. |
| **Trust** | Reclassification | Animation + "Kyrra learned from your correction" + Gmail label <10s. |
| **Trust** | Scores | Visible only <75%. Above that, absence of score = implicit confidence. |
| **Relief** | First morning | Inbox contains 19 emails instead of 55. The visual delta IS the product. |
| **Surprise** | Recap "À voir" | A relevant email Marc would have deleted. 1-line summary + Gmail deep link. |
| **Satisfaction** | Monthly Recap | Cumulative since signup: "1,247 filtered, ~8h saved, value €320." |
| **Pride** | Recap footer | "A colleague drowning in prospection?" + referral link. Discreet, complicit. |
| **Honesty** | Degraded mode | Yellow informative banner. "Slightly reduced confidence." No red alarmism. |
| **Respect** | Cancellation | Instant clean uninstall. Win-back D+7 with missed value. No aggressive retention. |

### Emotional Design Principles

**ED1 — "Calm is designed by subtraction"**
Every visual element added to dashboard or Recap must pass the test: "Does this add calm or noise?" When in doubt, remove. White space is not emptiness — it's visible calm.

**ED2 — "Distrust is an ally, not an enemy"**
In week 1, Marc checks the filtered emails. That's normal. UX facilitates this verification (direct Gmail link) instead of fighting it. Each successful verification = +1 trust. The goal is not to eliminate distrust immediately — it's to transform it into trust through experience.

**ED3 — "Error is a teaching moment"**
A false positive is not a UX failure — it's a transparency moment. Rationale explains the "why." "Kyrra learned" feedback transforms frustration into satisfaction of contributing to improvement. Emotion shifts from "it was wrong" to "it's learning."

**ED4 — "Value must be accounted for"**
An invisible SaaS that doesn't remind its value dies of involuntary churn. Time saved, emails filtered, estimated value — these numbers are not vanity metrics. They are the only conscious proof that Kyrra works. Display without being intrusive: in Recap, never as popup.

**ED5 — "Respect the departure"**
Clean uninstall is an emotional commitment: "If you leave, we return your inbox exactly as before." Zero aggressive retention. Win-back email shows what Marc lost ("847 emails would have been filtered") without guilt-tripping. Respecting departure reinforces trust of those who stay.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Qonto (B2B fintech):** Hero stat + secondary cards layout. Timeline of transactions scannable in 3 seconds. Progressive onboarding. Pattern adopted: dashboard simple = 1 hero number + 3 status cards.

**Calendly (invisible SaaS):** Setup-and-forget model. Email confirmations AS the interface. Value delivered without login. Pattern adopted: Recap email IS the primary interface. Dashboard is secondary.

**Linear (design-obsessed):** Instant feedback (<100ms), dark mode native, density toggle (board/list), status pills with color coding. Pattern adopted: status pills for classifications (À voir=blue, Filtré=gray, Bloqué=red), simple↔detailed density toggle.

**Notion (progressive disclosure):** Empty page = invitation. Hover-to-reveal actions. Breadcrumbs. Pattern adopted: hover-to-reveal classification actions, white space as calm communication.

### Transferable UX Patterns

**Navigation:**
- Hero stat + secondary cards (Qonto) → Dashboard simple
- Email-as-primary-interface (Calendly) → Recap as main touchpoint
- Density toggle (Linear) → Simple ↔ Detailed on same page
- Hover-to-reveal actions (Notion) → Classification actions on hover only

**Interaction:**
- Instant feedback <100ms (Linear/Superhuman) → All user actions
- Status pills with color (Linear) → À voir (blue), Filtré (gray), Bloqué (red)
- Setup-and-forget (Calendly) → Zero daily user action required
- Progressive results (Qonto transactions) → Onboarding scan real-time counters

**Visual:**
- White space = calm (Notion) → Dashboard simple intentional emptiness
- Dark mode native (Linear) → Support from MVP-0 (early morning usage)
- Scannable timeline (Qonto) → Recap email list with color icons
- Minimal chrome (Calendly emails) → Recap: 24px header, immediate content

### Cross-Domain Inspiration

**Luxury hotel concierge:** Anticipation before request. Briefing tone for Recap: "Bonjour Thomas. Votre boîte est protégée." Error as service recovery demonstration.

**Noise-canceling headphones (Sony WH-1000XM5):** Value = absence. Subtraction as product. Transparency mode = "À voir." Adaptive Sound Control = 3 exposure modes. Hero stat reframed: "25 distractions supprimées" (subtraction) > "25 filtrés" (action).

**Private banking:** Quarterly performance report model for monthly Recap. Speak in ROI — resonates with CEO mental model. Cumulative value since inception.

**Home security (Verisure):** Green status badge = "Your inbox is protected ✓" (positive default state, not neutral absence). Alert only on intrusion. Monthly security report.

**Executive assistant:** Recap as morning briefing: "2 emails deserve your attention. The first is a supplier relevant to your sector." Human-informed tone, not automated log.

### Anti-Patterns to Avoid

| Anti-Pattern | Why | Risk for Kyrra |
|-------------|-----|----------------|
| 7+ folders at signup | Cognitive overload | SaneBox proved this kills adoption |
| Summaries > 1 line | Not scannable | Users skip Recap → churn |
| Opaque classification | Zero trust | Marc checks everything manually forever |
| App-only interface | Habit change required | Marc stays in Gmail — Kyrra must go there |
| Dashboard as homepage | Unnecessary logins | Kyrra value is passive, not active |
| Push notifications | Irony — email filter creating noise | Only exception: <75% confidence alert |
| Long onboarding questionnaire | Users want results, not forms | 1 question (role) + auto scan |
| Aggressive retention | Disrespect | Clean uninstall = trust. Win-back D+7 only |

### Micro-Interaction Specifications

**MI-1 — Reclassification:**
T+50ms button press → T+150ms green pulse → T+200ms "✓ Compris" → T+500ms toast "Kyrra a appris. Cet expéditeur sera reconnu." → T+800ms email line glow → T+3s toast fade. Message uses "learned" not "moved" (Principle ED3).

**MI-2 — Mode switch:**
T+50ms old mode desaturates → T+100ms new mode illuminates → T+150ms pill slider slides → T+300ms functional description appears → T+500ms toast "Mode [X] activé." Pills always visible (not dropdown). Slide metaphor = progressive control.

**MI-3 — Scan onboarding:**
T+3s first streaming results → T+10s intermediate message → T+15s "close safely" permission → continuous counter animation (slot machine digits) → final subtle confetti (5-6 gold particles). Progressive results from 30s.

**MI-4 — Dashboard toggle:**
Simple→Detailed: hero stat shrinks (48→24px), charts stagger fade-in (400ms total). Detailed→Simple: charts fade-out, hero expands (350ms, ease-out = "return to calm"). Same URL, no page change. Toggle = discreet text button top-right.

**MI-5 — Toast pattern:**
Slide-in from bottom (200ms), 1 line max, auto-dismiss 3s. Colors: green=success, blue=info, yellow=attention. Never red (red = alarm, violates calm). Never "Undo" button (actions are intentional).

**MI-6 — Dashboard protected state:**
"✓ Votre boîte est protégée" (muted green badge, fade-in 200ms) → hero stat rolls up 0→value (600ms) → cards stagger-in. If alert: yellow badge "⚠️ 2 emails need attention" + email cards with summary + Gmail CTA.

**MI-7 — Whitelist auto-add:**
Sub-line under reclassification toast: "📋 dupont@company.fr added to whitelist" (gray, discreet). Disappears with parent toast. Never a separate notification.

**MI-8 — Degraded mode:**
Yellow banner slide-down (300ms). "Kyrra fonctionne en mode simplifié." Never red. Never "!". Auto-disappears when normal mode resumes + green toast "✓ Normal restored."

**MI-9 — Recap → Gmail:**
Direct deep link (`mail.google.com/...#inbox/MESSAGE_ID`). Zero intermediate page. Zero redirect via kyrra.io. Tracking via pixel, not redirect.

**MI-10 — Token redemption:**
Spinner → poll 2s → checkmark morph (400ms) → "✓ Email reclassifié. Kyrra a appris." → redirect dashboard. If expired: neutral message + "Ouvrir le dashboard →" CTA.

**MI-11 — Free plan limit:**
Email #28: gray counter "28/30". Email #30: amber "Limite atteinte" + discreet Pro CTA (text link, not primary button). Email #31+: silent — no label, no notification.

**MI-12 — Pre-OAuth reassurance:**
Full-page before Google redirect: "Ce que Kyrra fait ✓ / Ce que Kyrra ne fait JAMAIS ✗ / Un clic pour tout annuler." CTA: "Connecter Gmail →"

**Global timing rule:** All initial feedback <100ms. All animations <800ms. All toasts <3s. Zero red anywhere in UI.

## Design System Foundation

### Design System Choice

**shadcn/ui + Tailwind CSS v4** (Themeable System — code owned, not package dependency).

shadcn/ui copies components into `components/ui/`. Full customization, zero runtime dependency. Based on Radix UI primitives (accessible by default). Combined with Tailwind v4 design tokens for Kyrra-specific theming.

**Rejected:** MUI (too "Google" for a product differentiating from Gmail), Ant Design (enterprise/backoffice density), Custom from scratch (3 founders, 8 weeks, no time).

### Two Parallel Design Systems

| System | Scope | Technologies | Constraints |
|--------|-------|-------------|------------|
| **Dashboard DS** | Dashboard web, onboarding, settings, admin | Tailwind v4 + shadcn/ui + Recharts | CSP strict, Server/Client Components, responsive |
| **Email DS** | Recap HTML, transactional emails | HTML tables + inline CSS + MSO conditionals | <80KB, no JS, dark mode email clients, Gmail/Outlook/Apple Mail compat |

The Recap and dashboard DO NOT share a design system. Recap is HTML email with its own constraints (no Flexbox in Outlook, no CSS variables in Gmail, dark mode inverted in Apple Mail).

### Modernized Tech Stack (2026 Research)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 16** (Cache Components + PPR native) | Static shell + streamed dynamic. FCP <500ms |
| UI Components | **shadcn/ui latest** (OKLch, native Chart) | Copy-paste ownership, Tailwind v4, dark mode |
| Animated Components | **Magic UI** (150+ animated components) | NumberTicker, AnimatedList, BlurFade |
| Animation Engine | **Motion** (ex-Framer Motion, 30M+ dl/month) | Hybrid 120fps GPU, springs, layout, scroll |
| Styling | **Tailwind CSS v4** (@theme inline, OKLch) | Modern perceptual colors, design tokens |
| Charts | **shadcn/ui Chart** (wraps Recharts + OKLch) | Zero extra dep, auto dark mode |

### Color System (OKLch — 2026 Standard)

```css
:root {
  /* Classification */
  --a-voir: oklch(0.588 0.158 241.966);
  --filtre: oklch(0.551 0.027 264.364);
  --bloque: oklch(0.577 0.245 27.325);    /* Gmail labels ONLY */

  /* UI feedback */
  --protected: oklch(0.627 0.194 149.214); /* green — "all is well" */
  --attention: oklch(0.666 0.179 58.318);  /* amber — soft alert */
  --info: oklch(0.588 0.158 241.966);      /* blue — informational */

  /* Surfaces (shadcn/ui OKLch standard) */
  --background: oklch(0.985 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
}
```

**Color rule:** Red ONLY in Gmail labels. Dashboard max alert = amber. Zero red in UI.

### Typography

```
Font:   Inter variable — 'Inter', ui-sans-serif, system-ui, sans-serif

hero:       48px / 700 / 1.0  — dashboard hero stat
hero-label: 14px / 500 / 1.4  — below hero
h1:         24px / 600 / 1.3  — section titles (rare)
h2:         18px / 600 / 1.3  — detailed subtitles
h3:         16px / 600 / 1.4  — card titles
body:       14px / 400 / 1.5  — text, summaries
body-med:   14px / 500 / 1.5  — labels, buttons
caption:    12px / 400 / 1.4  — scores, timestamps

Recap email: Arial 32px/14px/12px (Inter not guaranteed in email clients)
```

### Spacing (4px base)

```
Dashboard simple:   SPACIOUS — 48px hero, 24px gaps
Dashboard detailed: COMFORTABLE — 16px cards, 12px internal
Recap email:        SPACIOUS — 32px sections, 16px internal
Settings:           COMFORTABLE — 16px standard
Admin:              COMPACT — 12px tables, 8px cells
```

Layout: 12-col grid, max-width 1200px. Dashboard simple: single column max-width 640px (calm = narrow).

### Component Strategy

**shadcn/ui:** Button, Card, Toast, Badge, Dialog, Progress, Skeleton, Chart, Sidebar

**Magic UI animated:**
- `NumberTicker` → HeroStat counter roll-up
- `AnimatedList` → "À voir" email list with stagger
- `BlurFade` → onboarding page transitions
- `AnimatedThemeToggler` → dark/light switch

**Custom (shadcn/ui + Motion):**
- `ProtectedStatusBadge` — "✓ Votre boîte est protégée" + Motion fade
- `ExposureModePills` — 3 pills + Motion layout animation
- `ClassificationCard` — status pill + summary + Gmail link
- `DegradedModeBanner` — yellow banner + Motion slide-down
- `TrustScoreIndicator` — composite score + spring animation

**Motion animation tokens:**
```typescript
export const transitions = {
  fast:   { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  normal: { duration: 0.3,  ease: [0.25, 0.1, 0.25, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  gentle: { type: 'spring', stiffness: 100, damping: 20 },
} as const
```

### Accessibility

| Rule | Spec |
|------|------|
| Contrast | WCAG AA (4.5:1 text, 3:1 large) |
| Touch target | 44x44px minimum |
| Font minimum | 14px body, 12px caption |
| Dark mode | Native OKLch (Tailwind `dark:`) |
| Reduced motion | `prefers-reduced-motion` disables Motion |
| Color-blind | Never color alone — always icon + text |

### Radius & Shadows

```
Radius: pill 9999px, card 12px, button 8px, input 6px
Shadows (light only): card 0 1px 3px oklch(0 0 0/0.08), elevated 0 4px 12px oklch(0 0 0/0.10)
Dark mode: no shadows (calm)
```

## Defining Core Experience

### The Defining Experience

**Kyrra = "J'ouvre Gmail et c'est propre."**

Not an interaction — an absence of interaction. What Marc tells a peer at a business club:

> "You open your inbox in the morning, there's only real emails. And you get a little recap with the 2-3 interesting things it found in the noise."

The defining experience is dual:
1. **Clean inbox** (passive — you do nothing, you observe)
2. **30-second Recap** (active — you read, you click 1 relevant email)

### User Mental Model

Marc doesn't think "I need an email classification tool." He thinks **"I need an assistant who handles the sorting for me."** His mental model is the **executive assistant** — not a technical tool.

| Marc's Mental Model | UX Implication |
|---------------------|---------------|
| "An assistant sorts for me" | Kyrra asks NOTHING. It acts. Marc observes the result. |
| "The assistant gives me a briefing" | Recap = morning briefing, not technical report |
| "If the assistant is wrong, I correct and they learn" | Reclassification = learning feedback, not bug report |
| "The assistant knows my priorities" | Role (CEO) influences classification. "Knows" what's relevant |
| "I can check their work if I want" | Filtered folder always accessible. Total transparency. |
| "A good assistant is forgotten" | Invisibility = success. No unnecessary notifications. |

### Success Criteria

**"It works" = these 5 signals:**

| Signal | Measure | Target |
|--------|---------|--------|
| Inbox visibly smaller | Delta emails before/after Kyrra | >40% visible reduction from D1 |
| Recap read in <30s | Read time tracking | 20-45 seconds |
| Marc clicks ≥1 "À voir" in Recap | Recap Click Rate (North Star) | >30% |
| Reclassifications decrease weekly | Descending curve W1→W4 | W1: ~8, W4: ~0 |
| Marc recommends spontaneously | Referral rate | >15% at M6 |

**"It's NOT working" = 3 alarm signals:**

| Signal | Detection | Threshold |
|--------|-----------|-----------|
| Checks Filtered folder daily after W3 | Dashboard visits to filtered page | >3x/week after W3 = trust not built |
| Recap unopened 3 consecutive days | Email open tracking | 3 days = engagement danger |
| Reclassification rate stagnates or rises | Weekly analytics | Stagnation W2→W3 = model not improving |

### Novel vs Established Patterns

| Pattern | Type | Source | Kyrra Twist |
|---------|------|--------|------------|
| Gmail labels | Established | Gmail native | Created automatically — zero user config |
| Email digest | Established | SaneBox, newsletters | Digest becomes **premium product** with AI summaries + value stats |
| AI classification | Novel (for user) | No direct competitor for B2B prospecting | Contextual by role (CEO ≠ DRH) |
| Confidence score | Novel (for email) | Exists in medicine, finance | Applied to email filtering — unprecedented transparency |
| Reclassification → learning | Semi-novel | Gmail "Not spam" exists but doesn't communicate learning | Kyrra explicitly says "I learned" — emotional feedback |
| Onboarding scan "wow" | Novel | No competitor does instant inbox diagnostic | "312 emails were noise" — first value in 30 seconds |

No pattern requires user education. Marc knows how to read emails, click links, and understand numbers. The only new element is the Recap — but a CEO already receives briefings. Mental model is pre-existing.

### Experience Mechanics — 3 Critical Flows

**Flow 1 — Morning Recap (30 seconds):**
```
Initiation:  Marc opens Gmail on iPhone. Sees Recap in inbox.
Interaction: Opens email. Visual scan top to bottom:
             1. "✓ Your inbox is protected. 25 distractions removed."
             2. "2 emails deserve your attention" (À voir cards)
             3. "~20 min saved today"
Feedback:    Each "À voir" has 1-line summary + "View in Gmail →" link
             Marc clicks 1 relevant email → Gmail opens directly
Completion:  Marc closes Recap. Done in 30 seconds.
             He knows: nothing missed, 1 opportunity found, time saved.
```

**Flow 2 — Reclassification (30 seconds):**
```
Initiation:  Marc checks Filtered folder (W1). Sees client email
             classified "Filtered 68%". Anxiety spikes.
Interaction: Clicks "This is not prospecting" (1 button)
Feedback:    T+50ms green pulse → T+200ms "✓ Got it" →
             T+500ms toast "Kyrra learned. This sender will be recognized."
             T+<10s Gmail label updated
Completion:  Anxiety → relief. Error corrected AND system learned.
             Sub-line: "📋 dupont@company.fr added to whitelist"
```

**Flow 3 — Onboarding (3-5 minutes):**
```
Initiation:  Marc clicks "Try free" on kyrra.io
             → Pre-OAuth page: "What we do ✓ / What we NEVER do ✗"
             → Clicks "Connect Gmail →" → Google OAuth
Interaction: OAuth accepted → redirect /onboarding-progress
             Real-time counters: "234 emails analyzed... 42 contacts..."
             Progressive results from T+30s
Feedback:    T+30s "Already found: 23 contacts, 47 prospecting emails"
             T+15s "Close safely — email when done"
             T+final subtle confetti + "847 analyzed, 312 noise, 42 whitelisted"
Completion:  CTA "View your dashboard →"
             "1h post-signup" email confirms scan + announces first Recap
```

## Design Direction Decision

### Direction Chosen: Nordic Calm

**The emptiness IS the design.** Pure Scandinavian minimalism where white space communicates calm and control. Every pixel that isn't essential is removed.

**Visual reference:** `planning-artifacts/ux-design-directions.html` — Direction 01

### Key Visual Characteristics

- Pure white background (#fafaf9 light / #111110 dark), maximum white space
- Single column centered, max-width 640px (narrow = calm)
- Hero stat: Outfit 72px / font-weight 300 (light, not bold — elegance through restraint)
- Status: tiny green dot (7px) with slow pulse animation (3s cycle) + plain text
- Cards: 1px border only (no shadows, no backgrounds, no gradients)
- Alerts: flat rows with pill badges, no card wrappers
- Typography hierarchy: hero (72px) → cards (20px) → body (13px) → labels (11px uppercase)
- Color: near-monochrome. Blue accent (#3b82f6) reserved exclusively for "À voir" elements
- Interactions: opacity change on hover (0.7), no scale transforms, no shadows on hover
- Animation: subtle, slow — the pulse on the green dot is the only persistent animation

### What Was Rejected (and Why)

| Direction | Why Rejected |
|-----------|-------------|
| Glass Dashboard | Glassmorphism adds visual complexity — contradicts "absence is the product" |
| Dark Command Center | Too data-dense for default simple mode. Dark-first doesn't match "morning coffee" context |
| Warm Executive | Serif fonts + warm tones feel "boutique" not "invisible guardian". The personality competes with the content |

### Design Rules Derived from Nordic Calm

1. **No shadows on cards.** Borders only (1px, barely visible). Shadows imply depth and visual weight.
2. **No background fills on cards.** Transparent cards on white surface. The card IS the border.
3. **No gradients anywhere** in the dashboard. Flat, monochrome, honest.
4. **Blue only for actionable elements.** "À voir" pill, links, CTA. Everything else is grayscale.
5. **Hero stat is LIGHT weight (300), not bold.** Boldness shouts. Lightness whispers. Kyrra whispers.
6. **Status indicator is a 7px dot, not a banner.** The smallest possible signal that everything is OK.
7. **Hover = subtle opacity change.** No scale, no shadow addition, no color change. Restraint.
8. **Maximum line count per screen: ~15 visible lines.** If the dashboard shows more, it's too dense.

## User Journey Flows

### Journey 1 — Onboarding (3-5 minutes)

**Route flow:** `kyrra.io` → `/connect-gmail` (pre-OAuth) → Google OAuth → `/onboarding-progress` (scan) → `/(dashboard)` (first visit)

**Key screens:**

| Screen | Route | Type | Content |
|--------|-------|------|---------|
| Pre-OAuth | `/connect-gmail` | Server Component | What we do ✓ / What we NEVER do ✗ / clean uninstall guarantee |
| Scan progress | `/onboarding-progress` | Client Component | Real-time counters, progress bar, "close safely" at T+15s |
| Dashboard first visit | `/(dashboard)` | Server Component | Nordic Calm with scan results as hero stat |

**Critical moments:**
- Pre-OAuth reassurance screen (W1 friction → P0)
- Progressive results from T+3s (W2 friction → don't wait for full scan)
- "Close safely" permission at T+15s (user can leave without anxiety)
- "1h post-signup" email bridges gap to first Recap (W3 friction)
- Subtle confetti on scan completion (5-6 gold particles, not festive)

### Journey 2 — Morning Recap (30 seconds)

**Flow:** Gmail inbox → open Recap → scan 3 sections → click "À voir" → Gmail opens email directly

**Recap email structure (top → bottom, mobile-first):**

```
Header:    Kyrra logo 24px + date (1 line, minimal)
Section 1: "✓ Votre boîte est protégée" (reassurance FIRST)
Section 2: "25 distractions supprimées · ~20 min gagnées" (hero stat + value)
Section 3: "À voir (2)" — email cards with 1-line summary + "Voir dans Gmail →" (deep link)
Section 4: Cumulative stats since signup ("89 filtrés, ~2h gagnées, valeur 45€")
Footer:    Referral CTA (discreet) + frequency settings + unsubscribe
```

**Rule:** Everything above "À voir" must be visible WITHOUT SCROLL on iPhone SE (320px width).
**Rule:** "Voir dans Gmail →" = direct deep link (`mail.google.com/...#inbox/MESSAGE_ID`). Zero intermediate page.

### Journey 3 — Reclassification (30 seconds)

**3 entry paths, same outcome:**

| Path | Trigger | Latency | Feedback |
|------|---------|---------|----------|
| Dashboard button | Click "Not prospecting" | <200ms feedback, <10s Gmail update | MI-1: pulse → toast "Kyrra learned" + whitelist |
| Gmail label drag | Move email out of Filtered label | <5 min detection | Banner "Help Kyrra learn" at next dashboard visit |
| Recap token | Click "Reclassify →" in email | 2-5s poll | MI-10: spinner → checkmark → "Kyrra learned" → redirect |

**Emotional arc:** Anxiety (found false positive) → immediate relief (green pulse) → satisfaction ("Kyrra learned") → trust +1

**Post-reclassification effects:**
- Sender auto-added to whitelist (sub-line in toast, not separate notification)
- Gmail label updated in <10s
- Classification model adjusts for future emails from this sender
- Weekly reclassification rate decreases (visible in detailed dashboard)

### Journey 4 — Dashboard Simple ↔ Detailed

**Same URL, no page change.** Toggle = discreet text button bottom of simple dashboard.

**Simple mode (Server Component, FCP <500ms):**
- ProtectedStatusBadge ("✓ Protected" green dot)
- HeroStat (NumberTicker animation: 0→25)
- 3 stat cards (À voir, Mode, Trust)
- Alert email cards (if any)
- "View filtered in Gmail →" link (visible weeks 1-3)
- "View details" toggle

**Detailed mode (Client Component, TanStack Query 30s refetch):**
- Same hero stat (shrunk to 24px via MI-4 layout animation)
- Classification chart (7-day trend, shadcn/ui Chart)
- Confidence distribution histogram
- Reclassification history
- Fingerprint vs LLM ratio
- "Simple mode" toggle to return

**Transition animation (MI-4):**
- Simple → Detailed: hero shrinks (48→24px), charts stagger fade-in (400ms total)
- Detailed → Simple: charts fade-out, hero expands (24→48px, 350ms ease-out = "return to calm")

### Journey Patterns (Reusable)

**Pattern: "Redirect to Gmail"** — Any action concerning a specific email → direct Gmail deep link. Never an intermediate Kyrra page. Used in: Recap links, "View filtered", reclassification confirmation.

**Pattern: "Toast + Learn"** — Any user correction → toast with "learned" verb + auto-secondary action (whitelist add). Used in: dashboard reclassification, Gmail reclassification detected, token redemption.

**Pattern: "Progressive feedback"** — Long-running operations → immediate partial results + final result with subtle celebration. Used in: onboarding scan, token redemption.

**Pattern: "Calm state as default"** — Dashboard shows positive state ("protected") by default, not neutral ("empty"). Alerts are additive (added to calm state), not a replacement. Used in: dashboard simple, Recap header.

## Component Strategy

### Design System Coverage

**shadcn/ui (direct use):** Button, Card, Badge, Toast, Dialog, Progress, Skeleton, Chart, Tooltip
**Magic UI (animated):** NumberTicker (hero stat), AnimatedList (email stagger), BlurFade (onboarding transitions)

### Custom Components

**ProtectedStatusBadge** — 7px green dot (pulse 3s) + "Votre boîte est protégée". States: protected/alert/degraded/paused. `role="status"`, `aria-live="polite"`. Motion fade-in 200ms. State changes: cross-fade text 200ms.

**ExposureModePills** — 3 pills (Strict/Normal/Permissive) with sliding highlight. `role="radiogroup"`, keyboard arrow nav. Motion layout animation (spring stiffness 300). Click → visual switch → toast 500ms → apply to new emails.

**ClassificationCard** — Status pill + 1-line summary (text-overflow: ellipsis) + "Voir dans Gmail →". Entire card clickable → Gmail deep link. Hover: opacity 0.7 only (Nordic Calm restraint). Stagger entrance via AnimatedList. `role="article"`.

**DegradedModeBanner** — Amber banner, persistent (no dismiss button). Slide-down 300ms. Auto-disappears when resolved + green toast. `role="alert"`, `aria-live="assertive"`. Never red, never "!".

**TrustScoreIndicator** — Circular/linear progress + percentage + trend arrow (↑ green / ↓ amber). `role="meter"`. Spring animation (stiffness 100, damping 20). First load: 0 → value over 800ms.

**RecapEmailTemplate** — HTML tables + inline CSS + Arial font. <80KB. No JS, no CSS vars. MSO conditionals for Outlook. Dark mode via `@media (prefers-color-scheme: dark)`. Deep links to Gmail ONLY. Everything above "À voir" visible without scroll on iPhone SE.

### Implementation Roadmap

| Sprint | Components | Effort |
|--------|-----------|--------|
| Sprint 1 | shadcn/ui setup (Button, Card, Badge, Progress, Skeleton) + ProtectedStatusBadge + ClassificationCard | Foundation |
| Sprint 2 | NumberTicker + Toast reclassification + ExposureModePills + RecapEmailTemplate v1 | Core interactions |
| Sprint 3 | DegradedModeBanner + TrustScoreIndicator + Chart (detailed) + AnimatedList + BlurFade | Polish |

## UX Consistency Patterns

### Button Hierarchy

| Level | Style | Usage | Max per screen |
|-------|-------|-------|---------------|
| Primary | Blue fill, white text, 8px radius | 1 per page max — main action | 1 |
| Secondary | Border 1px gray, transparent bg | Secondary actions | 1 |
| Ghost | Text only, blue, no border | Inline action links | Unlimited |
| Danger | Amber fill (never red!), white text | Destructive actions | 1 |

**Rule:** Max 2 CTA buttons (Primary + Secondary) per screen. Ghost links (inline navigation to Gmail) are unlimited and don't count toward this limit.

### Feedback Patterns

| Type | Color | Component | Duration | Usage |
|------|-------|-----------|----------|-------|
| Success | Green muted | Toast `{ title, description }` | 3s auto | Reclassification, mode switch, whitelist |
| Info | Blue | Toast | 3s auto | "Scan en cours", "Email envoyé" |
| Warning | Amber | Banner persistent | Until resolved | Degraded mode, Free plan limit |
| Error | Amber (not red!) | Toast + inline | 5s + persist | Failed reclassification, connection lost |

**Toast sub-line:** Use native shadcn/ui `toast({ title: "Kyrra a appris.", description: "dupont@company.fr ajouté à la whitelist" })`. No custom component needed.

**Post-reclassification feedback chain:**
1. T+0ms: Button press → green pulse (MI-1)
2. T+200ms: "✓ Compris"
3. T+500ms: Toast "Kyrra a appris" with whitelist sub-line (3s)
4. T+3000ms: Toast fades → opt-in link appears below the reclassified card: "Pourquoi mal classé ? Aidez-nous."
5. If Marc clicks → Sheet slide-in (shadcn/ui Sheet, right side) with 3 options: faux positif / mauvaise catégorie / whitelist sender (FR46)

### Contextual Banner Pattern (FR47)

**"Help Kyrra learn" banner** — triggered when Gmail reclassification detected (user moved email label):
- Appears at next dashboard visit (not immediately — respect async nature)
- Dismissible (×) unlike DegradedModeBanner (persistent)
- Amber-50 background, text: "Vous avez modifié un label dans Gmail. Aidez Kyrra à comprendre."
- CTA button: "Expliquer" → opens same Sheet as FR46

Three banner types in Kyrra:
| Banner | Persistent | Dismissible | Color |
|--------|-----------|-------------|-------|
| DegradedModeBanner | Yes (until resolved) | No | Amber |
| HelpKyrraLearnBanner | Until dismissed or explained | Yes | Amber-50 (lighter) |
| (No other banners) | — | — | — |

### Navigation Patterns

- **Dashboard ↔ Detailed:** Toggle on same page. No URL change.
- **Dashboard/Recap → Gmail:** Ghost link, opens new tab. Deep link direct.
- **Dashboard → Settings:** Gear icon top-right (no sidebar, no nav bar).
- **"Voir les filtrés dans Gmail →":** Always visible. Never hidden programmatically. Cognitive disappearance only (user stops noticing by week 3).

### Empty States

| State | Message | Micro-CTA |
|-------|---------|-----------|
| No emails classified yet (D1) | "Kyrra surveille votre boîte. Le premier rapport arrive bientôt." | None — wait state |
| Zero "À voir" today | "Rien à signaler. Votre boîte est calme." | "Voir les tendances de la semaine →" (ghost link to detailed) |
| Detailed mode no data (new user) | "Les statistiques apparaîtront après quelques jours." | None — informational |
| Scan in progress | Real-time counters + progress bar | "Fermez sans souci" at T+15s |

### Loading States

| Surface | Pattern | Skeleton needed? |
|---------|---------|-----------------|
| Dashboard simple (Server Component + Cache) | Instant FCP <500ms | **No** — Cache Components renders instantly |
| Dashboard detailed (Client Component) | Skeleton shimmer | Yes — TanStack Query loading |
| Reclassification | Button collapse + pulse | No skeleton — immediate feedback |
| Token redemption | Spinner | No skeleton — different UX |

**Rule:** If loading <200ms, no skeleton (prevents flash). If >200ms, skeleton. If >2s, skeleton + text message.

### Content Patterns

| Content | Rule |
|---------|------|
| Email summaries | Strict 1 line. `text-overflow: ellipsis`. Never 2 lines. |
| Confidence scores | Visible <75% only. Opt-in full visibility in Settings > Display (FR43). Format: "72%" in caption gray. |
| Time saved | "~20 min" (approximate — the "~" is intentional) |
| Counters | No decimals. "25 filtrés" not "25.0" |
| Dates | "Aujourd'hui", "Hier", "19 mars" — never ISO/timestamp |
| Toast messages | Past tense + consequence: "Kyrra a appris. Cet expéditeur sera reconnu." |
| Gmail labels | Always prefixed: "Kyrra — À voir", "Kyrra — Filtré", "Kyrra — Bloqué" |

### Form Patterns

- Label always above input (never floating)
- Validation inline, amber text (never red), human language
- `params: unknown` + Zod server-side (architecture). Client = UX feedback only.
- Submit = Primary button, disabled + spinner during submit, success toast after

### Settings: Confidence Score Visibility (FR43)

**Location:** Settings > Display > "Afficher les scores de confiance"
**Options:** "Seulement en cas de doute (<75%)" (default) | "Toujours afficher"
**Effect:** When "Toujours afficher", detailed dashboard shows confidence on every classification.
**Note:** This is a Settings toggle, NOT a dashboard toggle. Power users (Nathalie DRH) find it in Settings. Marc never touches it.

## Responsive Design & Accessibility

### Responsive Strategy

| Surface | Primary device | Approach |
|---------|---------------|----------|
| Dashboard simple | Desktop (laptop) | Desktop-first, mobile = single column collapse |
| Dashboard detailed | Desktop only | Charts hidden or simplified on mobile |
| Recap email | **Mobile (iPhone)** | Mobile-first, desktop = wider version |
| Onboarding | Desktop | Desktop-first, mobile = single column |
| Settings | Desktop | Desktop-first, simple form |
| Pre-OAuth | Both | Single column always (responsive by nature) |

### Breakpoints (Tailwind v4)

```
< 768px (mobile):   Single column. Dashboard 100% - 32px padding.
768-1024px (tablet): Dashboard centered, max-width 640px.
> 1024px (desktop):  Simple centered 640px. Detailed: 2-col max-width 1200px.

Recap email: default = mobile (320px min). @media (min-width: 600px) = wider.
```

### Device-Specific Behaviors

**Desktop:** Hover states, keyboard nav, gear icon settings, 2-col detailed mode.
**Mobile (dashboard fallback):** Touch `:active` states, 44x44px targets, stacked single column, hamburger for settings.
**Mobile (Recap primary):** Full-width 16px padding, 32px hero (not 48), full-width tap targets, compact footer.

### Accessibility — WCAG 2.1 AA

**Color contrast:** All combinations meet AA minimum (4.5:1 text, 3:1 large text). Body text on background: 15.4:1 (AAA).

**Keyboard:** Full Tab navigation on dashboard. Arrow keys for ExposureModePills. Focus trapped in Sheet/Dialog. Escape closes overlays.

**Screen reader ARIA:**
- ProtectedStatusBadge: `role="status"` `aria-live="polite"`
- HeroStat: `aria-label` with full text
- ClassificationCard: `role="article"`
- ExposureModePills: `role="radiogroup"`
- DegradedModeBanner: `role="alert"` `aria-live="assertive"`
- TrustScoreIndicator: `role="meter"` `aria-valuenow`

**Color-blind safe:** Never color alone — every status has icon + text + color (triple signal).

**Reduced motion:** `prefers-reduced-motion` disables all Motion animations. CSS fallback for essential transitions.

**Skip link:** "Skip to main content" hidden until focused (Tab).

### Recap Email Accessibility

Alt text on all images. Semantic `<h1>` for hero. 14px minimum body. Blue underlined links. Dark mode via `@media (prefers-color-scheme: dark)`. Hidden preheader for screen readers + email preview.

### Testing Strategy

**Responsive:** Playwright viewports (iPhone SE 375×667, iPhone 14 390×844, iPad 768×1024, desktop 1440×900).
**Email:** Litmus/Email on Acid — Gmail (web+iOS+Android), Outlook (desktop+web), Apple Mail dark.
**Accessibility:** axe-core in CI (`@axe-core/playwright`), manual VoiceOver, keyboard-only nav test.
**Size:** Recap <80KB automated check.
