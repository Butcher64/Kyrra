'use client'

import { useState, useTransition } from 'react'
import { saveConsent } from './actions'

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Checkbox({
  id,
  checked,
  onChange,
  label,
  required,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: React.ReactNode
  required?: boolean
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <button
        id={id}
        role="checkbox"
        type="button"
        aria-checked={checked}
        aria-required={required}
        onClick={() => onChange(!checked)}
        className={`
          mt-0.5 flex-shrink-0 size-5 border-2 flex items-center justify-center
          transition-all duration-200
          ${checked
            ? 'bg-[#0c1a32] border-[#0c1a32] text-white'
            : 'border-(--muted-foreground) bg-transparent group-hover:border-(--foreground)'
          }
        `}
      >
        {checked && <CheckIcon className="size-3" />}
      </button>
      <span className="text-sm font-mono text-(--foreground) leading-relaxed select-none">
        {label}
      </span>
    </label>
  )
}

export function ConsentForm() {
  const [classifyConsent, setClassifyConsent] = useState(false)
  const [recapConsent, setRecapConsent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConnect() {
    if (!classifyConsent) return

    startTransition(async () => {
      setError(null)
      try {
        const result = await saveConsent({
          consent_given: true,
          recap_consent: recapConsent,
        })

        if (result.error) {
          setError('Erreur lors de la sauvegarde du consentement. Veuillez reessayer.')
          return
        }

        // Consent saved — proceed to Gmail OAuth
        window.location.href = '/auth/callback/google'
      } catch {
        setError('Erreur réseau. Veuillez réessayer.')
      }
    })
  }

  return (
    <div className="w-full">
      {/* Consent checkboxes */}
      <div className="flex flex-col gap-4">
        <Checkbox
          id="consent-classify"
          checked={classifyConsent}
          onChange={setClassifyConsent}
          required
          label={
            <>
              J&apos;autorise Kyrra a classifier mes emails par intelligence artificielle{' '}
              <span className="text-[var(--color-bloque)]">*</span>
            </>
          }
        />
        <Checkbox
          id="consent-recap"
          checked={recapConsent}
          onChange={setRecapConsent}
          label="J'accepte de recevoir le Recap quotidien par email"
        />
      </div>

      {/* Legal links */}
      <p className="text-xs text-(--muted-foreground) mt-4">
        En continuant, vous acceptez nos{' '}
        <a href="/legal/cgu" className="underline underline-offset-2 hover:text-(--foreground) transition-colors">
          Conditions Generales
        </a>{' '}
        et notre{' '}
        <a href="/legal/privacy" className="underline underline-offset-2 hover:text-(--foreground) transition-colors">
          Politique de confidentialite
        </a>.
      </p>

      {/* Error message */}
      {error && (
        <p className="text-xs text-[var(--color-bloque)] mt-3">{error}</p>
      )}

      {/* Connect button */}
      <button
        className={`
          mt-6 w-full h-11 bg-[#0c1a32] text-white font-mono font-medium text-sm
          flex items-center justify-center gap-2
          transition-opacity cursor-pointer
          ${(!classifyConsent || isPending) ? 'opacity-40 pointer-events-none' : 'hover:opacity-90'}
        `}
        disabled={!classifyConsent || isPending}
        onClick={handleConnect}
      >
        {isPending ? 'Connexion...' : 'Connecter Gmail \u2192'}
      </button>
    </div>
  )
}
