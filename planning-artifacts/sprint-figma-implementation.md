# Sprint : Implementation Pixel-Perfect depuis Figma/Stitch

> Date : 2026-03-24
> Methode : BMAD Sprint
> Reference : Figma `0YaNRnehEYP0YX1SusmmwM` + Stitch Project `15192440069949940729`
> Design HTML : `design-reference/*.html` (Tailwind CSS, transposable directement)

## Design Specs (extraits de Stitch HTML)

### Couleurs
- Background: `#131318` (surface-dim), `#0e0e13` (deep), `#1f1f25` (surface-container)
- Cards: `rgba(255,255,255,0.03)` backdrop-blur (glass-card)
- Text primary: `#e4e1e9` (on-surface)
- Text secondary: `#8c909f` (outline), `#c2c6d6` (on-surface-variant)
- Accent primary: `#adc6ff` (primary-fixed-dim) → `#4cd7f6` (tertiary)
- Accent gradient: `linear-gradient(to right, #adc6ff, #4cd7f6)`
- CTA button: `#005ac2` (inverse-primary)
- Borders: `rgba(255,255,255,0.08)`

### Navbar (Figma)
- `h-[72px] bg-[#131318]/60 backdrop-blur-xl px-10`
- Font headline: Plus Jakarta Sans (extrabold)
- Nav links: `text-[13px] tracking-wide text-slate-400`
- CTA: `text-[12px]` ghost + filled

### Typography (Figma)
- Headline font: Plus Jakarta Sans (extrabold)
- Body font: Inter
- Label font: Space Grotesk
- Hero H1: ~48-56px
- Section H2: ~28-36px

### Grid
- `bg-grid`: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0) / 40px 40px`
- Glass: `rgba(255,255,255,0.03) backdrop-blur(12px) border 1px rgba(255,255,255,0.08)`
- Text gradient: `linear-gradient(to right, #adc6ff, #4cd7f6)`

---

## Stories (5 stories, basees sur les 4 pages Figma)

### Story S1 — Landing Page Pixel-Perfect
- **Reference** : `design-reference/landing-desktop.png` + `landing-desktop.html`
- **Agent** : Amelia (Sonnet) — code, Sally (Opus) — review visuel
- **Scope** : Rewrite TOUS les composants marketing pour matcher le design Figma exactement
- **Details** :
  - Navbar: `bg-[#131318]/60 backdrop-blur-xl h-[72px] px-10`, Plus Jakarta Sans
  - Hero: headline gradient `#adc6ff → #4cd7f6`, badge glass, bg-grid overlay
  - Social Proof: 3 stats ("25+ dirigeants", "99.2% precision", "0 faux positifs")
  - The Problem: "Le cout cache du bruit numerique", 3 cards glass
  - How It Works: "Une integration, trois etapes", numbered steps
  - Features: "Le filtrage semantique nouvelle generation", bullets + visual mock
  - Security: "La securite au coeur de notre architecture", 3 icons centered
  - Pricing: "Un investissement pour votre esprit", 3 cards (29€, 79€, Sur Mesure)
  - CTA Final: "Redecouvrez le plaisir d'un travail ininterrompu"
  - Footer: 4 colonnes dark
- **Animations a ajouter** (rapports Maya/Winston) :
  - GSAP SplitText sur le hero H1
  - Gradient orbs animes en background hero
  - Lenis smooth scroll
  - ScrollReveal stagger sur les sections
  - CountUp sur les stats
  - Tabs morph AnimatePresence sur features
  - MagneticButton sur CTAs

### Story S2 — Login Page Pixel-Perfect
- **Reference** : `design-reference/login-desktop.png` + `login-desktop.html`
- **Agent** : Amelia (Sonnet)
- **Scope** : Split-screen login selon Figma
- **Details** :
  - Left: gradient bleu-violet, logo Kyrra + shield, testimonial quote, "Protocole Souverain V4.2"
  - Right: dark bg, "Bienvenue", Google sign-in, separator "OU VIA EMAIL", email/password fields, "Connexion" button bleu, "Commencer l'essai" link
  - Footer: Confidentialite | Conditions | Support
- **Note** : On garde seulement Google OAuth (pas email/password pour le MVP), mais on style les champs comme dans le design pour le futur

### Story S3 — Dashboard Pixel-Perfect
- **Reference** : `design-reference/dashboard-desktop.png` + `dashboard-desktop.html`
- **Agent** : Amelia (Sonnet)
- **Scope** : Refonte sidebar + dashboard layout selon Figma
- **Details** :
  - Sidebar: "Kyrra Enterprise" + "Filtrage Actif" badge vert, sections APERCU (Tableau de bord, Filtres IA, Analyses) + CONFIGURATION (Archives, Parametres), "+ Nouveau Filtre" CTA bleu, user "Jean Dupont" + avatar + logout
  - Header: "Tableau de bord" + date + "STATUT: PROTEGE" badge
  - 4 stat cards: "24 En attente", "1,429 Menaces filtrees", "Furtif Mode", "99.9% Score confiance"
  - Table "ALERTES DE SECURITE": expediteur, confiance IA (progress bar), temps, fleche
  - Right panel: "Kyrra surveille votre boite" + shield icon + "Journal des logs" CTA
  - "MISES A JOUR IA" card en bas droite

### Story S4 — Onboarding Pixel-Perfect
- **Reference** : `design-reference/onboarding-desktop.png`
- **Agent** : Amelia (Sonnet)
- **Scope** : Page d'analyse initiale
- **Details** :
  - Full dark background avec grid subtile
  - "Kyrra" logo + "SOUVERAINETE NUMERIQUE" subtitle mono
  - Glass card centree: shield icon, "Kyrra analyse votre boite...", "Securisation de vos flux de donnees en temps reel"
  - Progress bar: "INDEXATION IA" label, 68%, gradient fill
  - 3 compteurs: "1,284 EMAILS ANALYSES", "412 CONTACTS", "86 PROSPECTIONS"
  - Footer: lock icon + "CHIFFREMENT AES-256 ACTIF", avatars + "Rejoint par +2,400 entreprises"
  - Bottom: "Kyrra AI" + legal links

### Story S5 — Visual QA + Build + Commit
- **Agent** : Murat (Sonnet)
- **Scope** : Verification visuelle, build, commit
- **Details** :
  - pnpm build OK
  - Playwright screenshots 4 breakpoints
  - Comparaison visuelle avec les screenshots Figma
  - Commit final

---

## Execution : 2 batches

**Batch 1** (parallele) : S1 (landing) + S2 (login) + S3 (dashboard) + S4 (onboarding)
**Batch 2** (sequentiel) : S5 (QA + build + commit)

## Agents

| Story | Agent | Modele | Fichier reference |
|-------|-------|--------|-------------------|
| S1 | Amelia | Sonnet | landing-desktop.html + .png |
| S2 | Amelia | Sonnet | login-desktop.html + .png |
| S3 | Amelia | Sonnet | dashboard-desktop.html + .png |
| S4 | Amelia | Sonnet | onboarding-desktop.png |
| S5 | Murat | Sonnet | tous les screenshots |
