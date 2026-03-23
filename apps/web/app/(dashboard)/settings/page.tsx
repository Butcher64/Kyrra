
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
    <main className="flex justify-center px-6 pt-16 pb-12 min-h-screen">
      <div className="w-full max-w-[560px]">
        <Link
          href="/"
          className="text-xs text-[var(--color-a-voir)] no-underline transition-opacity duration-150 hover:opacity-70"
        >
          &larr; Retour au tableau de bord
        </Link>

        <h1 className="text-xl font-medium mb-8 mt-4">
          Paramètres
        </h1>

        <SettingsForm
          currentMode={currentMode}
          recapEnabled={recapEnabled}
          userEmail={user?.email ?? ''}
        />
      </div>
    </main>
  )
}
