# Dashboard Implementation Plan — Navy Serein v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the 4 dashboard pages as designed in the visual mockups, with sidebar navigation reduced to 3 items + user profile access to settings.

**Architecture:** Rewrite all dashboard pages and components to match the approved mockups. Sidebar: 3 nav items (Tableau de bord, Mes emails, Libellés) + user profile click → /settings. Dashboard: 2-column layout (overview + à voir). Emails: Gmail-style list with tabs/search/pagination. Labels: 3 sections (auto + synced + custom rules). Settings: accessible from user card, includes exposure mode, recap, account, password, privacy, danger zone.

**Design System:** Navy #0c1a32, DM Sans/IBM Plex Mono, zero radius, 3px classification bars, mono metadata.

---

## Epic A — Sidebar + Layout (foundation)

### Task A1: Update Sidebar — 3 nav items + user profile link to /settings
- Remove Paramètres from nav
- Keep: Tableau de bord, Mes emails, Libellés
- User card at bottom: clicking navigates to /settings
- Pipeline status section stays

### Task A2: Update DashboardShell — proper spacing and layout

## Epic B — Tableau de bord page

### Task B1: Rewrite /dashboard with 2-column layout
- Header: greeting + mono date + inline stats (bloqués, gagnées, protégé badge)
- Left column: overview card (weekly stats + bar chart)
- Right column: "À voir" emails list with blue bars
- Bottom: "Récemment filtrés" in 2-column grid (filtrés left, bloqués right)

## Epic C — Mes emails page

### Task C1: Rewrite /emails with Gmail-style list
- Header: title + search bar
- Tabs: Tous / À voir / Filtrés / Bloqués with counts
- Email rows: 3px bar + sender + email + subject + excerpt + tag + confidence + time
- Opacity hierarchy: 1.0 / 0.55 / 0.3
- Pagination at bottom

## Epic D — Libellés page

### Task D1: Rewrite /labels with 3 sections
- Section 1: Labels Kyrra auto (Filtré/Bloqué with stats)
- Section 2: Labels Gmail synchronisés (colored dots, email counts, sync button)
- Section 3: Règles personnalisées (+ Nouvelle règle button, condition → label, edit/delete)

## Epic E — Paramètres page

### Task E1: Rewrite /settings accessed from user profile
- Mode d'exposition (3 square pills: Strict/Normal/Permissif)
- Kyrra Recap (square toggle)
- Account info (email, plan, Gmail status)
- Password / security section
- Privacy / data management
- Danger zone (delete account)
