'use client'

import { motion, AnimatePresence } from 'motion/react'

interface DegradedModeBannerProps {
  visible: boolean
}

export function DegradedModeBanner({ visible }: DegradedModeBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden"
        >
          <div className="py-3 px-5 bg-amber-50 border-l-[3px] border-amber-500 text-[13px] font-mono text-[var(--color-attention)]">
            Kyrra fonctionne en mode simplifié. Vos emails sont filtrés avec une confiance légèrement réduite.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
