'use client'

import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { transitions } from '@/lib/motion'

type Status = 'protected' | 'alert' | 'degraded' | 'paused'

interface ProtectedStatusBadgeProps {
  status: Status
  alertCount?: number
}

const statusConfig: Record<Status, { dotClass: string; text: string }> = {
  protected: { dotClass: 'bg-[var(--color-protected)] animate-[pulse-dot_3s_ease-in-out_infinite]', text: 'Votre boîte est protégée' },
  alert: { dotClass: 'bg-[var(--color-attention)]', text: '' },
  degraded: { dotClass: 'bg-[var(--color-attention)]', text: 'Mode simplifié actif' },
  paused: { dotClass: 'bg-(--muted-foreground)', text: 'Classification en pause' },
}

export function ProtectedStatusBadge({ status, alertCount }: ProtectedStatusBadgeProps) {
  const config = statusConfig[status]
  const text = status === 'alert'
    ? `${alertCount} email${(alertCount ?? 0) > 1 ? 's' : ''} nécessite${(alertCount ?? 0) > 1 ? 'nt' : ''} votre attention`
    : config.text

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transitions.fast}
        className="flex items-center gap-2 text-[13px] text-(--muted-foreground)"
      >
        <span
          className={cn('size-[7px] rounded-full shrink-0', config.dotClass)}
        />
        {text}
      </motion.div>
    </AnimatePresence>
  )
}
