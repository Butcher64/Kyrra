export const transitions = {
  fast: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const },
  normal: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 100, damping: 20 },
} as const
