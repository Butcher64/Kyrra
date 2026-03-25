'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarSection } from './SidebarSection'
import { SidebarItem } from './SidebarItem'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  Filter,
  BarChart2,
  Archive,
  Settings,
  Plus,
  HelpCircle,
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

  const avatarLetter = (user.name ?? user.email).charAt(0).toUpperCase()

  const sidebarContent = (
    <div className="flex h-full flex-col py-8">
      {/* Header */}
      <div className="px-8 mb-10">
        <h1 className="text-[17px] font-bold text-slate-200 font-headline tracking-tight">
          Kyrra Enterprise
        </h1>
        <p
          className={cn(
            'text-[10px] font-label tracking-[0.05em] mt-1',
            pipelineStatus === 'active' ? 'text-blue-400' : 'text-amber-400',
          )}
        >
          {pipelineStatus === 'active' ? 'Filtrage Actif' : 'Filtrage Pausé'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <SidebarSection label="APERÇU">
          <SidebarItem icon={LayoutDashboard} href="/dashboard" label="Tableau de bord" />
          <SidebarItem icon={Filter} href="/emails" label="Filtres IA" />
          <SidebarItem icon={BarChart2} href="/analytics" label="Analyses" />
        </SidebarSection>

        <SidebarSection label="CONFIGURATION">
          <SidebarItem icon={Archive} href="/archives" label="Archives" />
          <SidebarItem icon={Settings} href="/settings" label="Paramètres" />
        </SidebarSection>
      </nav>

      {/* Footer actions */}
      <div className="px-4 mt-auto space-y-2">
        <button className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2.5 rounded-lg font-medium text-sm mb-4 flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-colors">
          <Plus size={16} />
          Nouveau Filtre
        </button>

        <div className="border-t border-white/5 pt-4 flex flex-col gap-1">
          <a
            href="mailto:support@kyrra.ai"
            className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-300 transition-colors no-underline rounded-lg hover:bg-white/5"
          >
            <HelpCircle size={18} className="shrink-0" />
            <span className="font-label text-xs">Support</span>
          </a>

          <div className="flex items-center gap-3 px-4 py-3 mt-1 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-300 text-xs font-semibold">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user.name ?? user.email}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-0"
              aria-label="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-screen w-[260px] shrink-0 border-r border-white/5 bg-[#131318]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#131318] lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
