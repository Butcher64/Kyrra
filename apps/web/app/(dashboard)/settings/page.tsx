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
      <h1 className="font-outfit text-2xl font-semibold text-[var(--foreground)]">
        Paramètres
      </h1>
      <p className="mt-1 mb-8 text-sm text-[var(--muted-foreground)]">
        Configurez le comportement de Kyrra
      </p>

      <SettingsForm
        currentMode={currentMode}
        recapEnabled={recapEnabled}
        userEmail={user?.email ?? ''}
      />

      <div className="mt-12 pt-6 border-t border-[var(--border)]">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
          Informations légales
        </h2>
        <div className="flex gap-4 text-sm">
          <Link
            href="/legal/cgu"
            className="text-[var(--muted-foreground)] no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Conditions Générales d&apos;Utilisation
          </Link>
          <span className="text-[var(--muted-foreground)]">&middot;</span>
          <Link
            href="/legal/privacy"
            className="text-[var(--muted-foreground)] no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </>
  )
}
