'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  icon: LucideIcon
  href: string
  label: string
  badge?: string | number
  collapsed?: boolean
}

export function SidebarItem({ icon: Icon, href, label, badge, collapsed }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 no-underline',
        isActive
          ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-fg-active)]'
          : 'text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon size={18} strokeWidth={1.5} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span className="ml-auto rounded-full bg-[var(--color-brand-accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-brand-accent)]">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  )
}
