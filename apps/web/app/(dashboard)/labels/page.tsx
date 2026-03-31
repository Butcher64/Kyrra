export default function LabelsPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
          Libellés
        </h1>
        <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
          Gérez vos labels automatiques et personnalisés
        </p>
      </div>

      {/* Section 1 — Labels Kyrra (automatiques) */}
      <div className="mb-8">
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Labels Kyrra (automatiques)
        </p>
        <div className="border border-[#e4e6ed] bg-white">
          {/* Filtré */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-[#e4e6ed]">
            <span className="w-[3px] self-stretch bg-[#c4c7d4]" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#0c1a32]">Filtré</p>
              <p className="text-[11px] text-[#8b90a0] mt-0.5">
                Prospection générique — pas urgente
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[16px] font-bold text-[#0c1a32]">175</p>
              <p className="font-mono text-[9px] text-[#8b90a0]">cette semaine</p>
            </div>
          </div>

          {/* Bloqué */}
          <div className="flex items-center gap-4 px-6 py-5">
            <span className="w-[3px] self-stretch bg-[#d4a0a0]" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#0c1a32]">Bloqué</p>
              <p className="text-[11px] text-[#8b90a0] mt-0.5">
                Spam et prospection indésirable
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[16px] font-bold text-[#c23a3a]">89</p>
              <p className="font-mono text-[9px] text-[#8b90a0]">cette semaine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Labels Gmail (synchronisés) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0]">
            Labels Gmail (synchronisés)
          </p>
          <button className="font-mono text-[10px] text-[#3a5bc7] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
            synchroniser ↻
          </button>
        </div>
        <div className="border border-[#e4e6ed] bg-white">
          {[
            { name: 'Clients', color: '#4285f4', count: 234 },
            { name: 'Fournisseurs', color: '#0f9d58', count: 89 },
            { name: 'Projets en cours', color: '#f4b400', count: 156 },
            { name: 'Comptabilité', color: '#db4437', count: 67 },
          ].map((label, i, arr) => (
            <div
              key={label.name}
              className={`flex items-center gap-3 px-6 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#e4e6ed]' : ''}`}
            >
              <span
                className="w-2 h-2 shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-[13px] text-[#0c1a32] flex-1">
                {label.name}
              </span>
              <span className="font-mono text-[11px] text-[#8b90a0]">
                {label.count} emails
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 — Règles personnalisées */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0]">
            Règles personnalisées
          </p>
          <button className="bg-[#0c1a32] text-white px-4 py-1.5 text-[11px] font-medium border-none cursor-pointer transition-opacity duration-150 hover:opacity-80">
            + Nouvelle règle
          </button>
        </div>
        <div className="border border-[#e4e6ed] bg-white">
          {/* Rule 1 */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e4e6ed]">
            <span
              className="w-2 h-2 shrink-0"
              style={{ backgroundColor: '#4285f4' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#0c1a32]">
                Emails de @acme-corp.com → Clients
              </p>
              <p className="font-mono text-[10px] text-[#8b90a0] mt-0.5">
                domain · créé il y a 3 jours · 12 matchés
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button className="font-mono text-[10px] text-[#3a5bc7] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
                modifier
              </button>
              <button className="font-mono text-[10px] text-[#c23a3a] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
                supprimer
              </button>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-center gap-3 px-6 py-4">
            <span
              className="w-2 h-2 shrink-0"
              style={{ backgroundColor: '#db4437' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#0c1a32]">
                Contient &apos;facture&apos; → Comptabilité
              </p>
              <p className="font-mono text-[10px] text-[#8b90a0] mt-0.5">
                mot-clé · créé il y a 1 semaine · 8 matchés
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button className="font-mono text-[10px] text-[#3a5bc7] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
                modifier
              </button>
              <button className="font-mono text-[10px] text-[#c23a3a] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
                supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
