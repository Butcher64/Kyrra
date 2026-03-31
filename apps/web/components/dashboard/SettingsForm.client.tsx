'use client'

import { useState } from 'react'
import { ExposureModePills } from './ExposureModePills.client'
import { DeleteAccountDialog } from './DeleteAccountDialog.client'
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
        <h2 className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Mode d&apos;exposition
        </h2>
        <p className="text-[12px] text-[#8b90a0] mb-4">
          Contrôlez le niveau de filtrage de Kyrra.
        </p>
        <div className={savingMode ? 'opacity-60 pointer-events-none' : ''}>
          <ExposureModePills currentMode={currentMode} onModeChange={handleModeChange} />
        </div>
      </section>

      {/* Recap preferences */}
      <section className="mb-8">
        <h2 className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Recap
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#8b90a0]">
            Email récapitulatif quotidien
          </p>
          <button
            onClick={handleRecapToggle}
            disabled={savingRecap}
            aria-pressed={recap}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border border-[#e4e6ed] transition-colors duration-200 ${
              recap ? 'bg-[#3a5bc7]' : 'bg-[#e4e6ed]'
            } ${savingRecap ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block size-5 bg-white transform transition-transform duration-200 ${
                recap ? 'translate-x-[22px]' : 'translate-x-[2px]'
              } mt-[2px]`}
            />
          </button>
        </div>
      </section>

      {/* Display preferences */}
      <section className="mb-8">
        <h2 className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Affichage
        </h2>
        <p className="text-[12px] text-[#8b90a0]">
          Scores de confiance : seulement en cas de doute (&lt;75%) ou toujours afficher.
        </p>
      </section>

      {/* Account */}
      <section className="mb-8">
        <h2 className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-3">
          Compte
        </h2>
        <p className="text-[12px] text-[#8b90a0] mb-4">
          {userEmail}
        </p>
        <div className="pt-4 border-t border-[#e4e6ed]">
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#c23a3a] mb-2">
            Zone dangereuse
          </p>
          <DeleteAccountDialog />
        </div>
      </section>
    </>
  )
}
