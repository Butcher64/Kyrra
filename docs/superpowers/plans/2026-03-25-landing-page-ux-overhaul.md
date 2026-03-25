# Landing Page UX Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Kyrra landing page content to the PRD, unify CSS tokens, migrate Material Symbols to Lucide, and integrate 2 missing sections — all while preserving the existing Tech Froide visual design.

**Architecture:** 12-section landing page built with Next.js 16 App Router. Marketing components in `apps/web/components/marketing/`, page composition in `apps/web/app/(marketing)/page.tsx`, design tokens in `apps/web/app/globals.css`. All changes are frontend-only (no backend, no API).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4 (OKLch), Motion v12, GSAP, Lucide React, Lenis

**Spec:** `docs/superpowers/specs/2026-03-25-landing-page-ux-overhaul-design.md`

---

## Task 1: Add Surface Tokens + Fix CSS Utilities

**Files:**
- Modify: `apps/web/app/globals.css`

This task is the foundation — all other tasks depend on these tokens existing.

- [ ] **Step 1: Add surface tokens to @theme block**

In `apps/web/app/globals.css`, inside the `@theme { }` block, after the `/* Glass */` section (after line 49), add:

```css
/* Surface hierarchy */
--surface-lowest: oklch(0.06 0.01 270);
--surface-low: oklch(0.09 0.015 270);
--surface-container: oklch(0.12 0.015 270);
--surface-high: oklch(0.17 0.01 270);
--surface-highest: oklch(0.21 0.01 270);
--surface-darkest: oklch(0.04 0.01 270);
--on-primary: oklch(0.20 0.08 265);
```

- [ ] **Step 2: Fix .text-gradient utility**

In `globals.css`, replace the `.text-gradient` rule (line 166-171):

```css
/* Before */
background: linear-gradient(to right, #adc6ff, #4cd7f6);
/* After */
background: linear-gradient(to right, var(--color-accent-start), var(--color-accent-cyan));
```

- [ ] **Step 3: Remove Material Symbols CSS rule**

Delete lines 112-115 in `globals.css`:

```css
/* DELETE THIS */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

- [ ] **Step 4: Remove Material Symbols CDN from layout**

In `apps/web/app/layout.tsx`, find and remove the `<link>` tag that loads `fonts.googleapis.com/css2?family=Material+Symbols+Outlined`. Keep all other font links (Inter, Outfit, JetBrains Mono).

- [ ] **Step 5: Verify build**

Run: `cd apps/web && npx next build`
Expected: Build succeeds. There will be runtime warnings about missing `material-symbols-outlined` class in components we haven't migrated yet — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/globals.css apps/web/app/layout.tsx
git commit -m "feat: add surface tokens, fix text-gradient, remove Material Symbols"
```

---

## Task 2: Navbar — Fix Links

**Files:**
- Modify: `apps/web/components/marketing/Navbar.tsx`

- [ ] **Step 1: Replace navLinks array**

In `Navbar.tsx`, replace the `navLinks` array (lines 9-14) with:

```ts
const navLinks = [
  { href: '#features', label: 'Solutions' },
  { href: '#security', label: 'Sécurité' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#how-it-works', label: 'Comment ça marche' },
]
```

- [ ] **Step 2: Migrate hex colors to CSS vars**

