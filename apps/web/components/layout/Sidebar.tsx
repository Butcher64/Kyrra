'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, Mail, Settings, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { SidebarSection } from './SidebarSection'
import { SidebarItem } from './SidebarItem'

interface SidebarProps {
  user: { email: string; name?: string }
  pipelineStatus: 'active' | 'paused' | 'degraded'
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const STORAGE_KEY = 'kyrra-sidebar-collapsed'

export function Sidebar({ user, pipelineStatus, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  const pipelineDot = pipelineStatus === 'active'
    ? 'bg-[var(--color-protected)]'
    : 'bg-[var(--color-attention)]'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && <Logo variant="white" />}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'rounded-md p-1.5 text-[var(--sidebar-fg)] transition-colors hover:bg-[var(--sidebar-hover)] bg-transparent border-none cursor-pointer',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarSection label={collapsed ? '' : 'Aperçu'}>
          <SidebarItem icon={LayoutDashboard} href="/dashboard" label="Tableau de bord" collapsed={collapsed} />
          <SidebarItem icon={Mail} href="/emails" label="Emails" collapsed={collapsed} />
        </SidebarSection>

        <SidebarSection label={collapsed ? '' : 'Configuration'}>
          <SidebarItem icon={Settings} href="/settings" label="Paramètres" collapsed={collapsed} />
          <SidebarItem icon={Shield} href="/whitelist" label="Whitelist" collapsed={collapsed} />
        </SidebarSection>
      </div>

      {/* Footer — user info */}
      <div className="border-t border-[var(--sidebar-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 shrink-0 rounded-full', pipelineDot)} />
          {!collapsed && (
            <span className="truncate text-[11px] text-[var(--sidebar-fg)]/70">
              {user.name ?? user.email}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-[width] duration-200',
          collapsed ? 'w-[60px]' : 'w-[260px]',
        )}
      >
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
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[var(--sidebar-bg)] lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
