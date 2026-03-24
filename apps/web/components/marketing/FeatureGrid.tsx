import { Shield, Layers, FileText, Mail, Lock, RefreshCw } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import { FeatureCard } from './FeatureCard'
import { ScrollReveal } from './ScrollReveal'

const features = [
  {
    icon: Shield,
    title: 'Classification IA',
    description:
      'Double moteur intelligent : empreintes + LLM pour une precision metier inegalee.',
  },
  {
    icon: Layers,
    title: '3 niveaux de filtrage',
    description:
      'A voir, Filtre, Bloque — chaque email a sa place dans votre Gmail.',
  },
  {
    icon: FileText,
    title: 'Resume en 1 ligne',
    description:
      'Chaque email classifie est resume pour vous. Decidez en un coup d\'oeil.',
  },
  {
    icon: Mail,
    title: 'Reste dans Gmail',
    description:
      'Vos emails restent chez Google. Kyrra ajoute des labels, rien de plus.',
  },
  {
    icon: Lock,
    title: 'Zero donnees stockees',
    description:
      'Aucun email lu. Aucun contenu stocke. Hebergement 100% EU.',
  },
  {
    icon: RefreshCw,
    title: 'Kyrra apprend',
    description:
      'Reclassifiez un email, Kyrra s\'adapte. Score de confiance croissant.',
  },
]

export function FeatureGrid() {
  return (
    <section className="py-24" id="features">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeader
          badge="Fonctionnalites"
          title="Un filtre intelligent, pas un dossier spam"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <ScrollReveal key={f.title}>
              <FeatureCard
                icon={f.icon}
                title={f.title}
                description={f.description}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
