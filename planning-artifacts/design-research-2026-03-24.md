# Kyrra Design Research — Consolidated Report

> Date: 2026-03-24
> Team: Maya (Motion), Sally (UX Audit), Emma (UI Libraries), Winston (Architecture), Lucas (SEO), Murat (QA), John (PM Competitive)

---

## DECISION: Tech Stack Animation

### Install (32 KB supplementaires):
```bash
pnpm add gsap @gsap/react lenis --filter @kyrra/web
```

### Copy-paste (0 KB):
- Aceternity UI: Aurora Background, Text Generate Effect, Card Spotlight, Bento Grid
- Magic UI: Shimmer Button, AnimatedList, Border Beam, Marquee, Particles

### Keep: Motion v12 (deja installe)

### Reject: Three.js (225KB), Spline (548KB), Rive (complexe)

---

## DECISION: Design Direction

**Dark mode par defaut** (ref: Linear)
- Background: #0A0A0F (near-black bleu)
- Cards: #111118
- Text: #E8E8ED (off-white) / #8B8B9E (secondary)
- Accent: #3B82F6 → #6366F1 gradient (bleu → violet)
- Highlight: #06B6D4 (cyan)
- Borders: rgba(255,255,255,0.08)

**Fonts:** Inter Display (headlines 700-800) + Inter (body 400-500) + JetBrains Mono (stats/code)

---

## DECISION: Landing Page Structure (12 sections)

1. **Navbar** — Glassmorphism, transition au scroll
2. **Hero** — Headline courte + 2 CTAs + gradient anime + email sort animation
3. **Social Proof** — Logos/stats beta
4. **Le Probleme** — 3 pain points en cards
5. **Comment ca marche** — 3 steps animes au scroll
6. **Features** — Tabs interactifs (classification, modes, dashboard, recap)
7. **Securite** — Trust signals, badges compliance, fond sombre
8. **Stats** — 3 gros chiffres counter-up
9. **Temoignages** — Carousel quotes
10. **Pricing** — 3 colonnes, toggle annuel/mensuel
11. **CTA Final** — Gradient background, headline impactante
12. **Footer** — 4 colonnes

---

## DECISION: 5 Wow Moments

1. **Hero gradient anime** (Stripe-style WebGL ou CSS)
2. **Email sort animation** (enveloppes qui se classent en 3 labels)
3. **Stats counter-up** (chiffres qui roulent de 0 a valeur)
4. **Feature tabs morph** (transition fluide entre onglets)
5. **Navbar glassmorphism** (transparent → blur au scroll)

---

## DECISION: 10 Techniques Animation

1. GSAP SplitText — hero text reveal caractere par caractere
2. Lenis — smooth scroll global
3. Mesh gradient anime — CSS/WebGL style Stripe
4. Border glow conique — "The Linear Look"
5. Bento grid — features asymetriques
6. Noise/grain SVG — profondeur visuelle
7. Magnetic cursor — spring physics CTAs
8. Parallax subtil — GSAP ScrollTrigger 20-40px
9. Number counters — stats animees
10. View Transitions — transitions pages

---

## DECISION: Architecture 4 Layers

```
Layer 0: CSS pur (hover, glow, grain, gradients)
Layer 1: Motion v12 (fade, stagger, layout — DEJA LA)
Layer 2: GSAP (ScrollTrigger, SplitText — lazy import dynamique)
Layer 3: Lenis (smooth scroll global)
```

### Enforcement Rules:
- ANIM-001: transform + opacity ONLY
- ANIM-002: Animation boundary ('use client')
- ANIM-003: GSAP dynamic import
- ANIM-004: prefers-reduced-motion obligatoire
- ANIM-005: No CLS (dimensions reservees)
- ANIM-006: Lenis une seule fois dans root layout
- ANIM-007: LazyMotion pour landing (4.6kb vs 42kb)
- ANIM-008: Max 3 animation libs

---

## SEO Quick Wins

- P0: og:image dynamique (next/og ImageResponse)
- P0: robots.ts + sitemap.ts
- P0: Schema.org JSON-LD (Organization, SoftwareApplication)
- P1: Section FAQ
- P1: Heading hierarchy fix
- P1: Canonical URL

---

## QA Process

- Playwright toHaveScreenshot() a 4 breakpoints (375, 768, 1024, 1440)
- @axe-core/playwright pour WCAG AA
- data-section attributes sur chaque composant
- prefers-reduced-motion tests
- Performance: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

## Audit Problemes Actuels (Sally)

### Spacing:
- py-24 partout → py-[120px] desktop, py-[80px] mobile
- 4 max-widths differents → 1200px standard
- Cards p-6 → p-8 minimum

### Typography:
- Hero: ajouter letter-spacing -0.03em, line-height 0.95
- Sections h2: 36-52px clamp(), weight 400
- Body: 16px (pas 14px), line-height 1.6, max-width 65ch

### Profondeur:
- Ajouter shadow hierarchy (sm, md, lg, xl)
- Noise/grain overlay SVG
- Border glow effects
- Background differentiation entre sections

### Composants:
- Hero: reduire a 70vh, ajouter element visuel
- Features: passer en bento grid
- Pricing: max-w-1100px, toggle annuel, Pro sureleve
- HowItWorks: ajouter visuels/screenshots
- Footer: 4 colonnes

---

## References Visuelles

| Site | Ce qu'on prend |
|------|---------------|
| **Dashlane** | Structure (13 sections), tabs features, compliance badges, cible B2B securite |
| **Linear** | Esthetique dark mode, Inter Display, minimal color, border glow, spacing |
| **Stripe** | Gradient WebGL hero, stats massifs, skewY diagonales |
| **Vercel** | Gradient text anime, direction-aware nav, Geist fonts |
| **Notion** | Calculateur interactif, video testimonial, stats counter-up |

---

## Narrative Flow

1. HOOK (Hero) — "On connait votre probleme"
2. CREDIBILITE (Social proof) — "D'autres nous font confiance"
3. EMPATHIE (Probleme) — "On comprend ce que vous vivez"
4. SIMPLICITE (How it works) — "C'est facile"
5. PROFONDEUR (Features) — "C'est puissant"
6. CONFIANCE (Securite) — "Vos donnees sont sacrees"
7. PREUVE (Stats + Temoignages) — "Les chiffres parlent"
8. DECISION (Pricing) — "Combien ca coute"
9. ACTION (CTA final) — "Allez, on y va"
