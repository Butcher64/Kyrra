import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { LogoCloud } from '@/components/marketing/LogoCloud'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PricingSection } from '@/components/marketing/PricingSection'
import { SecuritySection } from '@/components/marketing/SecuritySection'
import { CTASection } from '@/components/marketing/CTASection'

export const metadata: Metadata = {
  title: 'Kyrra — Faites taire le bruit. Gardez l\'essentiel.',
  description:
    'Kyrra est le pare-feu cognitif qui filtre les emails de prospection par IA pour les dirigeants. Classification intelligente, zero donnees stockees, 100% RGPD.',
  keywords: [
    'filtre email IA',
    'anti-prospection',
    'pare-feu email',
    'classification email',
    'RGPD',
    'dirigeants',
    'productivite email',
  ],
  openGraph: {
    title: 'Kyrra — Pare-feu cognitif anti-prospection',
    description:
      'L\'IA qui filtre les emails de prospection pour les dirigeants. Aucun email important n\'est perdu. Jamais.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kyrra — Faites taire le bruit. Gardez l\'essentiel.',
    description:
      'Pare-feu cognitif anti-prospection pour dirigeants. Classification IA, zero donnees stockees.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LogoCloud />
      <FeatureGrid />
      <HowItWorks />
      <PricingSection />
      <SecuritySection />
      <CTASection />
    </>
  )
}
