# Kyrra UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete visual overhaul of the Kyrra web app — landing page, dashboard, login — implementing the "Navy Serein + Tech Precision" design system approved on 2026-03-31.

**Architecture:** Replace all existing design tokens, typography (Inter/Outfit/JetBrains Mono → DM Sans/Instrument Serif/IBM Plex Mono), color palette, and component styles. Remove all glassmorphism, gradients, shadows, rounded corners. Apply square edges, flat colors, dot-grid/noise textures, monospace data labels, and 3px classification bars throughout.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Google Fonts (DM Sans, Instrument Serif, IBM Plex Mono), Motion v12, Lucide icons.

**Design Spec:** `docs/superpowers/specs/2026-03-31-kyrra-ux-redesign-spec.md`

**Visual Reference:** `.superpowers/brainstorm/8326-1774976285/content/design-system-tech.html`

---

## Epic 1 — Design System Foundation

### Task 1.1: Replace fonts in root layout

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Update font imports**

Replace current Inter/Outfit/JetBrains Mono imports with DM Sans, Instrument Serif, IBM Plex Mono from `next/font/google`.

```tsx
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})
```

Note: Instrument Serif is not available in `next/font/google` under that exact name. Add it via `<link>` in the `<head>` or use `next/font/google` with `Instrument_Serif`. Check availability first — if not available, load from Google Fonts CDN in layout.

- [ ] **Step 2: Apply font variables to body**

```tsx
<body className={`${dmSans.variable} ${ibmPlexMono.variable} antialiased`}>
```

- [ ] **Step 3: Verify fonts load**

Run: `npm run dev` in `apps/web/`, open browser, inspect body element — confirm `--font-sans` and `--font-mono` CSS variables are set.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "design: replace fonts — DM Sans + IBM Plex Mono + Instrument Serif"
```

---

### Task 1.2: Rewrite globals.css with new design tokens

**Files:**
- Rewrite: `apps/web/app/globals.css`

- [ ] **Step 1: Replace entire globals.css**

Remove all existing content. Write the new design system:

```css
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Radius — zero everywhere */
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-pill: 0px;

  /* Classification colors */
  --color-tag-blue-bg: #e8edf8;
  --color-tag-blue: #2d4a8a;
  --color-tag-gray-bg: #edeef2;
  --color-tag-gray: #5c6070;
  --color-tag-red-bg: #f8e8e8;
  --color-tag-red: #8a2d2d;

  /* Status */
  --color-green: #1a7a4a;
  --color-green-dot: #2dd881;
  --color-red-num: #c23a3a;
  --color-accent: #3a5bc7;

  /* Shadows — none */
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
}

/* ── LIGHT MODE (default & only mode for app) ── */
:root {
  --background: #f5f6f9;
  --foreground: #1a1f36;
  --card: #ffffff;
  --card-foreground: #1a1f36;
  --muted: #f5f6f9;
  --muted-foreground: #8b90a0;
  --accent: #3a5bc7;
  --accent-foreground: #ffffff;
  --border: #e4e6ed;
  --input: #e4e6ed;
  --ring: #3a5bc7;
  --radius: 0px;
  --primary: #0c1a32;
  --primary-foreground: #ffffff;
  --secondary: #f5f6f9;
  --secondary-foreground: #1a1f36;
  --destructive: #c23a3a;
  --destructive-foreground: #ffffff;
  --popover: #ffffff;
  --popover-foreground: #1a1f36;

  /* Sidebar */
  --sidebar-bg: #0c1a32;
  --sidebar-fg: rgba(255, 255, 255, 0.3);
  --sidebar-fg-active: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-hover: rgba(255, 255, 255, 0.06);
  --sidebar-active: rgba(255, 255, 255, 0.06);
}

/* ── Dark scope for marketing navy sections ── */
.section-navy {
  --background: #0c1a32;
  --foreground: #ffffff;
  --card: #162544;
  --card-foreground: #ffffff;
  --muted-foreground: rgba(255, 255, 255, 0.4);
  --border: rgba(255, 255, 255, 0.08);
}

