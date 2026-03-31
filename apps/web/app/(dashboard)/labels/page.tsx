const labels = [
  {
    key: 'A_VOIR',
    name: 'À voir',
    gmail: 'Kyrra/À voir',
    description: 'Emails à examiner — potentiellement pertinents',
    bar: 'bar-a-voir',
    badgeBg: 'bg-[#e8edf8]',
    badgeText: 'text-[#2d4a8a]',
  },
  {
    key: 'FILTRE',
    name: 'Filtré',
    gmail: 'Kyrra/Filtré',
    description: 'Prospection filtrée — pas urgente',
    bar: 'bar-filtre',
    badgeBg: 'bg-[#edeef2]',
    badgeText: 'text-[#5c6070]',
  },
  {
    key: 'BLOQUE',
    name: 'Bloqué',
    gmail: 'Kyrra/Bloqué',
    description: 'Spam et prospection indésirable',
    bar: 'bar-bloque',
    badgeBg: 'bg-[#f8e8e8]',
    badgeText: 'text-[#8a2d2d]',
  },
]

export default function LabelsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
          Libellés
        </h1>
        <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
          Les libellés Kyrra sont automatiquement créés dans votre boîte Gmail.
        </p>
      </div>

      <div className="space-y-0 border border-[#e4e6ed] bg-white">
        {labels.map((label, i) => (
          <div
            key={label.key}
            className={`flex items-center gap-4 px-6 py-5 ${i < labels.length - 1 ? 'border-b border-[#e4e6ed]' : ''}`}
          >
            {/* Color bar */}
            <span className={`self-stretch ${label.bar}`} />

            {/* Label info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-[#0c1a32]">{label.name}</span>
                <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${label.badgeBg} ${label.badgeText}`}>
                  {label.gmail}
                </span>
              </div>
              <p className="text-[11px] text-[#8b90a0] mt-1">{label.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-dashed border-[#e4e6ed] bg-white/50 p-6 text-center">
        <p className="text-[13px] text-[#8b90a0]">Les libellés personnalisés arrivent bientôt.</p>
        <p className="font-mono text-[10px] text-[#c4c7d4] mt-1">Vous pourrez créer vos propres catégories de tri.</p>
      </div>
    </>
  )
}
