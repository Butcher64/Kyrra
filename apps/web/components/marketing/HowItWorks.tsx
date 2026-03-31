import { Link2, Zap, Tags } from 'lucide-react'

const steps = [
  {
    icon: Link2,
    number: '01',
    heading: 'Connectez Gmail',
    body: 'OAuth securise en un clic. Kyrra construit votre whitelist automatiquement a partir de vos 6 derniers mois d\'envois.',
    detail: 'setup < 2 minutes',
  },
  {
    icon: Zap,
    number: '02',
    heading: 'Classification IA',
    body: 'Double moteur : regles metier pour le volume, LLM pour les cas ambigus. Score de confiance par email.',
    detail: 'latence < 2 secondes',
  },
  {
    icon: Tags,
    number: '03',
    heading: 'Labels intelligents',
    body: 'Filtre et Bloque pour la prospection, plus des labels personnalisables pour organiser le reste de votre boite.',
    detail: '+ recap quotidien',
  },
]

const stats = [
  { value: '312', label: 'distractions / sem.' },
  { value: '45min', label: 'gagnees / jour' },
  { value: '99.2%', label: 'precision' },
]

export function HowItWorks() {
  return (
    <section
      data-section="how-it-works"
      id="how-it-works"
      className="py-24 lg:py-32"
    >
      <div className="max-w-6xl mx-auto px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="font-mono text-[11px] text-[#8b90a0] uppercase tracking-[0.14em] mb-3">
            Comment ca marche
          </div>
          <h2 className="text-[24px] font-bold text-[#0c1a32]">
            Trois etapes. Zero effort.
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {steps.map((step) => (
            <div key={step.number} className="border border-[#e4e6ed] p-7">
              {/* Icon */}
              <div className="w-10 h-10 bg-[#f5f6f9] border border-[#e4e6ed] flex items-center justify-center mb-5">
                <step.icon size={18} className="text-[#0c1a32]" />
              </div>

              {/* Number */}
              <div className="font-mono text-[11px] text-[#c4c7d4] font-medium mb-2">
                {step.number}
              </div>

              {/* Heading */}
              <h3 className="text-[17px] font-semibold text-[#0c1a32] mb-2">
                {step.heading}
              </h3>

              {/* Body */}
              <p className="text-[13px] text-[#4a5068] leading-relaxed mb-4">
                {step.body}
              </p>

              {/* Detail */}
              <div className="font-mono text-[9px] text-[#8b90a0] uppercase tracking-wider">
                {step.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="flex justify-center gap-16 lg:gap-24 pt-8 border-t border-[#e4e6ed]">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[28px] font-bold text-[#0c1a32] tracking-tight">{s.value}</div>
              <div className="font-mono text-[9px] text-[#8b90a0] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