/* ── Base ── */
* {
  border-color: var(--border);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* ── Dot grid texture ── */
.bg-dot-grid {
  background-image: radial-gradient(circle at 1px 1px, rgba(12, 26, 50, 0.04) 1px, transparent 0);
  background-size: 20px 20px;
}

/* ── Noise overlay (for navy sections) ── */
.bg-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* ── Classification bar ── */
.bar-a-voir { width: 3px; background: var(--color-tag-blue); }
.bar-filtre { width: 3px; background: #c4c7d4; }
.bar-bloque { width: 3px; background: #d4a0a0; }

/* ── Status dot pulse ── */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-dot {
  width: 5px;
  height: 5px;
  background: var(--color-green-dot);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--color-green-dot);
  animation: pulse-dot 3s ease-in-out infinite;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify the app builds**

Run: `cd apps/web && npm run build`
Expected: Build succeeds. Some components may have visual issues (expected — they reference old tokens).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "design: rewrite globals.css — Navy Serein token system"
```

---

### Task 1.3: Update UI primitives (badge, card, button)

**Files:**
- Modify: `apps/web/components/ui/badge.tsx`
- Modify: `apps/web/components/ui/card.tsx`
- Modify: `apps/web/components/ui/button.tsx`

- [ ] **Step 1: Rewrite badge.tsx**

Replace with square classification badges using new color tokens:

```tsx
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        'a-voir': 'bg-[var(--color-tag-blue-bg)] text-[var(--color-tag-blue)]',
        'filtre': 'bg-[var(--color-tag-gray-bg)] text-[var(--color-tag-gray)]',
        'bloque': 'bg-[var(--color-tag-red-bg)] text-[var(--color-tag-red)]',
        'protected': 'bg-emerald-50 text-[var(--color-green)]',
        'muted': 'bg-[var(--muted)] text-[var(--muted-foreground)]',
      },
    },
    defaultVariants: { variant: 'muted' },
  },
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

- [ ] **Step 2: Rewrite card.tsx**

Remove glass variant. Square borders only:

```tsx
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5', className)} {...props} />
}
```

- [ ] **Step 3: Update button.tsx**

Remove all rounded variants. Square buttons only:

```tsx
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90',
        secondary: 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]',
        inverse: 'bg-white text-[var(--primary)] font-semibold hover:opacity-90',
        ghost: 'hover:bg-[var(--muted)]',
        destructive: 'bg-[var(--destructive)] text-white hover:opacity-90',
      },
      size: {
        default: 'px-7 py-3 text-sm',
        sm: 'px-4 py-2 text-xs',
        lg: 'px-9 py-4 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/ui/badge.tsx apps/web/components/ui/card.tsx apps/web/components/ui/button.tsx
git commit -m "design: update UI primitives — square badges, cards, buttons"
```

---

## Epic 2 — Dashboard Redesign

### Task 2.1: Rewrite Sidebar with navy bg + pipeline status

**Files:**
- Rewrite: `apps/web/components/layout/Sidebar.tsx`
- Modify: `apps/web/components/layout/SidebarItem.tsx`
- Modify: `apps/web/components/layout/SidebarSection.tsx`

- [ ] **Step 1: Rewrite Sidebar.tsx**

