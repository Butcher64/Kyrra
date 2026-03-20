'use client'

import { useEffect, useRef, useState } from 'react'

interface HeroStatProps {
  value: number
  label: string
}

export function HeroStat({ value, label }: HeroStatProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const duration = 800 // ms
    const startTime = performance.now()
    const startValue = displayValue

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(startValue + (value - startValue) * eased))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [value])

  return (
    <div aria-label={`${value} ${label}`}>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '72px',
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: 'var(--foreground, #1a1a18)',
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: '#9ca3af',
          marginTop: '4px',
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </div>
    </div>
  )
}
