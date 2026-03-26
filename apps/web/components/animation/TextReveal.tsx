'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TextRevealProps {
  children: string
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  delay?: number
  className?: string
}

export function TextReveal({ children, tag: Tag = 'h1', delay = 0, className }: TextRevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ctx: gsap.Context | undefined
    const init = async () => {
      const { loadSplitText } = await import('@/lib/gsap')
      const { gsap, ScrollTrigger, SplitText } = await loadSplitText()

      if (!ref.current) return

      const split = new SplitText(ref.current, { type: 'chars' })

      ctx = gsap.context(() => {
        gsap.from(split.chars, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.02,
          delay,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            once: true,
          },
        })
      }, ref)
    }
    init()
    return () => ctx?.revert()
  }, [delay])

  // @ts-expect-error — dynamic tag
  return <Tag ref={ref} className={cn(className)}>{children}</Tag>
}