Full rewrite with navy background, noise texture, pipeline status section, monospace labels. Use the design from the approved mockup. Key changes:
- Background: `var(--sidebar-bg)` (#0c1a32)
- Logo: square icon (no border-radius) + "Kyrra" text + green status dot with "actif" mono label
- Nav items: white text for active, 0.3 opacity for inactive, 0.06 bg for active
- Pipeline section: mono labels for fingerprint/llm gateway/gmail sync with green dots
- User card at bottom: square avatar + name + mono email
- Noise texture overlay via `bg-noise` class + relative positioning

- [ ] **Step 2: Update SidebarItem.tsx**

Remove all rounded classes. Use square hover states with `bg-white/[0.06]`. Active state = white text + same bg. Font: 13px DM Sans.

- [ ] **Step 3: Update SidebarSection.tsx**

Use mono font (font-mono), 8px uppercase, letter-spacing 0.14em, color rgba(255,255,255,0.15) for section labels.

- [ ] **Step 4: Verify sidebar renders**

Run dev server, login, check sidebar at /dashboard. Verify navy background, white text, pipeline status section visible.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/layout/Sidebar.tsx apps/web/components/layout/SidebarItem.tsx apps/web/components/layout/SidebarSection.tsx
git commit -m "design: sidebar — navy bg, pipeline status, noise texture"
```

---

### Task 2.2: Rewrite Dashboard page

**Files:**
- Rewrite: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Modify: `apps/web/components/dashboard/StatCard.tsx`

- [ ] **Step 1: Rewrite StatCard.tsx**

Replace with a stat cell designed to sit inside a unified container. No individual card borders — the parent container provides the border. Each stat cell has: mono caption label (uppercase, 9px, letter-spacing 0.06em), large number (36px, 700 weight), mono sublabel (trend data).

- [ ] **Step 2: Rewrite dashboard/page.tsx**

New structure:
1. Header: "Bonjour, {firstName}" (22px, 700) + mono date line + status badge ("protégé" with green dot, bordered)
2. Stat block: single white container with 1px border, 3 cells separated by `border-r`. Cells: "Triés aujourd'hui" / "Prospection bloquée" / "Temps gagné" with trend sublabels in mono.
3. Email list: white container with 1px border. Header row ("Derniers emails triés" + "tout voir →" link). Email rows with: 3px classification bar (left), title + subtitle, tag badge (right), confidence % + time in mono.
4. Opacity: 1.0 for À voir, 0.55 for Filtré, 0.3 for Bloqué.

Keep all existing Supabase queries — only change the JSX/styling.

- [ ] **Step 3: Verify dashboard renders**

Run dev server, navigate to /dashboard. Verify stat block, email list, classification bars, mono labels.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/page.tsx apps/web/components/dashboard/StatCard.tsx
git commit -m "design: dashboard page — stat block, email list, classification bars"
```

---

### Task 2.3: Rewrite Emails page

**Files:**
- Modify: `apps/web/app/(dashboard)/emails/page.tsx`

- [ ] **Step 1: Update emails page**

Same email row design as dashboard but full-width. Each row: 3px bar + title + subtitle + badge + confidence + time. Add header with page title ("Mes emails", 22px 700) + count in mono. Keep existing Supabase query.

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(dashboard)/emails/page.tsx
git commit -m "design: emails page — classification bars, mono confidence"
```

---

### Task 2.4: Rewrite Labels page

**Files:**
- Modify: `apps/web/app/(dashboard)/labels/page.tsx`

- [ ] **Step 1: Update labels page**

Show 3 classification labels with their 3px colored bar + mono name + description. Square layout, no cards — just rows with borders. Header: "Libellés" (22px 700).

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(dashboard)/labels/page.tsx
git commit -m "design: labels page — classification bars, square layout"
```

---

### Task 2.5: Update Settings page + DashboardShell + TopBar

**Files:**
- Modify: `apps/web/app/(dashboard)/settings/page.tsx`
- Modify: `apps/web/components/dashboard/SettingsForm.client.tsx`
- Modify: `apps/web/components/layout/DashboardShell.tsx`
- Modify: `apps/web/components/layout/TopBar.tsx`

- [ ] **Step 1: Update SettingsForm.client.tsx**

Remove all rounded corners. Square inputs, square toggle, square borders. Use mono labels for section headers. Keep existing server actions and logic.

- [ ] **Step 2: Update settings/page.tsx**

Header: "Paramètres" (22px 700). Square card container for form.

- [ ] **Step 3: Update DashboardShell.tsx**

Ensure main content area uses `bg-[var(--background)]` (#f5f6f9). Remove any old rounded/shadow classes. Padding: px-9 py-7.

- [ ] **Step 4: Update TopBar.tsx**

Square mobile header. Navy logo area. Mono pipeline status. No rounded corners.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(dashboard)/settings/page.tsx apps/web/components/dashboard/SettingsForm.client.tsx apps/web/components/layout/DashboardShell.tsx apps/web/components/layout/TopBar.tsx
git commit -m "design: settings, shell, topbar — square, mono labels"
```

---

## Epic 3 — Landing Page Redesign

### Task 3.1: Update marketing layout + Navbar

**Files:**
- Modify: `apps/web/app/(marketing)/layout.tsx`
- Rewrite: `apps/web/components/marketing/Navbar.tsx`
- Rewrite: `apps/web/components/marketing/Footer.tsx`

- [ ] **Step 1: Update marketing layout**

Remove `.dark` class wrapper. Marketing pages are now white by default. Navy only on specific sections via `section-navy` class. Remove SmoothScroll wrapper (optional — can keep if desired). Keep LazyMotion and JSON-LD.

```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([getOrganizationSchema(), getSoftwareApplicationSchema()]) }}
      />
      <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </LazyMotion>
  )
}
```

- [ ] **Step 2: Rewrite Navbar.tsx**

White background, 1px bottom border. Left: square logo icon (20px, navy bg, white shield) + "Kyrra" (15px 700). Center-left: nav links (12px 500, slate color). Right: "Connexion" text + "Essai gratuit →" navy button (square). Mobile: hamburger with full-screen white overlay.

- [ ] **Step 3: Rewrite Footer.tsx**

Minimal footer. Left: mono "© 2026 Kyrra" + links (Confidentialité, CGU, Support). Right: green status dot + mono "all systems operational". 1px top border. No dark background.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(marketing)/layout.tsx apps/web/components/marketing/Navbar.tsx apps/web/components/marketing/Footer.tsx
git commit -m "design: marketing layout, navbar, footer — white base, square, mono"
```

