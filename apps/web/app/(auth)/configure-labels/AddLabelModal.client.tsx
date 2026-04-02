'use client'
import { useState } from 'react'

interface AddLabelModalProps {
  onAdd: (name: string, description: string, color: string) => void
  onClose: () => void
}

const COLORS = ['#2e7d32', '#1565c0', '#00838f', '#e65100', '#f57f17', '#c62828', '#6a1b9a', '#455a64', '#37474f']

export function AddLabelModal({ onAdd, onClose }: AddLabelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#455a64')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'white', padding: '24px', width: '400px', maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Ajouter un label</h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fournisseurs" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="D&eacute;crivez les emails qui iront dans ce label..." rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Couleur</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, border: color === c ? '2px solid #000' : '2px solid transparent', cursor: 'pointer' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => { if (name.trim()) onAdd(name.trim(), description.trim(), color) }} disabled={!name.trim()} style={{ padding: '8px 16px', background: name.trim() ? '#0c1a32' : '#ccc', color: 'white', border: 'none', cursor: name.trim() ? 'pointer' : 'default' }}>Ajouter</button>
        </div>
      </div>
    </div>
  )
}
