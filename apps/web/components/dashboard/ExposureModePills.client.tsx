'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { transitions } from '@/lib/motion'

type Mode = 'strict' | 'normal' | 'permissive'

const MODES: { id: Mode; label: string; description: string }[] = [
  { id: 'strict', label: 'Strict', description: 'Contacts connus uniquement' },
  { id: 'normal', label: 'Normal', description: 'Filtrage intelligent, équilibré' },
  { id: 'permissive', label: 'Permissif', description: 'Plus d\'opportunités visibles' },
]

interface ExposureModePillsProps {
  currentMode: Mode
  onModeChange?: (mode: Mode) => void
}

export function ExposureModePills({ currentMode, onModeChange }: ExposureModePillsProps) {
  const [selected, setSelected] = useState(currentMode)
  const [showDescription, setShowDescription] = useState(false)

  const handleSelect = (mode: Mode) => {
    setSelected(mode)
    setShowDescription(true)
    onModeChange?.(mode)
    setTimeout(() => setShowDescription(false), 3000)
  }

  const selectedMode = MODES.find((m) => m.id === selected)!

  return (
    <div role="radiogroup" aria-label="Mode d'exposition">
      <div className="flex gap-1 bg-(--muted) rounded-full p-[3px]">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            role="radio"
            aria-checked={selected === mode.id}
            onClick={() => handleSelect(mode.id)}
            className={cn(
              'relative flex-1 py-2 px-3 border-none rounded-full text-xs font-medium cursor-pointer transition-colors duration-150',
              selected === mode.id
                ? 'text-(--foreground)'
                : 'text-(--muted-foreground) bg-transparent',
            )}
          >
            {selected === mode.id && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 bg-(--card) rounded-full shadow-[0_1px_3px_oklch(0_0_0/0.08)]"
                transition={transitions.spring}
              />
            )}
            <span className="relative z-10">{mode.label}</span>
          </button>
        ))}
      </div>
      {showDescription && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={transitions.fast}
          className="text-[11px] text-(--muted-foreground) text-center mt-2"
        >
          {selectedMode.description}
        </motion.p>
      )}
    </div>
  )
}
