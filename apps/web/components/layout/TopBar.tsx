'use client'

import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
  pipelineStatus: 'active' | 'paused' | 'degraded'
}

export function TopBar({ onMenuClick, pipelineStatus }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e4e6ed] bg-[#f5f6f9] px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 text-[#0c1a32] transition-colors hover:bg-[#e4e6ed] bg-transparent border-none cursor-pointer"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-[18px] h-[18px] bg-[#0c1a32] flex items-center justify-center">
          <div className="w-[10px] h-[10px] border border-white/20" />
        </div>
        <span className="text-[13px] font-bold text-[#0c1a32] tracking-tighter">
          Kyrra
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={cn(
          'w-[5px] h-[5px] rounded-full',
          pipelineStatus === 'active' ? 'bg-[#2dd881] shadow-[0_0_6px_#2dd881]' : 'bg-[#d97706]',
        )} />
        <span className="font-mono text-[9px] text-[#8b90a0]">
          {pipelineStatus === 'active' ? 'actif' : 'pausé'}
        </span>
      </div>
    </header>
  )
}
