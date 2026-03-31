'use client'

import { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  Mail,
  Tag,
  Settings,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  user: { email: string; name?: string }
  pipelineStatus: 'active' | 'paused' | 'degraded'
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/emails', icon: Mail, label: 'Mes emails' },
  { href: '/labels', icon: Tag, label: 'Libellés' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
]

const pipelineRows = [
  { label: 'fingerprint', status: 'ok' },
  { label: 'llm gateway', status: 'ok' },
  { label: 'gmail sync', status: 'ok' },
]

export function Sidebar({ user, pipelineStatus, mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userInitial = (user.name ?? user.email)[0]?.toUpperCase() ?? 'K'
  const displayName = user.name ?? user.email.split('@')[0]

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[260px] flex flex-col z-50 transition-transform duration-200',
          'bg-[#0c1a32] bg-noise',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 pt-6 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-[22px] h-[22px] bg-white/[0.08] flex items-center justify-center">
                <div className="w-[14px] h-[14px] border border-white/[0.12]" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tighter">
                Kyrra
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2.5 pl-[35px]">
              <span className="w-[5px] h-[5px] bg-[#2dd881] rounded-full shadow-[0_0_6px_#2dd881]" />
              <span className="font-mono text-[9px] text-white/30 tracking-wider">
                actif
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3">
            <div className="px-3 mb-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/15">
                Navigation
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors duration-150 no-underline',
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/30 hover:bg-white/[0.06] hover:text-white/50',
                    )}
                  >
                    <item.icon size={16} strokeWidth={1.5} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Pipeline status */}
          <div className="px-3 border-t border-white/[0.06]">
            <div className="px-3 pt-4 pb-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/15">
                Pipeline
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-3 pb-4">
              {pipelineRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="w-[3px] h-[3px] bg-[#2dd881] rounded-full" />
                  <span className="font-mono text-[10px] text-white/25">{row.label}</span>
                  <span className="font-mono text-[9px] text-white/15 ml-auto">{row.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User section */}
          <div className="px-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 px-3 py-4">
              <div className="w-[28px] h-[28px] bg-white/[0.06] flex items-center justify-center text-[11px] font-medium text-white/50">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/70 truncate">{displayName}</p>
                <p className="font-mono text-[9px] text-white/25 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-white/25 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Déconnexion"
              >
                <LogOut size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
