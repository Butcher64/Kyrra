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
      <div className="mb-10">
        <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
          Paramètres
        </h1>
        <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
          Configuration de votre compte Kyrra
        </p>
      </div>

      <SettingsForm
        currentMode={currentMode}
        recapEnabled={recapEnabled}
        userEmail={user?.email ?? ''}
      />
    </>
  )
}
