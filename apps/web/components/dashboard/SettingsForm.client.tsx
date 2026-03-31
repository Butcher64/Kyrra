'use client'

import { useState } from 'react'
import { ExposureModePills } from './ExposureModePills.client'
import { DeleteAccountDialog } from './DeleteAccountDialog.client'
import { useToast } from '@/components/ui/toast'
import { updateExposureMode, updateNotifications } from '@/app/(dashboard)/actions/settings'

type Mode = 'strict' | 'normal' | 'permissive'

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  strict: 'Seuls les contacts connus passent. Maximum de protection.',
  normal: 'Filtrage intelligent et équilibré. Recommandé.',
  permissive: 'Plus d\'opportunités visibles. Moins de filtrage.',
}

interface SettingsFormProps {
  currentMode: Mode
  recapEnabled: boolean
  userEmail: string
}

export function SettingsForm({ currentMode, recapEnabled, userEmail }: SettingsFormProps) {
  const [recap, setRecap] = useState(recapEnabled)
  const [activeMode, setActiveMode] = useState<Mode>(currentMode)
  const [savingMode, setSavingMode] = useState(false)
  const [savingRecap, setSavingRecap] = useState(false)
  const { toast } = useToast()

  async function handleModeChange(mode: Mode) {
    setActiveMode(mode)
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
    <div className="max-w-[560px] space-y-4">
      {/* Block 1 — Mode d'exposition */}
      <div className="bg-white border border-[#e4e6ed] p-5">
        <p className="text-[14px] font-semibold text-[#0c1a32]">
          Mode d&apos;exposition
        </p>
        <p className="text-[12px] text-[#8b90a0] mt-1 mb-4">
          Ajustez la sensibilité du filtre
        </p>
        <div className={savingMode ? 'opacity-60 pointer-events-none' : ''}>
          <ExposureModePills currentMode={currentMode} onModeChange={handleModeChange} />
        </div>
        <p className="font-mono text-[10px] text-[#8b90a0] mt-3">
          {MODE_DESCRIPTIONS[activeMode]}
        </p>
      </div>

      {/* Block 2 — Kyrra Recap */}
      <div className="bg-white border border-[#e4e6ed] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#0c1a32]">
              Kyrra Recap
            </p>
            <p className="text-[12px] text-[#8b90a0] mt-1">
              Email récapitulatif quotidien
            </p>
          </div>
          <button
            onClick={handleRecapToggle}
            disabled={savingRecap}
            aria-pressed={recap}
            className={`relative w-10 h-[22px] shrink-0 cursor-pointer border border-[#e4e6ed] transition-colors duration-200 ${
              recap ? 'bg-[#0c1a32]' : 'bg-[#e4e6ed]'
            } ${savingRecap ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <span
              className={`absolute top-[3px] w-[14px] h-[14px] bg-white transition-transform duration-200 ${
                recap ? 'left-[22px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
        <p className="font-mono text-[10px] text-[#8b90a0] mt-3">
          Envoyé chaque matin à 8h
        </p>
      </div>

      {/* Block 3 — Compte */}
      <div className="bg-white border border-[#e4e6ed] p-5">
        <p className="text-[14px] font-semibold text-[#0c1a32] mb-4">
          Compte
        </p>
        <div className="space-y-0">
          {/* Email */}
          <div className="flex items-center justify-between py-3 border-b border-[#e4e6ed]">
            <span className="text-[12px] text-[#8b90a0]">Email</span>
            <span className="text-[12px] text-[#0c1a32]">{userEmail}</span>
          </div>
          {/* Plan */}
          <div className="flex items-center justify-between py-3 border-b border-[#e4e6ed]">
            <span className="text-[12px] text-[#8b90a0]">Plan</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#0c1a32]">Free</span>
              <button className="font-mono text-[10px] text-[#3a5bc7] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
                gérer →
              </button>
            </div>
          </div>
          {/* Gmail */}
          <div className="flex items-center justify-between py-3">
            <span className="text-[12px] text-[#8b90a0]">Gmail</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#2dd881]" />
              <span className="text-[12px] text-[#0c1a32]">connecté</span>
            </div>
          </div>
        </div>
      </div>

      {/* Block 4 — Sécurité */}
      <div className="bg-white border border-[#e4e6ed] p-5">
        <p className="text-[14px] font-semibold text-[#0c1a32] mb-4">
          Sécurité
        </p>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-[#e4e6ed]">
            <span className="text-[12px] text-[#8b90a0]">Mot de passe</span>
            <button className="font-mono text-[10px] text-[#3a5bc7] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
              modifier →
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[12px] text-[#8b90a0]">Sessions actives</span>
            <span className="text-[12px] text-[#0c1a32]">1</span>
          </div>
        </div>
      </div>

      {/* Block 5 — Confidentialité */}
      <div className="bg-white border border-[#e4e6ed] p-5">
        <p className="text-[14px] font-semibold text-[#0c1a32] mb-4">
          Confidentialité
        </p>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-[#e4e6ed]">
            <span className="text-[12px] text-[#8b90a0]">Exporter mes données</span>
            <button className="font-mono text-[10px] text-[#3a5bc7] bg-transparent border-none cursor-pointer transition-opacity duration-150 hover:opacity-70">
              exporter →
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[12px] text-[#8b90a0]">Politique de confidentialité</span>
            <a
              href="/legal/privacy"
              className="font-mono text-[10px] text-[#3a5bc7] no-underline transition-opacity duration-150 hover:opacity-70"
            >
              consulter →
            </a>
          </div>
        </div>
      </div>

      {/* Block 6 — Zone dangereuse */}
      <div className="border border-[#e4e6ed] p-5">
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#c23a3a] mb-4">
          Zone dangereuse
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[#0c1a32]">Supprimer mon compte</p>
            <p className="text-[11px] text-[#8b90a0] mt-0.5">
              Action irréversible. Toutes vos données seront effacées.
            </p>
          </div>
          <DeleteAccountDialog />
        </div>
      </div>
    </div>
  )
}