---

### Task 3.2: Rewrite Hero section

**Files:**
- Rewrite: `apps/web/components/marketing/HeroSection.tsx`
- Delete: `apps/web/components/marketing/HeroGradient.tsx`

- [ ] **Step 1: Rewrite HeroSection.tsx**

Split layout (flex, 2 columns):
- **Left column** (flex-1, padding 56px 48px): mono label with green status dot ("Classification IA en temps réel", accent color). Instrument Serif display title "Faites taire le bruit." (52px). Serif italic "Gardez l'essentiel." (52px, subtle color). Body text (15px, slate). Two buttons: primary navy + secondary bordered. Mono footnote ("14 jours gratuits · Sans carte bancaire · Setup < 2min").
- **Right column** (flex-1, surface bg + dot-grid): email preview mockup showing 3 classified emails with 3px bars, confidence scores in mono, and pipeline status bar at bottom.

Use Motion v12 for staggered entrance (fade + translateY).

- [ ] **Step 2: Remove HeroGradient.tsx**

Delete the file. It's replaced by dot-grid background.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/marketing/HeroSection.tsx
git rm apps/web/components/marketing/HeroGradient.tsx
git commit -m "design: hero section — split layout, serif title, email preview"
```

---

### Task 3.3: Rewrite Stats + How It Works + Problem sections

**Files:**
- Rewrite: `apps/web/components/marketing/StatsSection.tsx`
- Rewrite: `apps/web/components/marketing/HowItWorks.tsx`
- Rewrite: `apps/web/components/marketing/ProblemSection.tsx`
- Delete: `apps/web/components/marketing/SocialProof.tsx`

- [ ] **Step 1: Rewrite StatsSection.tsx**

Metrics strip: 3 columns separated by borders. Large numbers (40px 700) + mono labels + mono sublabels. "312 distractions/sem", "45min temps récupéré", "<2sec latence classification". No cards — just border-divided cells. Top and bottom border on the whole strip.

- [ ] **Step 2: Rewrite HowItWorks.tsx**

Surface bg + dot-grid. Mono section label "Architecture du pipeline". 3 columns separated by vertical borders. Each: mono number (01/02/03), heading (17px 600), body text (13px), mono technical specs (scope, engine, latence). Step 3 includes mini label previews (3px bar + mono name in bordered boxes).

- [ ] **Step 3: Delete ProblemSection.tsx and SocialProof.tsx**

These sections are removed from the new design. The hero + stats strip communicate the problem directly.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/marketing/StatsSection.tsx apps/web/components/marketing/HowItWorks.tsx
git rm apps/web/components/marketing/ProblemSection.tsx apps/web/components/marketing/SocialProof.tsx
git commit -m "design: stats strip, how-it-works pipeline — mono tech specs"
```

---

### Task 3.4: Rewrite Security + Testimonials + CTA sections

