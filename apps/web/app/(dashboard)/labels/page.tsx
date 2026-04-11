import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LabelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's dynamic labels
  const { data: labels } = await supabase
    .from('user_labels')
    .select('id, name, description, color, position, is_default')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  // Fetch classification counts per label (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: counts } = await supabase
    .from('email_classifications')
    .select('label_id')
    .eq('user_id', user.id)
    .gte('created_at', weekAgo)

  // Count per label
  const countByLabel: Record<string, number> = {}
  for (const row of counts ?? []) {
    if (row.label_id) {
      countByLabel[row.label_id] = (countByLabel[row.label_id] ?? 0) + 1
    }
  }

  const totalWeek = counts?.length ?? 0

  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
          Libellés
        </h1>
        <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
          {labels?.length ?? 0} labels actifs · {totalWeek} emails classés cette semaine
        </p>
      </div>

      {/* Section — Labels Kyrra */}
      <div className="mb-8">
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Vos labels de classification
        </p>
        <div className="border border-[#e4e6ed] bg-white">
          {(labels ?? []).map((label, i, arr) => {
            const count = countByLabel[label.id] ?? 0
            return (
              <div
                key={label.id}
                className={`flex items-center gap-4 px-6 py-5 ${i < arr.length - 1 ? 'border-b border-[#e4e6ed]' : ''}`}
              >
                <span
                  className="w-[3px] self-stretch shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0c1a32]">
                    {label.name}
                    {label.is_default && (
                      <span className="font-mono text-[9px] text-[#8b90a0] ml-2 font-normal">
                        par défaut
                      </span>
                    )}
                  </p>
                  {label.description && (
                    <p className="text-[11px] text-[#8b90a0] mt-0.5">
                      {label.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[16px] font-bold text-[#0c1a32]">{count}</p>
                  <p className="font-mono text-[9px] text-[#8b90a0]">cette semaine</p>
                </div>
              </div>
            )
          })}
          {(!labels || labels.length === 0) && (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-[#8b90a0]">
                Aucun label configuré. Complétez l'onboarding pour commencer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section — Info */}
      <div className="border border-[#e4e6ed] bg-[#f5f6f9] px-6 py-4">
        <p className="font-mono text-[10px] text-[#8b90a0]">
          La gestion avancée des labels (ajout, suppression, règles personnalisées) sera disponible prochainement.
          Vos labels ont été configurés pendant l'onboarding.
        </p>
      </div>
    </>
  )
}
