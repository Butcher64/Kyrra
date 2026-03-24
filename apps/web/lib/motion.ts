export const transitions = {
  fast: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const },
  normal: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 100, damping: 20 },
  stagger: { staggerChildren: 0.08, delayChildren: 0.1 },
  slideUp: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  fadeIn: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  scaleIn: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
} as const

export const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  },
} as const
