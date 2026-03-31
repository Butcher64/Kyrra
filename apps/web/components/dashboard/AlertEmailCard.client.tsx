'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { ReclassifyButton } from './ReclassifyButton.client'
import { transitions } from '@/lib/motion'

/**
 * Alert email card with reclassification action
 * Combines ClassificationCard display + ReclassifyButton (MI-1)
 * On reclassification: card glows green briefly then fades (MI-1 T+800ms)
 */

interface AlertEmailCardProps {
  summary: string
  gmailMessageId: string
  confidenceScore?: number
  senderEmail?: string
}

export function AlertEmailCard({ summary, gmailMessageId, confidenceScore, senderEmail }: AlertEmailCardProps) {
  const [reclassified, setReclassified] = useState(false)
  const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${gmailMessageId}`

  return (
    <AnimatePresence>
      {!reclassified ? (
        <motion.div
          layout
          exit={{ opacity: 0, height: 0 }}
          transition={transitions.normal}
          className="border-b border-(--border)"
        >
          <a
            href={gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            role="article"
            aria-label={`Email: ${summary}`}
            className="flex items-center py-3.5 gap-3 no-underline transition-opacity duration-150 hover:opacity-70"
          >
            <Badge variant="a-voir" className="shrink-0">
              À voir
            </Badge>
            <span className="text-[13px] font-mono text-(--card-foreground) flex-1 truncate">
              {summary}
            </span>
            {confidenceScore !== undefined && confidenceScore < 0.75 && (
              <span className="text-[11px] font-mono text-(--muted-foreground) shrink-0">
                {Math.round(confidenceScore * 100)}%
              </span>
            )}
            <span className="text-(--border) text-[13px] shrink-0">&rarr;</span>
          </a>
          <ReclassifyButton
            gmailMessageId={gmailMessageId}
            senderEmail={senderEmail}
            onReclassified={() => {
              // MI-1 T+800ms: email line glow then fade
              setTimeout(() => setReclassified(true), 800)
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
