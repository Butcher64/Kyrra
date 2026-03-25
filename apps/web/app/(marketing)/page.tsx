import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { SocialProof } from '@/components/marketing/SocialProof'
import { ProblemSection } from '@/components/marketing/ProblemSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { SecuritySection } from '@/components/marketing/SecuritySection'
import { StatsSection } from '@/components/marketing/StatsSection'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { CTASection } from '@/components/marketing/CTASection'

export const metadata: Metadata = {
  title: 'Kyrra — Le pare-feu cognitif qui filtre vos emails de prospection',
  description: 'Kyrra est le pare-feu cognitif qui filtre les emails de prospection par IA pour les dirigeants. Classification intelligente, zero donnees stockees, 100% RGPD.',
  keywords: ['filtre email IA', 'anti-prospection', 'pare-feu email', 'classification email', 'RGPD', 'dirigeants', 'productivite email'],
  openGraph: {
    title: 'Kyrra — Pare-feu cognitif anti-prospection',
    description: "L'IA qui filtre les emails de prospection pour les dirigeants. Aucun email important n'est perdu. Jamais.",
    type: 'website',
    locale: 'fr_FR',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Kyrra — Pare-feu cognitif' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Kyrra — Faites taire le bruit. Gardez l'essentiel.",
    description: 'Pare-feu cognitif anti-prospection pour dirigeants. Classification IA, zero donnees stockees.',
    images: ['/api/og'],
  },
  alternates: { canonical: 'https://kyrra.io' },
  robots: { index: true, follow: true },
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SocialProof />
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <SecuritySection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  )
}
