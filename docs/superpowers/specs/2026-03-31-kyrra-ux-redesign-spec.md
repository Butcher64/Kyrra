# Kyrra UX Redesign — Design Specification

> Date: 2026-03-31
> Status: Approved
> Scope: Full UX overhaul — Landing page, Dashboard, Login, Design system

## Design Direction

**Navy Serein + Tech Precision.** A calm, minimal interface that communicates AI capability through data presentation rather than visual noise. Square edges, monospace metadata, dot-grid textures, and restrained use of navy blue on a white-dominant canvas.

**Reference:** Clause (Dribbble by Dipa UI/UX) — editorial restraint, serif personality, flat color, asymmetric layouts.

**What makes this unforgettable:** The 3px colored classification bars on email rows. The monospace confidence scores. The serif italic tagline. The pipeline status in the sidebar. These details say "this is an AI system that works" without any generic AI aesthetics.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | `#0c1a32` | Sidebar bg, CTA primary, h1 titles, max 2 landing sections |
| `--ink` | `#1a1f36` | Body text headings |
| `--slate` | `#4a5068` | Secondary text |
| `--muted` | `#8b90a0` | Captions, metadata labels |
| `--subtle` | `#c4c7d4` | Disabled text, timestamps |
| `--line` | `#e4e6ed` | All borders (1px solid) |
| `--surface` | `#f5f6f9` | Background sections (dot-grid areas) |
| `--white` | `#ffffff` | Page bg, cards, main content area |
| `--blue-tag-bg` | `#e8edf8` | "À voir" badge bg |
| `--blue-tag` | `#2d4a8a` | "À voir" text + 3px bar |
| `--gray-tag-bg` | `#edeef2` | "Filtré" badge bg |
| `--gray-tag` | `#5c6070` | "Filtré" text + 3px bar |
| `--red-tag-bg` | `#f8e8e8` | "Bloqué" badge bg |
| `--red-tag` | `#8a2d2d` | "Bloqué" text + 3px bar |
| `--green` | `#1a7a4a` | Positive numbers, "protégé" status |
| `--green-dot` | `#2dd881` | Pipeline status dot (with 6px glow shadow) |
| `--red-num` | `#c23a3a` | "Bloqués" stat number |
| `--accent` | `#3a5bc7` | Links, "tout voir →" |

## Typography

Three font families — each with a distinct role:

| Role | Font | Usage |
|------|------|-------|
| **Display** | Instrument Serif (400, italic) | Hero tagline, testimonial quotes, CTA headings. Serif italic = personality. Never for UI headings. |
| **Body** | DM Sans (300–700) | All UI text: headings, body, buttons, nav. Clean, modern, not generic. |
| **Data** | IBM Plex Mono (400, 500) | Labels, metadata, stats sublabels, confidence scores, pipeline status, timestamps. Monospace = tech credibility. |

### Type Scale

| Name | Font | Size | Weight | Extra |
|------|------|------|--------|-------|
| Display | Instrument Serif | 52px | 400 | letter-spacing: -0.02em |
| Display Italic | Instrument Serif | 52px | 400 italic | letter-spacing: -0.02em |
| H1 | DM Sans | 22px | 700 | letter-spacing: -0.03em |
| H2 | DM Sans | 17px | 600 | — |
| H3 | DM Sans | 14px | 600 | — |
| Body | DM Sans | 14px | 400 | line-height: 1.6 |
| Body Medium | DM Sans | 13px | 500 | — |
| Button | DM Sans | 13px | 500 | — |
| Caption | IBM Plex Mono | 10px | 500 | uppercase, letter-spacing: 0.06em |
| Label | IBM Plex Mono | 9px | 500 | uppercase, letter-spacing: 0.08-0.14em |
| Stat Number | DM Sans | 36px | 700 | letter-spacing: -0.04em |
| Stat Sub | IBM Plex Mono | 9px | 400 | — |
| Tag | DM Sans | 10px | 600 | uppercase, letter-spacing: 0.04em |

