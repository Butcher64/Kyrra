# Dashboard Refonte — Filtrage Intelligent (pas sécurité)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le dashboard d'un outil de cybersécurité en un dashboard de filtrage email élégant, style Dashlane/Linear — épuré, minimaliste, centré sur la productivité.

**Architecture:** Réécriture du dashboard page.tsx, sidebar, et StatCards. Nouveau wording centré filtrage/tri/productivité. Nouvelle section "Derniers emails triés" avec résumés. Nouvelle page de gestion des libellés Gmail. Suppression de tout vocabulaire sécurité/menaces/IA.

**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind CSS v4, OKLch design tokens, Motion v12, Lucide icons.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `apps/web/app/(dashboard)/dashboard/page.tsx` | Main dashboard — stats + recent emails |
| Rewrite | `apps/web/components/layout/Sidebar.tsx` | Simplified nav — Dashboard, Emails, Libellés, Paramètres |
| Rewrite | `apps/web/components/dashboard/StatCard.tsx` | Cleaner stat cards — no accent colors, monochrome |
| Create | `apps/web/app/(dashboard)/labels/page.tsx` | Label management page |
| Create | `apps/web/app/(dashboard)/actions/labels.ts` | Server actions for label CRUD |
| Modify | `apps/web/app/(dashboard)/layout.tsx` | Re-enable DashboardShell with ErrorBoundary |
| Modify | `apps/web/components/layout/DashboardShell.tsx` | Remove editorial-grid, cleaner main area |
| Modify | `apps/web/app/(dashboard)/emails/page.tsx` | Update wording |
| Modify | `apps/web/app/globals.css` | Remove unused security colors if any |

---

### Task 1: Rewrite Sidebar — Clean navigation, no security language

**Files:**
- Modify: `apps/web/components/layout/Sidebar.tsx`

- [ ] **Step 1: Rewrite Sidebar with simplified navigation**

Replace the entire Sidebar component. New structure:
- Logo: "Kyrra." (not "Kyrra Enterprise")
- Status badge: "Actif" (green dot) — no "Filtrage" prefix
- Nav section "MENU" with 4 items:
  - Tableau de bord → `/dashboard` (LayoutDashboard icon)
  - Mes emails → `/emails` (Mail icon)
  - Libellés → `/labels` (Tag icon)
  - Paramètres → `/settings` (Settings icon)
- Remove: "Nouveau Filtre" button, "Analyses", "Archives", "Support" link
- User card at bottom: avatar circle + email + logout

```tsx
'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarSection } from './SidebarSection'
import { SidebarItem } from './SidebarItem'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  Mail,
  Tag,
  Settings,
  LogOut,
} from 'lucide-react'

interface SidebarProps {
  user: { email: string; name?: string }
  pipelineStatus: 'active' | 'paused' | 'degraded'
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ user, pipelineStatus, mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusColor = pipelineStatus === 'active'
    ? 'bg-[var(--color-protected)]'
    : 'bg-[var(--color-attention)]'

  const statusText = pipelineStatus === 'active' ? 'Actif' : 'Pausé'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[260px] border-r border-[var(--sidebar-border)] flex flex-col py-6 z-50 transition-transform duration-200',
          'bg-[var(--sidebar-bg)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo + status */}
        <div className="px-6 mb-8">
          <h1 className="text-[17px] font-bold text-slate-200 font-headline tracking-tight">
            Kyrra<span className="text-[var(--color-accent-cyan)]">.</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('w-1.5 h-1.5 rounded-full', statusColor)} />
            <span className={cn(
              'text-[10px] font-label tracking-[0.05em]',
              pipelineStatus === 'active' ? 'text-[var(--color-protected)]' : 'text-[var(--color-attention)]',
            )}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <SidebarSection label="MENU">
            <SidebarItem href="/dashboard" icon={LayoutDashboard} label="Tableau de bord" onClick={onMobileClose} />
            <SidebarItem href="/emails" icon={Mail} label="Mes emails" onClick={onMobileClose} />
            <SidebarItem href="/labels" icon={Tag} label="Libellés" onClick={onMobileClose} />
            <SidebarItem href="/settings" icon={Settings} label="Paramètres" onClick={onMobileClose} />
          </SidebarSection>
        </nav>

        {/* User card */}
        <div className="px-4 pt-4 border-t border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-start)]/20 flex items-center justify-center text-xs font-semibold text-[var(--color-accent-start)]">
              {(user.name ?? user.email)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 truncate">{user.name ?? user.email.split('@')[0]}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-[var(--sidebar-hover)] transition-colors bg-transparent border-none cursor-pointer"
              aria-label="Déconnexion"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @kyrra/web check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/layout/Sidebar.tsx
git commit -m "refactor(sidebar): simplify nav — Dashboard, Emails, Libellés, Paramètres"
```

---

### Task 2: Rewrite Dashboard page — Filtrage, pas sécurité

