'use client'

import { useState } from 'react'
import { ExposureModePills } from './ExposureModePills.client'
import { useToast } from '@/components/ui/toast'
import { updateExposureMode, updateNotifications } from '@/app/(dashboard)/actions/settings'

type Mode = 'strict' | 'normal' | 'permissive'

interface SettingsFormProps {
  currentMode: Mode
  recapEnabled: boolean
  userEmail: string
}

export function SettingsForm({ currentMode, recapEnabled, userEmail }: SettingsFormProps) {
  const [recap, setRecap] = useState(recapEnabled)
  const [savingMode, setSavingMode] = useState(false)
  const [savingRecap, setSavingRecap] = useState(false)
  const { toast } = useToast()

  async function handleModeChange(mode: Mode) {
    setSavingMode(true)
    const result = await updateExposureMode({ exposure_mode: mode })
    setSavingMode(false)

    if (result.error) {
      toast({ title: 'Erreur', description: result.error.message, type: 'attention' })
    } else {
      toast({ title: 'Mode mis à jour.' })
    }
  }

  async function handleRecapToggle() {
    const next = !recap
    setSavingRecap(true)
    const result = await updateNotifications({
      notifications_enabled: true,
      recap_enabled: next,
    })
    setSavingRecap(false)

    if (result.error) {
      toast({ title: 'Erreur', description: result.error.message, type: 'attention' })
    } else {
      setRecap(next)
      toast({ title: next ? 'Recap activé.' : 'Recap désactivé.' })
    }
  }

  return (
    <>
      {/* Exposure mode */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
          Mode d&apos;exposition
        </h2>
        <p className="text-xs text-(--muted-foreground) mb-4">
          Contrôlez le niveau de filtrage de Kyrra.
        </p>
        <div className={savingMode ? 'opacity-60 pointer-events-none' : ''}>
          <ExposureModePills currentMode={currentMode} onModeChange={handleModeChange} />
        </div>
      </section>

      {/* Recap preferences */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
          Recap
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-xs text-(--muted-foreground)">
            Email récapitulatif quotidien
          </p>
          <button
            onClick={handleRecapToggle}
            disabled={savingRecap}
            aria-pressed={recap}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-none transition-colors duration-200 ${
              recap ? 'bg-[var(--color-a-voir)]' : 'bg-(--muted)'
            } ${savingRecap ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                recap ? 'translate-x-[22px]' : 'translate-x-[2px]'
              } mt-[2px]`}
            />
          </button>
        </div>
      </section>

      {/* Display preferences */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
          Affichage
        </h2>
        <p className="text-xs text-(--muted-foreground)">
          Scores de confiance : seulement en cas de doute (&lt;75%) ou toujours afficher.
        </p>
      </section>

      {/* Account */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
          Compte
        </h2>
        <p className="text-xs text-(--muted-foreground)">
          {userEmail}
        </p>
      </section>
    </>
  )
}
