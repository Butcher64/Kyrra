'use client'

import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

interface TopBarProps {
  onMenuClick: () => void
  pipelineStatus: 'active' | 'paused' | 'degraded'
}

export function TopBar({ onMenuClick, pipelineStatus }: TopBarProps) {
  const pipelineDot = pipelineStatus === 'active'
    ? 'bg-[var(--color-protected)]'
    : 'bg-[var(--color-attention)]'

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] bg-transparent border-none cursor-pointer"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      <Logo variant="dark" />

      <span className={cn('size-2 rounded-full', pipelineDot)} />
    </header>
  )
}
