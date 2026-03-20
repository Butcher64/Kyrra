'use client'

import { useState } from 'react'

type Mode = 'strict' | 'normal' | 'permissive'

const MODES: { id: Mode; label: string; description: string; icon: string }[] = [
  { id: 'strict', label: 'Strict', description: 'Contacts connus uniquement', icon: '🔒' },
  { id: 'normal', label: 'Normal', description: 'Filtrage intelligent, équilibré', icon: '⚖️' },
  { id: 'permissive', label: 'Permissif', description: 'Plus d\'opportunités visibles', icon: '🔓' },
]

interface ExposureModePillsProps {
  currentMode: Mode
  onModeChange?: (mode: Mode) => void
}

export function ExposureModePills({ currentMode, onModeChange }: ExposureModePillsProps) {
  const [selected, setSelected] = useState(currentMode)
  const [showDescription, setShowDescription] = useState(false)

  const handleSelect = (mode: Mode) => {
    setSelected(mode)
    setShowDescription(true)
    onModeChange?.(mode)
    setTimeout(() => setShowDescription(false), 3000)
  }

  const selectedMode = MODES.find((m) => m.id === selected)!

  return (
    <div role="radiogroup" aria-label="Mode d'exposition">
      <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '100px', padding: '3px' }}>
        {MODES.map((mode) => (
          <button
            key={mode.id}
            role="radio"
            aria-checked={selected === mode.id}
            onClick={() => handleSelect(mode.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: selected === mode.id ? '#ffffff' : 'transparent',
              color: selected === mode.id ? '#1a1a18' : '#9ca3af',
              boxShadow: selected === mode.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {showDescription && (
        <p style={{
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
          marginTop: '8px',
          transition: 'opacity 0.3s',
        }}>
          {selectedMode.icon} {selectedMode.description}
        </p>
      )}
    </div>
  )
}
