import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from './ScrollReveal'

export function CTASection() {
  return (
    <section className="relative bg-brand-gradient py-24 text-center overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-10" />
      <div className="relative z-10 mx-auto max-w-[600px] px-6">
        <ScrollReveal>
          <h2 className="font-outfit text-3xl font-light text-white">
            Pret a retrouver le calme ?
          </h2>
          <p className="mt-4 text-white/70">
            Essai gratuit 14 jours. Pas de carte bancaire.
          </p>
          <div className="mt-8">
            <Button variant="brand" size="lg" className="glow-brand" asChild>
              <Link href="/login">Commencer gratuitement →</Link>
            </Button>
          </div>
          <p className="mt-4">
            <a
              href="mailto:legal@kyrra.io"
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Ou contactez-nous
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
