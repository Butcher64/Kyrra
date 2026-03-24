import { ShieldCheck, Globe, KeyRound } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import { FeatureCard } from './FeatureCard'
import { ScrollReveal } from './ScrollReveal'

const items = [
  {
    icon: ShieldCheck,
    title: 'Zero Data Retention',
    description:
      'Aucun contenu d\'email stocke. Classification en memoire, resultats anonymises.',
  },
  {
    icon: Globe,
    title: 'Hebergement EU',
    description:
      'Infrastructure 100% europeenne. Conforme RGPD article 7, hebergeurs certifies.',
  },
  {
    icon: KeyRound,
    title: 'Chiffrement AES-256',
    description:
      'Tokens OAuth chiffres au repos. TLS 1.3 en transit. Audit de securite regulier.',
  },
]

export function SecuritySection() {
  return (
    <section className="py-24" id="security">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeader
          badge="Securite"
          title="Vos donnees nous sont sacrees"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <ScrollReveal key={item.title}>
              <FeatureCard
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
