'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveProfile } from '../actions/configure-profile'

const SECTORS = [
  'Tech / SaaS / Logiciel',
  'Agence digitale / Marketing',
  'Conseil / Consulting',
  'E-commerce / Retail',
  'Finance / Assurance',
  'Immobilier',
  'Santé / Pharma',
  'Industrie / Manufacturing',
  'Éducation / Formation',
  'Juridique / Avocat',
  'Média / Communication',
  'RH / Recrutement',
  'Autre',
]

const ROLES = [
  { value: 'CEO', label: 'Dirigeant / CEO / Fondateur' },
  { value: 'DRH', label: 'DRH / Responsable RH' },
  { value: 'DSI', label: 'DSI / CTO / Responsable IT' },
  { value: 'COMMERCIAL', label: 'Directeur Commercial / Sales' },
  { value: 'DAF', label: 'DAF / Responsable Finance' },
  { value: 'MARKETING', label: 'Directeur Marketing / CMO' },
  { value: 'AUTRE', label: 'Autre' },
]

const PROSPECTION_EXEMPLES_UTILES = [
  'Outils SaaS pour mon métier',
  'Prestataires dans mon secteur',
  'Événements / conférences professionnelles',
  'Offres de formation',
  'Partenariats stratégiques',
  'Solutions de financement',
]

const PROSPECTION_EXEMPLES_NON = [
  'Cold emails de commerciaux inconnus',
  'Offres de SEO / création de site web',
  'Propositions de "growth hacking"',
  'Invitations à des webinars génériques',
  'Offres d\'achat de leads / données',
  'Propositions de partenariat non ciblées',
]

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  background: 'white',
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: 600 as const,
  display: 'block' as const,
  marginBottom: '6px',
  color: '#333',
}

const hintStyle = {
  fontSize: '11px',
  color: '#999',
  marginTop: '4px',
}

export default function ConfigureProfilePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState('CEO')
  const [sector, setSector] = useState('')
  const [companyDesc, setCompanyDesc] = useState('')
  const [prospectionUtile, setProspectionUtile] = useState('')
  const [prospectionNon, setProspectionNon] = useState('')
  const [interests, setInterests] = useState('')
  const [selectedUtiles, setSelectedUtiles] = useState<Set<string>>(new Set())
  const [selectedNon, setSelectedNon] = useState<Set<string>>(new Set())

  function toggleChip(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  async function handleSave() {
    setSaving(true)

    // Combine chips + text for prospection descriptions
    const utilesFull = [...selectedUtiles, prospectionUtile].filter(Boolean).join('. ')
    const nonFull = [...selectedNon, prospectionNon].filter(Boolean).join('. ')

    const result = await saveProfile({
      user_role: role,
      sector,
      company_description: companyDesc,
      prospection_utile: utilesFull,
      prospection_non_sollicitee: nonFull,
      interests,
    })

    if (result.success) {
      router.push('/configure-labels')
    } else {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0c1a32', marginBottom: '8px' }}>
            Aidez Kyrra à comprendre vos emails
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Ces informations aident l'IA à distinguer ce qui est pertinent pour vous.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Role */}
          <div>
            <label style={labelStyle}>Votre rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={fieldStyle}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label style={labelStyle}>Secteur d'activité</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} style={fieldStyle}>
              <option value="">Sélectionnez votre secteur</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Company description */}
          <div>
            <label style={labelStyle}>Décrivez votre entreprise en une phrase</label>
            <input
              value={companyDesc}
              onChange={(e) => setCompanyDesc(e.target.value)}
              placeholder="Ex: Agence de développement web spécialisée en SaaS B2B"
              style={fieldStyle}
            />
            <p style={hintStyle}>L'IA utilise cette info pour juger la pertinence des emails commerciaux.</p>
          </div>

          {/* Prospection utile */}
          <div>
            <label style={labelStyle}>Quels types de prospection pourraient vous intéresser ?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {PROSPECTION_EXEMPLES_UTILES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => toggleChip(selectedUtiles, ex, setSelectedUtiles)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    border: selectedUtiles.has(ex) ? '1px solid #2e7d32' : '1px solid #ddd',
                    background: selectedUtiles.has(ex) ? '#e8f5e9' : 'white',
                    color: selectedUtiles.has(ex) ? '#2e7d32' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
            <input
              value={prospectionUtile}
              onChange={(e) => setProspectionUtile(e.target.value)}
              placeholder="Autre chose ? Décrivez librement..."
              style={fieldStyle}
            />
          </div>

          {/* Prospection non sollicitée */}
          <div>
            <label style={labelStyle}>Quels types de prospection vous agacent ?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {PROSPECTION_EXEMPLES_NON.map((ex) => (
                <button
                  key={ex}
                  onClick={() => toggleChip(selectedNon, ex, setSelectedNon)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    border: selectedNon.has(ex) ? '1px solid #c62828' : '1px solid #ddd',
                    background: selectedNon.has(ex) ? '#fce4ec' : 'white',
                    color: selectedNon.has(ex) ? '#c62828' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
            <input
              value={prospectionNon}
              onChange={(e) => setProspectionNon(e.target.value)}
              placeholder="Autre chose ? Décrivez librement..."
              style={fieldStyle}
            />
          </div>

          {/* Interests */}
          <div>
            <label style={labelStyle}>Centres d'intérêt professionnels (optionnel)</label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Ex: IA, automatisation, no-code, fundraising, recrutement tech"
              style={fieldStyle}
            />
            <p style={hintStyle}>Aide l'IA à repérer les emails qui pourraient vous intéresser.</p>
          </div>
        </div>

        {/* Save */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={handleSave}
            disabled={saving || !sector}
            style={{
              padding: '12px 32px',
              background: saving || !sector ? '#999' : '#0c1a32',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving || !sector ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Enregistrement...' : 'Continuer — configurer vos labels'}
          </button>
        </div>
      </div>
    </div>
  )
}
