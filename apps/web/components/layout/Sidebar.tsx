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

        <nav className="flex-1 px-3">
          <SidebarSection label="MENU">
            <SidebarItem href="/dashboard" icon={LayoutDashboard} label="Tableau de bord" onClick={onMobileClose} />
            <SidebarItem href="/emails" icon={Mail} label="Mes emails" onClick={onMobileClose} />
            <SidebarItem href="/labels" icon={Tag} label="Libellés" onClick={onMobileClose} />
            <SidebarItem href="/settings" icon={Settings} label="Paramètres" onClick={onMobileClose} />
          </SidebarSection>
        </nav>

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