## Shape & Form Rules

1. **border-radius: 0** — Everything is square. Buttons, cards, inputs, tags, sidebar, badges. No exceptions except status dots and avatar circles.
2. **No gradients** — Flat colors only. No linear-gradient, no radial-gradient.
3. **No shadows** — No box-shadow. Hierarchy through borders (1px solid var(--line)) and background-color.
4. **No glassmorphism** — No backdrop-filter, no blur, no transparency effects.
5. **Borders only** — Separation via `1px solid var(--line)`. No visual weight beyond that.
6. **Classification indicator** — 3px vertical bar on the left side of email rows. Color matches classification. This is the signature visual element.

## Textures

Two subtle textures to add depth without visual noise:

| Texture | Where | Spec |
|---------|-------|------|
| **Dot grid** | `--surface` background sections (how-it-works, hero right panel) | `radial-gradient(circle at 1px 1px, rgba(12,26,50,0.04) 1px, transparent 0); background-size: 20px 20px` |
| **Noise** | `--navy` background sections (sovereignty, CTA, sidebar) | SVG feTurbulence fractalNoise, 3% opacity, absolute overlay with pointer-events: none |

Everything else: flat white or flat surface.

## Components

### Buttons

| Type | Style |
|------|-------|
| Primary | `bg: var(--navy)`, `color: white`, `padding: 12px 28px`, no border-radius |
| Secondary | `bg: white`, `border: 1px solid var(--line)`, `color: var(--navy)`, `padding: 12px 28px` |
| Inverse | `bg: white`, `color: var(--navy)`, `font-weight: 600` — used on navy backgrounds |

### Stat Block

Single container with 3 divisions separated by `border-right: 1px solid var(--line)`. White bg. Each cell: mono caption label (uppercase) + large DM Sans number + mono sublabel (trend data like `↑ 12% vs hier`).

### Email Row

- 3px vertical bar (left) — color = classification
- Title (13px, DM Sans 500 for "À voir", 400 for others)
- Subtitle (11px, muted)
- Tag badge (right) — square, colored bg + text
- Confidence + time (mono, 9px) — right-aligned below tag
- Opacity: 1.0 for "À voir", 0.55 for "Filtré", 0.3 for "Bloqué"

### Sidebar Navigation

- Background: var(--navy) with noise texture overlay
- Logo: square icon (22px, 0.06 opacity bg) + "Kyrra" text (15px, 700, white)
- Status dot: green-dot with box-shadow glow, "actif" mono label
- Nav items: 13px, white for active (with 0.06 bg), 0.3 opacity for inactive
- Pipeline section: mono labels for each engine (fingerprint, llm gateway, gmail sync) with green dots
- User card: square avatar + name + mono email

### Classification Tags

Square badges: `padding: 2px 7px`, tag bg color, tag text color, 9px DM Sans 600, uppercase.

Labels with bar indicator (for landing page): `border: 1px solid var(--line)`, 3px colored bar + mono label.

## Page Structures

### Landing Page

Sections in order:

1. **Navbar** — Logo left, nav links center, "Connexion" + CTA button right. Border-bottom only.
2. **Hero (split)** — Left: mono label with green dot ("Classification IA en temps réel"), serif display title, serif italic subtitle, body text, 2 buttons, mono footnote. Right: surface bg with dot-grid, email preview mockup with 3 classified emails + pipeline status bar.
3. **Metrics strip** — 3 columns separated by borders. Large numbers (40px) + mono labels + mono sublabels. Metrics: "312 distractions/semaine", "45min temps récupéré", "<2sec latence classification".
4. **How it works** — Surface bg with dot-grid. Mono section label "Architecture du pipeline". 3 columns separated by borders. Each: mono number (01/02/03), DM Sans heading, body text, mono technical details (scope, engine specs, label preview).
5. **Sovereignty (navy)** — Navy bg with noise texture. Left: serif heading + body text. Right: 4 status items (green dot + mono label in bordered boxes).
6. **Testimonial** — Left: serif italic quote with 2px left border. Right: data widget (bordered box with mono label, 3 metrics with progress bars).
7. **CTA final (navy)** — Navy bg with noise. Left: serif heading + mono footnote. Right: inverse button.
8. **Footer** — Minimal. Mono text. Left: copyright + links. Right: system status with green dot.

