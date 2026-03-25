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
}

export function SidebarItem({ icon: Icon, href, label, badge }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 no-underline',
        isActive
          ? 'bg-blue-500/10 text-blue-400 border-r-2 border-blue-500'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-r-2 border-transparent',
      )}
    >
      <Icon size={18} strokeWidth={1.5} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
          {badge}
        </span>
      )}
    </Link>
  )
}