**Files:**
- Rewrite: `apps/web/components/marketing/SecuritySection.tsx`
- Rewrite: `apps/web/components/marketing/TestimonialsSection.tsx`
- Rewrite: `apps/web/components/marketing/CTASection.tsx`
- Delete: `apps/web/components/marketing/SectionHeader.tsx`
- Delete: `apps/web/components/marketing/FeaturesSection.tsx`
- Delete: `apps/web/components/marketing/EmailSortAnimation.tsx`

- [ ] **Step 1: Rewrite SecuritySection.tsx → SovereigntySection**

Rename conceptually. Navy background + noise texture (relative + bg-noise). Left: mono label "Souveraineté", serif heading "Vos données restent en Europe.", body text. Right: 4 status items (green dot + mono label in bordered boxes): RGPD, UE, Zero retention, E2E.

- [ ] **Step 2: Rewrite TestimonialsSection.tsx**

Left: serif italic quote with 2px left navy border. Author name (13px 600) + mono detail. Right: data widget (bordered box with mono label, 3 metrics with 2px progress bars). No carousel — single testimonial, static.

- [ ] **Step 3: Rewrite CTASection.tsx**

Navy bg + noise. Left: serif heading "Prêt pour le calme ?" + mono footnote. Right: inverse white button "Essayer Kyrra →". Split layout (flex, space-between).

- [ ] **Step 4: Delete unused components**

Remove SectionHeader, FeaturesSection, EmailSortAnimation — replaced by new section designs.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/SecuritySection.tsx apps/web/components/marketing/TestimonialsSection.tsx apps/web/components/marketing/CTASection.tsx
git rm apps/web/components/marketing/SectionHeader.tsx apps/web/components/marketing/FeaturesSection.tsx apps/web/components/marketing/EmailSortAnimation.tsx
git commit -m "design: sovereignty, testimonial, CTA — navy sections, serif quotes"
```

---

### Task 3.5: Rewrite Pricing section

**Files:**
- Rewrite: `apps/web/components/marketing/PricingSection.tsx`
- Rewrite: `apps/web/components/marketing/PricingCard.tsx`

- [ ] **Step 1: Rewrite PricingSection.tsx**

Mono section label "Tarifs". Title (DM Sans 22px 700). 3-column grid: Free / Pro (highlighted with navy border-left 3px) / Team. Annual/monthly toggle with square button. Keep existing pricing data and toggle logic.

- [ ] **Step 2: Rewrite PricingCard.tsx**

Square card. Border 1px. Highlighted plan: additional 3px navy left border. Price: 36px 700. Feature list with simple checkmarks (text, no icons). CTA button: navy for Pro, secondary for others. Mono labels for plan names.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/marketing/PricingSection.tsx apps/web/components/marketing/PricingCard.tsx
git commit -m "design: pricing — square cards, mono labels, navy highlight"
```

---

### Task 3.6: Update landing page composition

**Files:**
- Modify: `apps/web/app/(marketing)/page.tsx`

- [ ] **Step 1: Update page.tsx section order**

New order (removing deleted sections, adding new ones):

```tsx
import { HeroSection } from '@/components/marketing/HeroSection'
import { StatsSection } from '@/components/marketing/StatsSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { SecuritySection } from '@/components/marketing/SecuritySection'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { CTASection } from '@/components/marketing/CTASection'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <SecuritySection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  )
}
```

Keep existing metadata export.

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(marketing)/page.tsx
git commit -m "design: landing page — new section composition"
```

---

## Epic 4 — Login Page Redesign

### Task 4.1: Rewrite login page

**Files:**
- Rewrite: `apps/web/app/(auth)/login/page.tsx`

- [ ] **Step 1: Rewrite login page**

Split layout (50/50):
- **Left panel**: Navy bg + noise texture. Top: square logo + "Kyrra". Center: serif italic testimonial quote. Bottom: mono "Souveraineté numérique" + green status dot + "Opérationnel".
- **Right panel**: White bg. "Bienvenue" (24px 700). Subtitle (13px muted). Google OAuth button (square, bordered, with Google icon). Divider ("ou" in mono uppercase). Disabled email/password fields (surface bg, 0.5 opacity). "Bientôt disponible" label (mono).

Keep all existing auth logic (redirect if user exists, searchParams for uninstalled, form action).

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(auth)/login/page.tsx
git commit -m "design: login page — navy left panel, square form right"
```

---

## Epic 5 — Cleanup & Polish