In the same file, replace hardcoded colors:
- `bg-[#131318]/60` → `bg-[var(--background)]/60`
- `bg-[#131318]/80` → `bg-[var(--background)]/80`
- `bg-[#131318]/95` → `bg-[var(--background)]/95`
- `from-[#adc6ff] to-[#4d8eff]` → `from-[var(--color-accent-start)] to-[var(--primary)]`
- `text-[#002e6a]` → `text-[var(--on-primary)]`

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/marketing/Navbar.tsx
git commit -m "fix(navbar): correct nav links, migrate hex to CSS vars"
```

---

## Task 3: Hero — Fix Copy + Migrate Tokens

**Files:**
- Modify: `apps/web/components/marketing/HeroSection.tsx`

- [ ] **Step 1: Fix badge text**

Replace `"Intelligence Souveraine"` (line 27) with `"Pare-feu cognitif IA"`.

- [ ] **Step 2: Fix subtitle text**

Replace the subtitle content (line 55) with:
```
Kyrra filtre les emails de prospection par IA. Votre boîte ne garde que ce qui compte. Classification intelligente, zéro données stockées.
```

- [ ] **Step 3: Migrate hex colors to CSS vars**

In `HeroSection.tsx`:
- `text-[#4cd7f6]` → `text-[var(--color-accent-cyan)]`
- `from-[#adc6ff] to-[#4d8eff]` → `from-[var(--color-accent-start)] to-[var(--primary)]`
- `text-[#002e6a]` → `text-[var(--on-primary)]`
- `style={{ color: '#8B8B9E' }}` → `text-[var(--muted-foreground)]` (remove inline style)

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/marketing/HeroSection.tsx
git commit -m "fix(hero): align copy to PRD, migrate hex to CSS vars"
```

---

## Task 4: Problem Section — Fix Copy + Lucide Icons

**Files:**
- Modify: `apps/web/components/marketing/ProblemSection.tsx`

- [ ] **Step 1: Add Lucide imports**

At the top of the file, add:
```ts
import { BellRing, TimerOff, ShieldAlert } from 'lucide-react'
```

- [ ] **Step 2: Replace painPoints data**

```ts
const painPoints = [
  {
    icon: BellRing,
    title: 'Fatigue Décisionnelle',
    description: '18 à 22 emails de prospection par jour saturent votre attention de dirigeant.',
  },
  {
    icon: TimerOff,
    title: 'Temps Perdu',
    description: '2,5h/jour perdues à trier prospection, spam et emails légitimes.',
  },
  {
    icon: ShieldAlert,
    title: 'Risque Critique',
    description: 'Un email client critique noyé dans 50 sollicitations = contrat perdu.',
  },
]
```

- [ ] **Step 3: Replace icon rendering**

Replace the `<span className="material-symbols-outlined">{point.icon}</span>` with:
```tsx
<point.icon className="w-6 h-6" />
```

The type of `icon` changes from `string` to a Lucide component — update accordingly.

- [ ] **Step 4: Migrate hex colors to CSS vars**

- `bg-[#111118]` → `bg-[var(--surface-low)]`
- `border-[#adc6ff]/20` → `border-[var(--color-accent-start)]/20`  (hover)
- `text-[#adc6ff]` → `text-[var(--color-accent-start)]`
- `bg-[#2a292f]` → `bg-[var(--surface-high)]`
- `bg-[#adc6ff]` (underline) → `bg-[var(--color-accent-start)]`

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/ProblemSection.tsx
git commit -m "fix(problem): PRD copy, Lucide icons, CSS vars"
```

---

## Task 5: How It Works — Rewrite Copy

**Files:**
- Modify: `apps/web/components/marketing/HowItWorks.tsx`

- [ ] **Step 1: Replace steps data**

```ts
const steps = [
  {
    number: '1',
    title: 'Connectez Gmail',
    description: "OAuth en 1 clic, scan automatique de vos 6 derniers mois d'envois.",
  },
  {
    number: '2',
    title: 'Kyrra classe',
    description: 'Dual-engine IA : fingerprint rapide + LLM pour les cas ambigus, en moins de 2 minutes.',
  },
  {
    number: '3',
    title: '3 labels Gmail',
    description: 'À voir, Filtré, Bloqué. Plus un Recap quotidien par email chaque matin.',
  },
]
```

- [ ] **Step 2: Migrate hex colors to CSS vars**

- `bg-[#1b1b20]` → `bg-[var(--surface-container)]`
- `from-[#adc6ff] to-[#4d8eff]` → `from-[var(--color-accent-start)] to-[var(--primary)]`
- `text-[#002e6a]` → `text-[var(--on-primary)]`
- `shadow-[#adc6ff]/20` → `shadow-[var(--color-accent-start)]/20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/marketing/HowItWorks.tsx
git commit -m "fix(how-it-works): PRD-accurate Kyrra flow, CSS vars"
```

---

## Task 6: Features — Fix Classifier Mock Labels

**Files:**
- Modify: `apps/web/components/marketing/FeaturesSection.tsx`

- [ ] **Step 1: Replace emailItems data**

```ts
const emailItems = [
  {
    label: 'À voir',
    labelColor: 'text-[var(--color-a-voir)]',
    borderColor: 'border-l-[var(--color-a-voir)]',
    time: "À l'instant",
    content: 'Rapport de fusion trimestriel : Action requise avant 18h.',
    opacity: '',
  },
  {
    label: 'Filtré',
    labelColor: 'text-[var(--color-filtre)]',
    borderColor: 'border-l-[var(--color-filtre)]',
    time: 'Il y a 5 min',
    content: 'Mise à jour hebdomadaire de la newsletter interne...',
    opacity: 'opacity-40',
  },
  {
    label: 'Bloqué',
    labelColor: 'text-[var(--color-bloque)]',
    borderColor: 'border-l-[var(--color-bloque)]',
    time: 'Il y a 12 min',
    content: 'Promotion exceptionnelle sur les fournitures...',
    opacity: 'opacity-20',
  },
]
```

- [ ] **Step 2: Migrate ALL hex colors (replace_all for each pattern)**

Replace all instances in the file:
- `text-[#4cd7f6]` → `text-[var(--color-accent-cyan)]` (badge text + bullet dots)
- `bg-[#4cd7f6]` → `bg-[var(--color-accent-cyan)]` (bullet dots)
- `bg-[#4cd7f6]/40` → `bg-[var(--color-accent-cyan)]/40` (window chrome dot)
- `bg-[#adc6ff]/5` → `bg-[var(--color-accent-start)]/5` (glow blur)
- `bg-[#adc6ff]/40` → `bg-[var(--color-accent-start)]/40` (window chrome dot)
- `border-l-[#adc6ff]` → `border-l-[var(--color-accent-start)]` (if any remain)
- `style={{ boxShadow: '0 0 10px rgba(76,215,246,0.8)' }}` → `style={{ boxShadow: '0 0 10px oklch(0.72 0.19 195 / 0.8)' }}` (inline style — use OKLch to match design system)

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/marketing/FeaturesSection.tsx
git commit -m "fix(features): Kyrra labels (À voir/Filtré/Bloqué), CSS vars"
```

---

## Task 7: Security — Fix Badges + Lucide Icons

**Files:**
- Modify: `apps/web/components/marketing/SecuritySection.tsx`

- [ ] **Step 1: Add Lucide imports**

```ts
import { ShieldCheck, Globe, KeyRound } from 'lucide-react'
```

- [ ] **Step 2: Replace items data with Lucide components**

```ts
const items = [
  {
    icon: ShieldCheck,
    title: 'Chiffrement de bout en bout',
    description: 'Vos données ne sont jamais lues par des humains.',
  },
  {
    icon: Globe,
    title: 'Hébergement Souverain',
    description: 'Données stockées exclusivement sur serveurs européens.',
  },
  {
    icon: KeyRound,
    title: 'Contrôle Total',
    description: 'Audit de sécurité régulier et transparence algorithmique.',
  },
]
```

- [ ] **Step 3: Replace badges array**

```ts
const badges = ['RGPD Conforme', 'Hébergement EU', 'Zéro Data Retention']
```

- [ ] **Step 4: Replace icon rendering**

Replace `<span className="material-symbols-outlined text-5xl text-[#adc6ff] mb-6">{item.icon}</span>` with:
```tsx
<item.icon className="w-12 h-12 text-[var(--color-accent-start)] mb-6" strokeWidth={1.5} />
```

- [ ] **Step 5: Migrate remaining hex colors**

- `bg-[#111118]` → `bg-[var(--surface-low)]`

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/marketing/SecuritySection.tsx
git commit -m "fix(security): truthful badges, Lucide icons, CSS vars"
```

---

## Task 8: Stats + Testimonials — Integrate Missing Sections

**Files:**
- Modify: `apps/web/components/marketing/StatsSection.tsx`
- Modify: `apps/web/app/(marketing)/page.tsx`

- [ ] **Step 1: Update StatsSection content**

In `StatsSection.tsx`, replace the stats array:

```ts
const stats = [
  { value: 312, suffix: '', prefix: '', label: 'Emails filtrés par semaine en moyenne' },
  { value: 45, suffix: ' min', prefix: '', label: 'Gagnées par jour par dirigeant' },
  { value: 2, suffix: ' min', prefix: '<', label: 'Setup complet avec Gmail' },
]
```

- [ ] **Step 2: Align StatsSection styling**

Replace CSS var references that don't exist in our design system:
- `text-[var(--foreground)]` → this exists in `:root`, keep it
- `text-[var(--muted-foreground)]` → this exists in `:root`, keep it
- The component styling is already compatible. No changes needed.

- [ ] **Step 3: Update page.tsx composition**

In `apps/web/app/(marketing)/page.tsx`, add the imports and components:

```tsx
import { StatsSection } from '@/components/marketing/StatsSection'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
```

And update the render order:
```tsx
<HeroSection />
<SocialProof />
<ProblemSection />
<HowItWorks />
<FeaturesSection />
<SecuritySection />
<StatsSection />
<TestimonialsSection />
<PricingSection />
<CTASection />
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/marketing/StatsSection.tsx apps/web/app/\(marketing\)/page.tsx
git commit -m "feat: integrate Stats + Testimonials sections into landing page"
```

---

## Task 9: Pricing — Rewrite to PRD Tiers

**Files:**
- Modify: `apps/web/components/marketing/PricingSection.tsx`
- Modify: `apps/web/components/marketing/PricingCard.tsx`

- [ ] **Step 1: Replace plans array in PricingSection.tsx**

Replace the entire `plans` array (lines 7-48) with:

```ts
const plans = [
  {
    tier: 'Gratuit',
    tierKey: 'free',
    monthly: 0,
    yearly: 0,
    features: [
      '30 emails/jour',
      'Classification de base',
      '1 compte Gmail',
      'Dashboard simple',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    tier: 'Pro',
    tierKey: 'pro',
    monthly: 15,
    yearly: 12,
    features: [
      'Emails illimités',
      'Kyrra Recap quotidien',
      'Scores de confiance',
      'Résumé 1 ligne par email',
      "3 modes d'exposition",
    ],
    cta: 'Essai gratuit 14 jours',
    highlighted: true,
  },
  {
    tier: 'Team',
    tierKey: 'team',
    monthly: 19,
    yearly: 15,
    features: [
      'Tout Pro inclus',
      'Multi-utilisateurs',
      'Tableau admin équipe',
      'Whitelist partagée',
      'Support prioritaire (SLA 4h)',
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
  },
]
```

- [ ] **Step 2: Migrate hex colors in PricingSection.tsx**

- `bg-[#35343a]` → `bg-[var(--surface-highest)]`
- `bg-[#adc6ff]` → `bg-[var(--color-accent-start)]`
- `text-[#4cd7f6]` → `text-[var(--color-accent-cyan)]`

- [ ] **Step 3: Fix PricingCard free tier display**

In `PricingCard.tsx`, update the price rendering logic. Replace the `<motion.div>` price block (lines 53-61) with:

```tsx
{price === 0 ? (
  'Gratuit'
) : price !== null ? (
  <>
    {price}€
    <span className="text-sm text-slate-500 font-normal">/mois</span>
  </>
) : (
  'Sur Mesure'
)}
```

- [ ] **Step 4: Add Lucide import and migrate check_circle icon**

In `PricingCard.tsx`, add import:
```ts
import { CheckCircle } from 'lucide-react'
```

Replace `<span className="material-symbols-outlined text-[#adc6ff] text-sm">check_circle</span>` with:
```tsx
<CheckCircle className="w-4 h-4 text-[var(--color-accent-start)]" />
```

- [ ] **Step 5: Migrate ALL hex colors in PricingCard.tsx (replace_all for each)**

- `bg-[#111118]` → `bg-[var(--surface-low)]`
- `bg-[#1f1f25]` → `bg-[var(--card)]`
- `border-[#adc6ff]/30` → `border-[var(--color-accent-start)]/30`
- `bg-[#adc6ff]` → `bg-[var(--color-accent-start)]`
- `text-[#adc6ff]` → `text-[var(--color-accent-start)]` (tier label + badge — 2 instances)
- `text-[#002e6a]` → `text-[var(--on-primary)]`
- `from-[#adc6ff] to-[#4d8eff]` → `from-[var(--color-accent-start)] to-[var(--primary)]`

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/marketing/PricingSection.tsx apps/web/components/marketing/PricingCard.tsx
git commit -m "fix(pricing): PRD tiers (Free/Pro 15€/Team 19€), Lucide icons"
```

---

## Task 10: Footer — Lucide Icons + Token Migration

**Files:**
- Modify: `apps/web/components/marketing/Footer.tsx`

- [ ] **Step 1: Add Lucide imports**

```ts
import { Share2, AtSign } from 'lucide-react'
```

- [ ] **Step 2: Replace icon rendering**

Replace the two `<span className="material-symbols-outlined text-lg">share</span>` and `alternate_email` with:
```tsx
<Share2 className="w-4 h-4" />
```
```tsx
<AtSign className="w-4 h-4" />
```

- [ ] **Step 3: Migrate hex colors (use replace_all for each pattern)**

- `bg-[#0A0A0F]` → `bg-[var(--surface-darkest)]` (2 instances: footer bg + bottom bar)
- `hover:text-[#adc6ff]` → `hover:text-[var(--color-accent-start)]` (**3 instances**: productLinks, resourceLinks, legalLinks columns — use replace_all)
- `bg-[#4cd7f6]` → `bg-[var(--color-accent-cyan)]` (status dot)

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/marketing/Footer.tsx
git commit -m "fix(footer): Lucide icons, CSS vars"
```

---

## Task 11: SocialProof + CTA + SectionHeader — Token Migration

**Files:**
- Modify: `apps/web/components/marketing/SocialProof.tsx`
- Modify: `apps/web/components/marketing/CTASection.tsx`
- Modify: `apps/web/components/marketing/SectionHeader.tsx`

- [ ] **Step 1: SectionHeader hex migration**

- `text-[#4cd7f6]` → `text-[var(--color-accent-cyan)]` (badge text)
- `bg-[#adc6ff]` → `bg-[var(--color-accent-start)]` (underline bar)

- [ ] **Step 2: SocialProof hex migration**

- `bg-[#0e0e13]` → `bg-[var(--surface-lowest)]`
- `text-[#adc6ff]` → `text-[var(--color-accent-start)]`

- [ ] **Step 3: CTASection hex migration**

- `from-[#131318] to-[#0A0A0F]` → `from-[var(--background)] to-[var(--surface-darkest)]`
- `bg-[#adc6ff]` → `bg-[var(--color-accent-start)]`
- `text-[#002e6a]` → `text-[var(--on-primary)]`
- `border-[#131318]` → `border-[var(--background)]`
- `bg-[#adc6ff]/20` → `bg-[var(--color-accent-start)]/20`
- `text-[#adc6ff]` → `text-[var(--color-accent-start)]`

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/marketing/SocialProof.tsx apps/web/components/marketing/CTASection.tsx apps/web/components/marketing/SectionHeader.tsx
git commit -m "fix(social-proof,cta,section-header): migrate hex to CSS vars"
```

---

## Task 12: Build Verification + Playwright Visual Check

**Files:**
- No new files created

- [ ] **Step 1: Run build**

```bash
cd apps/web && npx next build
```

Expected: Build succeeds with zero errors. Zero references to `material-symbols-outlined` in any marketing component.

- [ ] **Step 2: Verify no remaining hardcoded hex in marketing components**

```bash
grep -rn "#131318\|#111118\|#0e0e13\|#1b1b20\|#0A0A0F\|#2a292f\|#35343a\|#adc6ff\|#4d8eff\|#4cd7f6\|#002e6a\|#8B8B9E" apps/web/components/marketing/
```

Expected: Zero matches. All hex values should be replaced with CSS vars.

- [ ] **Step 3: Verify no remaining Material Symbols usage**

```bash
grep -rn "material-symbols-outlined" apps/web/components/marketing/ apps/web/app/globals.css
```

Expected: Zero matches.

- [ ] **Step 4: Start dev server and take Playwright screenshots**

```bash
cd apps/web && npx next dev &
```

Then use Playwright to screenshot the landing page at 1440px width:
- Navigate to `http://localhost:3000`
- Screenshot full page

Compare visually against `design-reference/landing-desktop.png` — proportions and layout should match. Colors will differ slightly (OKLch vs hex) but should be visually equivalent.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: landing page UX overhaul — PRD-aligned content, unified tokens, Lucide icons

12 sections: Navbar, Hero, SocialProof, Problem, HowItWorks, Features,
Security, Stats, Testimonials, Pricing, CTA, Footer.

Key changes:
- Pricing: Free / Pro 15€ / Team 19€ (was 29€/79€/Sur Mesure)
- Copy: All sections aligned to PRD (email classification, Gmail-specific)
- Icons: Material Symbols → Lucide React (9 icons migrated)
- Tokens: 7 new surface tokens, all hex → CSS vars
- Sections: +Stats +Testimonials (10 → 12 sections)"
```
