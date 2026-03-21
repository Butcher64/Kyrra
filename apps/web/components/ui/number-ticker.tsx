'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  duration?: number
  className?: string
}

export function NumberTicker({ value, duration = 800, className }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const animationRef = useRef<number | null>(null)
  const displayRef = useRef(0)
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (prefersReducedMotion.current) {
      displayRef.current = value
      setDisplayValue(value)
      return
    }

    const startTime = performance.now()
    const startValue = displayRef.current

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(startValue + (value - startValue) * eased)
      displayRef.current = next
      setDisplayValue(next)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [value, duration])

  return (
    <span className={cn('tabular-nums', className)} aria-label={String(value)}>
      {displayValue}
    </span>
  )
}
