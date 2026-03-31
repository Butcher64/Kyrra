import { Tag } from 'lucide-react'

const labels = [
  { key: 'A_VOIR', name: 'À voir', gmail: 'Kyrra/À voir', description: 'Emails à examiner — potentiellement pertinents', color: 'var(--color-a-voir)' },
  { key: 'FILTRE', name: 'Filtré', gmail: 'Kyrra/Filtré', description: 'Prospection filtrée — pas urgente', color: 'var(--color-filtre)' },
  { key: 'BLOQUE', name: 'Bloqué', gmail: 'Kyrra/Bloqué', description: 'Spam et prospection indésirable', color: 'var(--color-bloque)' },
]

export default function LabelsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-headline font-semibold text-slate-800 tracking-tight">
          Libellés
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Les libellés Kyrra sont automatiquement créés dans votre boîte Gmail.
        </p>
      </div>

      <div className="space-y-3">
        {labels.map((label) => (
          <div
            key={label.key}
            className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4"
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `color-mix(in oklch, ${label.color} 15%, transparent)` }}
            >
              <Tag size={18} style={{ color: label.color }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{label.name}</span>
                <span className="text-[10px] font-label text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                  {label.gmail}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{label.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-6 text-center">
        <p className="text-sm text-slate-500">Les libellés personnalisés arrivent bientôt.</p>
        <p className="text-xs text-slate-400 mt-1">Vous pourrez créer vos propres catégories de tri.</p>
      </div>
    </>
  )
}