### Task 5.1: Remove unused animation components

**Files:**
- Delete: `apps/web/components/animation/GlowBorder.tsx`
- Delete: `apps/web/components/animation/NoiseOverlay.tsx` (replaced by CSS)
- Delete: `apps/web/components/animation/GridPattern.tsx` (replaced by CSS)
- Delete: `apps/web/components/animation/MagneticButton.tsx`
- Modify: `apps/web/components/animation/index.ts`

- [ ] **Step 1: Delete unused files**

```bash
git rm apps/web/components/animation/GlowBorder.tsx
git rm apps/web/components/animation/NoiseOverlay.tsx
git rm apps/web/components/animation/GridPattern.tsx
git rm apps/web/components/animation/MagneticButton.tsx
```

- [ ] **Step 2: Update index.ts**

Remove exports for deleted components. Keep TextReveal, CountUp, SmoothScroll.

- [ ] **Step 3: Fix any broken imports across the codebase**

Search for imports of deleted components and remove them.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused animation components (glow, noise, grid, magnetic)"
```

---

### Task 5.2: Update remaining dashboard components

**Files:**
- Modify: `apps/web/components/dashboard/ExposureModePills.client.tsx`
- Modify: `apps/web/components/dashboard/ProtectedStatusBadge.tsx`
- Modify: `apps/web/components/dashboard/DegradedModeBanner.tsx`
- Modify: `apps/web/components/dashboard/ReclassifyButton.client.tsx`
- Modify: `apps/web/components/dashboard/DeleteAccountDialog.client.tsx`

- [ ] **Step 1: Update all dashboard components**

For each: remove all rounded corners, remove shadows, remove gradients. Use square edges, flat colors, mono labels where appropriate. Keep all existing logic.

- ExposureModePills: square pills, navy active state, 1px border inactive
- ProtectedStatusBadge: bordered box with green dot + mono "protégé"
- DegradedModeBanner: amber left border (3px) + mono label, no rounded
- ReclassifyButton: square navy button
- DeleteAccountDialog: square dialog, square buttons

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/dashboard/
git commit -m "design: dashboard components — square, flat, mono"
```

---

### Task 5.3: Update connect-gmail and onboarding pages

**Files:**
- Modify: `apps/web/app/(auth)/connect-gmail/page.tsx`
- Modify: `apps/web/app/(auth)/connect-gmail/ConsentForm.client.tsx`
- Modify: `apps/web/app/(auth)/onboarding-progress/page.tsx`
- Modify: `apps/web/app/(dashboard)/reclassification-pending/page.tsx`

- [ ] **Step 1: Update connect-gmail**

Square layout. Navy header section. White form area. Mono labels for scopes. Square buttons.

- [ ] **Step 2: Update onboarding-progress**

Square progress indicators. Mono labels. Navy accent for completed steps. Keep existing logic.

- [ ] **Step 3: Update reclassification-pending**

Square spinner area. Mono status text. Green checkmark for done state. Keep existing polling logic.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(auth)/ apps/web/app/(dashboard)/reclassification-pending/
git commit -m "design: auth pages — square forms, mono labels, navy accents"
```

---

### Task 5.4: Visual verification with Playwright

**Files:** None (verification only)

- [ ] **Step 1: Start dev server and take screenshots**

Use Playwright to navigate to:
1. `/` — landing page (full page screenshot)
2. `/login` — login page
3. `/dashboard` — dashboard (requires auth)

Take screenshots at 1440px width. Verify:
- Zero rounded corners anywhere
- Navy sidebar on dashboard
- Serif italic on hero tagline
- Mono labels on stats, pipeline, metadata
- 3px classification bars on email rows
- Dot-grid on surface sections
- Noise texture on navy sections
- Correct colors from the palette

- [ ] **Step 2: Fix any visual issues found**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "design: visual fixes after Playwright verification"
```

---

## Task Dependency Graph

```
Epic 1 (Foundation) → Epic 2 (Dashboard) ──┐
                    → Epic 3 (Landing)  ────┤→ Epic 5 (Cleanup & Polish)
                    → Epic 4 (Login)    ────┘
```

Epic 1 must complete first. Epics 2, 3, 4 can run in parallel. Epic 5 runs after all others.
