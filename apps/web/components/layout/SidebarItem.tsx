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
  onClick?: () => void
}

export function SidebarItem({ icon: Icon, href, label, badge, onClick }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors duration-150 no-underline',
        isActive
          ? 'bg-white/[0.06] text-white'
          : 'text-white/30 hover:bg-white/[0.06] hover:text-white/50',
      )}
    >
      <Icon size={16} strokeWidth={1.5} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-white/40">
          {badge}
        </span>
      )}
    </Link>
  )
}
