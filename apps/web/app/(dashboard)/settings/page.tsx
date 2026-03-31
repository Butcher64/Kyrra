import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/SettingsForm.client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch current user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('exposure_mode, recap_enabled')
    .eq('user_id', user!.id)
    .single()

  const currentMode = (settings?.exposure_mode ?? 'normal') as 'strict' | 'normal' | 'permissive'
  const recapEnabled = settings?.recap_enabled ?? false

  return (
    <>
      <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
        Paramètres
      </h1>
      <p className="font-mono text-[11px] text-[#8b90a0] mt-1 mb-8">
        Configurez le comportement de Kyrra
      </p>

      <SettingsForm
        currentMode={currentMode}
        recapEnabled={recapEnabled}
        userEmail={user?.email ?? ''}
      />

      <div className="mt-12 pt-6 border-t border-[#e4e6ed]">
        <h2 className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Informations légales
        </h2>
        <div className="flex gap-4 text-[12px]">
          <Link
            href="/legal/cgu"
            className="text-[#8b90a0] no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Conditions Générales d&apos;Utilisation
          </Link>
          <span className="text-[#c4c7d4]">&middot;</span>
          <Link
            href="/legal/privacy"
            className="text-[#8b90a0] no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </>
  )
}