**Files:**
- Rewrite: `apps/web/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite dashboard with new wording and layout**

New structure:
1. Header: "Bonjour, {name}" + date + status dot
2. Stats row (3 cards): Emails triés aujourd'hui | Prospection bloquée | Temps gagné
3. Section "Derniers emails triés" — list of recent classifications with:
   - Badge (À voir / Filtré / Bloqué) with semantic colors
   - Summary text (1 line)
   - Time (relative)
   - Link to Gmail
4. No more: "Alertes de Sécurité", "Surveillance", "Mises à jour IA", "Confiance IA", "Menaces"

```tsx
import { Mail, Clock, Filter, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const classificationStyles = {
  A_VOIR: { label: 'À voir', bg: 'bg-[var(--color-a-voir)]/10', text: 'text-[var(--color-a-voir)]', border: 'border-[var(--color-a-voir)]/20' },
  FILTRE: { label: 'Filtré', bg: 'bg-[var(--color-filtre)]/10', text: 'text-[var(--color-filtre)]', border: 'border-[var(--color-filtre)]/20' },
  BLOQUE: { label: 'Bloqué', bg: 'bg-[var(--color-bloque)]/10', text: 'text-[var(--color-bloque)]', border: 'border-[var(--color-bloque)]/20' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)}j`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-12 text-center text-slate-400">Session expirée. <a href="/login" className="text-[var(--color-accent-cyan)] underline">Reconnexion</a></div>
  }

  let filteredToday = 0
  let blockedToday = 0
  let recentEmails: Array<{ gmail_message_id: string; classification_result: string; summary: string | null; created_at: string }> = []

  try {
    const today = new Date().toISOString().split('T')[0]

    const [countRes, blockedRes, recentRes] = await Promise.all([
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('classification_result', 'BLOQUE').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('gmail_message_id, classification_result, summary, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    filteredToday = countRes.count ?? 0
    blockedToday = blockedRes.count ?? 0
    recentEmails = (recentRes.data ?? []) as typeof recentEmails

    console.log('[DASHBOARD] Data loaded', { filteredToday, blockedToday, recentCount: recentEmails.length })
  } catch (error) {
    console.error('[DASHBOARD] Failed to load data:', error)
  }

  const timeSaved = Math.round(filteredToday * 0.75) // 45s per email
  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'vous'

  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-headline font-semibold text-slate-100 tracking-tight">
          Bonjour, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Voici le résumé de votre boîte mail aujourd&apos;hui.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--color-accent-cyan)]/10">
              <Filter size={18} className="text-[var(--color-accent-cyan)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-label text-slate-500 uppercase tracking-wider">Triés aujourd&apos;hui</span>
          </div>
          <p className="text-3xl font-headline font-bold text-slate-100">{filteredToday}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--color-bloque)]/10">
              <Mail size={18} className="text-[var(--color-bloque)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-label text-slate-500 uppercase tracking-wider">Prospection bloquée</span>
          </div>
          <p className="text-3xl font-headline font-bold text-slate-100">{blockedToday}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--color-protected)]/10">
              <Clock size={18} className="text-[var(--color-protected)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-label text-slate-500 uppercase tracking-wider">Temps gagné</span>
          </div>
          <p className="text-3xl font-headline font-bold text-slate-100">{timeSaved} <span className="text-base font-normal text-slate-500">min</span></p>
        </div>
      </div>

      {/* Recent emails */}
      <div>
        <h2 className="text-sm font-headline font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Derniers emails triés
        </h2>

        {recentEmails.length > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)]">
            {recentEmails.map((email) => {
              const style = classificationStyles[email.classification_result as keyof typeof classificationStyles] ?? classificationStyles.FILTRE
              const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`

              return (
                <div key={email.gmail_message_id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-label font-medium uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                    {style.label}
                  </span>
                  <p className="flex-1 text-sm text-slate-300 truncate min-w-0">
                    {email.summary ?? 'Email classifié'}
                  </p>
                  <span className="shrink-0 text-xs text-slate-500 font-label">
                    {timeAgo(email.created_at)}
                  </span>
                  <a
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-md text-slate-600 group-hover:text-[var(--color-accent-cyan)] transition-colors no-underline"
                  >
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-16 text-center">
            <Mail size={28} strokeWidth={1} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucun email trié pour le moment.</p>
            <p className="text-xs text-slate-600 mt-1">Kyrra trie vos emails en arrière-plan.</p>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @kyrra/web check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/page.tsx
git commit -m "refactor(dashboard): rewrite — filtrage/productivité, plus de sécurité"
```

---

### Task 3: Clean DashboardShell — Remove editorial-grid

**Files:**
- Modify: `apps/web/components/layout/DashboardShell.tsx`

- [ ] **Step 1: Simplify main area styling**

Remove `editorial-grid` class from main element (the dot pattern looks too "techy"). Keep clean dark background.

Change line 31 from:
```tsx
<main className="flex-1 overflow-y-auto bg-[var(--background)] editorial-grid pb-24">
```
to:
```tsx
<main className="flex-1 overflow-y-auto bg-[var(--background)] pb-24">
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/layout/DashboardShell.tsx
git commit -m "style(shell): remove editorial-grid pattern from dashboard"
```

---

### Task 4: Update Emails page wording

**Files:**
- Modify: `apps/web/app/(dashboard)/emails/page.tsx`

- [ ] **Step 1: Update wording**

Change:
- Title: "Emails" → "Mes emails"
- Subtitle: "Les 50 dernières classifications" → "Historique de tri"
- Empty state: "Aucune classification pour le moment." → "Aucun email trié pour le moment."
- "Kyrra analyse vos emails en arrière-plan." → "Kyrra trie vos emails en arrière-plan."

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/emails/page.tsx
git commit -m "copy(emails): update wording — tri, pas classification"
```

---

### Task 5: Create Labels management page

**Files:**
- Create: `apps/web/app/(dashboard)/labels/page.tsx`
- Create: `apps/web/app/(dashboard)/actions/labels.ts`

- [ ] **Step 1: Create labels server action**

File: `apps/web/app/(dashboard)/actions/labels.ts`

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

// Kyrra classification labels — mapped to Gmail labels
const KYRRA_LABELS = [
  { key: 'A_VOIR', name: 'Kyrra/À voir', description: 'Emails à examiner — potentiellement pertinents' },
  { key: 'FILTRE', name: 'Kyrra/Filtré', description: 'Prospection filtrée — pas urgente' },
  { key: 'BLOQUE', name: 'Kyrra/Bloqué', description: 'Spam et prospection indésirable' },
]

export async function getLabels(): Promise<ActionResult<typeof KYRRA_LABELS>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // For MVP, return the fixed Kyrra labels
  // Future: allow custom labels
  return { data: KYRRA_LABELS, error: null }
}
```

- [ ] **Step 2: Create labels page**

File: `apps/web/app/(dashboard)/labels/page.tsx`

```tsx
import { Tag } from 'lucide-react'

const labels = [
  { key: 'A_VOIR', name: 'À voir', gmail: 'Kyrra/À voir', description: 'Emails à examiner — potentiellement pertinents', color: 'var(--color-a-voir)' },
  { key: 'FILTRE', name: 'Filtré', gmail: 'Kyrra/Filtré', description: 'Prospection filtrée — pas urgente', color: 'var(--color-filtre)' },
  { key: 'BLOQUE', name: 'Bloqué', gmail: 'Kyrra/Bloqué', description: 'Spam et prospection indésirable', color: 'var(--color-bloque)' },
]

export default function LabelsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-headline font-semibold text-slate-100 tracking-tight">
          Libellés
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Les libellés Kyrra sont automatiquement créés dans votre boîte Gmail.
        </p>
      </div>

      <div className="space-y-3">
        {labels.map((label) => (
          <div
            key={label.key}
            className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4"
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `color-mix(in oklch, ${label.color} 15%, transparent)` }}
            >
              <Tag size={18} style={{ color: label.color }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{label.name}</span>
                <span className="text-[10px] font-label text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                  {label.gmail}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{label.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-6 text-center">
        <p className="text-sm text-slate-500">Les libellés personnalisés arrivent bientôt.</p>
        <p className="text-xs text-slate-600 mt-1">Vous pourrez créer vos propres catégories de tri.</p>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm --filter @kyrra/web check-types`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/labels/page.tsx apps/web/app/\(dashboard\)/actions/labels.ts
git commit -m "feat(labels): add label management page with Gmail label mapping"
```

---

### Task 6: Re-enable DashboardShell in layout

**Files:**
- Modify: `apps/web/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Restore layout with ErrorBoundary (already done)**

The layout currently has DashboardShell with ErrorBoundary. Verify it works with the new sidebar. No code change needed — the current layout.tsx is already correct.

- [ ] **Step 2: Verify full flow**

Run: `pnpm --filter @kyrra/web check-types`
Then: `pnpm --filter @kyrra/web build` to verify production build.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): complete refonte — filtrage, libellés, nouveau wording"
```

---

### Task 7: Deploy and verify

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Deploy to Railway**

```bash
railway service link web && railway up --service web --detach
```

- [ ] **Step 3: Verify on production**

Wait 2 minutes for build, then check:
- https://web-production-87a24.up.railway.app/dashboard — new layout
- https://web-production-87a24.up.railway.app/labels — label page
- https://web-production-87a24.up.railway.app/emails — updated wording

---

## Wording Changes Summary

| Avant (sécurité) | Après (filtrage) |
|---|---|
| "Tableau de bord" + date | "Bonjour, {nom}" + résumé |
| "Alertes de Sécurité" | "Derniers emails triés" |
| "Menaces filtrées" | "Prospection bloquée" |
| "Score de confiance" | Supprimé |
| "Mode de filtrage IA" | Supprimé |
| "Kyrra surveille votre boîte" | Supprimé |
| "Aucune activité suspecte" | "Aucun email trié pour le moment" |
| "Mises à jour IA" | Supprimé |
| "Confiance IA" | Supprimé |
| "Journal des logs" | Supprimé |
| "Kyrra Enterprise" | "Kyrra." |
| "Filtrage Actif" | "Actif" (dot) |
| "Filtres IA" / "Analyses" / "Archives" | "Mes emails" / "Libellés" |
| "Nouveau Filtre" | Supprimé |
