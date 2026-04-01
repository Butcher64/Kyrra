'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LABELS } from '@kyrra/shared'
import { LabelCard } from './LabelCard.client'
import { AddLabelModal } from './AddLabelModal.client'
import { saveLabelsConfig, getOnboardingLabelsData } from '../actions/configure-labels'

interface LabelItem {
  name: string
  description: string
  prompt: string
  color: string
  gmail_label_id: string | null
  gmail_label_name: string | null
  is_default: boolean
  examples: string[]
}

/**
 * Try to match a Gmail label name to a Kyrra default label.
 * Returns the index of the matched default label, or -1.
 */
function matchGmailToDefault(gmailName: string): number {
  const lower = gmailName.toLowerCase()

  // Map common Gmail label patterns to Kyrra defaults
  const patterns: [RegExp, string][] = [
    [/client|important|priorit|urgent/i, 'Important'],
    [/factur|compta|admin|transaction|paiement|invoice|receipt/i, 'Transactionnel'],
    [/notif|alert|slack|github/i, 'Notifications'],
    [/veille|news|newsletter|digest|blog/i, 'Newsletter'],
    [/spam|junk|phish/i, 'Spam'],
    [/pub|promo|market|prospect/i, 'Prospection'],
  ]

  for (const [pattern, defaultName] of patterns) {
    if (pattern.test(lower)) {
      return DEFAULT_LABELS.findIndex((d) => d.name === defaultName)
    }
  }
  return -1
}

export default function ConfigureLabelsPage() {
  const router = useRouter()
  const [labels, setLabels] = useState<LabelItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const { gmailLabels } = await getOnboardingLabelsData()

        // Track which default labels have been matched
        const matchedDefaults = new Set<number>()
        const merged: LabelItem[] = []

        // Process Gmail labels
        for (const gl of gmailLabels) {
          const matchIdx = matchGmailToDefault(gl.name)
          const defaultLabel = matchIdx >= 0 ? DEFAULT_LABELS[matchIdx] : undefined
          if (matchIdx >= 0 && defaultLabel && !matchedDefaults.has(matchIdx)) {
            // Matched: use Gmail name but Kyrra's prompt
            matchedDefaults.add(matchIdx)
            merged.push({
              name: gl.name,
              description: defaultLabel.description,
              prompt: defaultLabel.prompt,
              color: defaultLabel.color,
              gmail_label_id: gl.id,
              gmail_label_name: gl.name,
              is_default: true,
              examples: [],
            })
          } else {
            // Unmatched Gmail label: show with empty description
            merged.push({
              name: gl.name,
              description: '',
              prompt: '',
              color: gl.color?.backgroundColor || '#455a64',
              gmail_label_id: gl.id,
              gmail_label_name: gl.name,
              is_default: false,
              examples: [],
            })
          }
        }

        // Add remaining Kyrra defaults that weren't matched
        for (let i = 0; i < DEFAULT_LABELS.length; i++) {
          if (!matchedDefaults.has(i)) {
            const d = DEFAULT_LABELS[i]
            if (!d) continue
            merged.push({
              name: d.name,
              description: d.description,
              prompt: d.prompt,
              color: d.color,
              gmail_label_id: null,
              gmail_label_name: null,
              is_default: d.is_default,
              examples: [],
            })
          }
        }

        setLabels(merged)
      } catch (err) {
        console.error('Failed to load label data:', err)
        // Fallback to defaults only
        setLabels(
          DEFAULT_LABELS.map((d) => ({
            name: d.name,
            description: d.description,
            prompt: d.prompt,
            color: d.color,
            gmail_label_id: null,
            gmail_label_name: null,
            is_default: d.is_default,
            examples: [],
          })),
        )
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  function removeLabel(index: number) {
    if (labels.length <= 2) return
    setLabels((prev) => prev.filter((_, i) => i !== index))
  }

  function updateDescription(index: number, desc: string) {
    setLabels((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, description: desc, prompt: desc } : l,
      ),
    )
  }

  function addLabel(name: string, description: string, color: string) {
    setLabels((prev) => [
      ...prev,
      {
        name,
        description,
        prompt: description,
        color,
        gmail_label_id: null,
        gmail_label_name: null,
        is_default: false,
        examples: [],
      },
    ])
    setShowModal(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const payload = labels.map((l, i) => ({
      name: l.name,
      description: l.description,
      prompt: l.prompt,
      color: l.color,
      gmail_label_id: l.gmail_label_id,
      gmail_label_name: l.gmail_label_name,
      is_default: l.is_default,
      position: i,
    }))

    const result = await saveLabelsConfig(payload)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8' }}>
        <p style={{ color: '#888', fontSize: '14px' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0c1a32', marginBottom: '8px' }}>
            Voici comment Kyrra va trier vos emails
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Personnalisez vos labels. Vous pourrez les modifier plus tard dans les r&eacute;glages.
          </p>
        </div>

        {/* Labels grid — 2 columns on desktop, 1 on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {labels.map((label, index) => (
            <LabelCard
              key={`${label.name}-${index}`}
              name={label.name}
              description={label.description}
              color={label.color}
              examples={label.examples}
              isGmailLabel={!!label.gmail_label_id}
              onRemove={() => removeLabel(index)}
              onEditDescription={(desc) => updateDescription(index, desc)}
            />
          ))}

          {/* Add label card */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              border: '2px dashed #ddd',
              padding: '16px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#aaa',
              fontSize: '14px',
              minHeight: '100px',
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span>
            Ajouter un label
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p style={{ color: '#c62828', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        {/* Save button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving || labels.length < 2}
            style={{
              padding: '12px 32px',
              background: saving ? '#999' : '#0c1a32',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Sauvegarde...' : "C'est parti \u2014 prot\u00e9ger ma bo\u00eete"}
          </button>
        </div>
      </div>

      {/* Add label modal */}
      {showModal && (
        <AddLabelModal
          onAdd={addLabel}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
