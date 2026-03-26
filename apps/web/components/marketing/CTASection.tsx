import Link from 'next/link'
import { MagneticButton } from '@/components/animation/MagneticButton'
import { ScrollReveal } from './ScrollReveal'

export function CTASection() {
  return (
    <section
      data-section="cta-final"
      className="py-32 bg-gradient-to-b from-[var(--background)] to-[var(--surface-darkest)]"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-extrabold text-slate-100 mb-10 leading-tight">
            Redécouvrez le plaisir d'un travail ininterrompu.
          </h2>
        </ScrollReveal>

        {/* Social proof widget */}
        <div className="glass rounded-2xl inline-flex p-1 mb-10">
          <div className="flex items-center px-6 py-4 gap-4">
            <div className="flex -space-x-3">
              {['TB', 'ML', 'PD'].map((initials) => (
                <div
                  key={initials}
                  className="w-10 h-10 rounded-full border-2 border-[var(--background)] bg-[var(--color-accent-start)]/20 flex items-center justify-center text-[10px] font-semibold text-[var(--color-accent-start)]"
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-200">Rejoignez 2,000+ innovateurs</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <MagneticButton>
            <Link
              href="/login"
              className="inline-block bg-[var(--color-accent-start)] text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-[var(--shadow-accent-lg)] transition-all no-underline"
            >
              Essai Gratuit de 14 jours
            </Link>
          </MagneticButton>
        </div>

        <p className="mt-6 text-slate-500 text-xs font-label">
          Aucune carte de crédit requise • Annulation à tout moment
        </p>
      </div>
    </section>
  )
}