### Dashboard

- **Sidebar** (230px) — Navy bg + noise. Logo, nav, pipeline status, user card.
- **Main content** — Surface bg. Header: greeting (DM Sans 22px) + mono date/status. Status badge (bordered, green dot + "protégé"). Stat block (3 cells). Email list (bordered container, rows with 3px bars).

### Login Page

- **Left panel (50%)** — Navy bg. Logo top. Serif italic testimonial quote center. Mono footer ("souveraineté numérique" + system status).
- **Right panel (50%)** — White bg. DM Sans "Bienvenue" heading. Google OAuth button (bordered, square). Divider. Disabled email/password fields (surface bg, 0.5 opacity). "Bientôt disponible" label.

## Animations (Minimal)

- **Status dot pulse** — 3s cycle, opacity 0.4-1.0. Only persistent animation.
- **Page transitions** — Fade in 200ms on route change.
- **Email list** — Stagger entrance, 50ms delay per row, fade + translateY(8px).
- **Stat numbers** — CountUp animation on first load (0 → value, 800ms).
- **Hover states** — Opacity 0.7 on email rows. Border color darken on buttons.
- **No scroll animations** — No parallax, no scroll-trigger reveals on landing (optional: add later if needed).

## Responsive Strategy

| Breakpoint | Changes |
|------------|---------|
| < 768px (mobile) | Sidebar hidden (hamburger toggle). Hero stacks vertically (text over preview). Stats stack 1 column. Email rows simplified (no subtitle). Landing hero: single column. |
| 768–1024px (tablet) | Sidebar collapsible. 2-column stats. Hero preview hidden. |
| > 1024px (desktop) | Full layout as designed. |

## Files to Create/Modify

### New
- `apps/web/app/globals.css` — Complete rewrite with new tokens
- Fonts: Add Instrument Serif + IBM Plex Mono to layout (Google Fonts or next/font)

### Modify
- `apps/web/app/(marketing)/page.tsx` — New section structure
- `apps/web/app/(marketing)/layout.tsx` — Dark class removal (marketing goes white too, navy only on specific sections)
- `apps/web/components/marketing/*` — Rewrite all section components
- `apps/web/components/layout/Sidebar.tsx` — Navy + noise + pipeline status
- `apps/web/app/(dashboard)/dashboard/page.tsx` — New stat block + email list
- `apps/web/app/(dashboard)/emails/page.tsx` — New email row design
- `apps/web/app/(dashboard)/labels/page.tsx` — Update classification display
- `apps/web/app/(auth)/login/page.tsx` — Navy left panel + white right
- `apps/web/components/ui/badge.tsx` — Square tags with new colors

### Remove
- All glassmorphism utilities from globals.css
- All gradient utilities (bg-brand-gradient, text-gradient, etc.)
- All shadow utilities (shadow-glow, shadow-accent-*, etc.)
- All orbit/gradient-shift keyframes
- HeroGradient component (replaced by dot-grid)
- GlowBorder component
- NoiseOverlay component (replaced by CSS-only noise)

## Visual Reference

Mockups saved in `.superpowers/brainstorm/8326-1774976285/content/`:
- `design-system-tech.html` — Final approved design system with full landing page and dashboard mockups
- `design-system-kyrra.html` — Earlier iteration (v1, less tech)
- `direction-kyrra-square.html` — Square direction exploration
