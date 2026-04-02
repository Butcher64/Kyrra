'use client'

interface LabelCardProps {
  name: string
  description: string
  color: string
  examples: string[]
  isGmailLabel: boolean
  onRemove: () => void
  onEditDescription: (desc: string) => void
}

export function LabelCard({ name, description, color, examples, isGmailLabel, onRemove, onEditDescription }: LabelCardProps) {
  return (
    <div style={{ border: '1px solid #e0e0e0', padding: '16px', position: 'relative', background: 'white' }}>
      <button onClick={onRemove} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '14px' }}>&#x2715;</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{name}</span>
        {isGmailLabel && <span style={{ fontSize: '10px', color: '#888', background: '#f0f0f0', padding: '1px 6px' }}>Gmail</span>}
      </div>
      <input type="text" value={description} onChange={(e) => onEditDescription(e.target.value)} placeholder="D&eacute;crivez ce que ce label contient..." style={{ width: '100%', border: '1px solid #eee', padding: '6px 8px', fontSize: '12px', color: '#555', marginBottom: '8px', outline: 'none', boxSizing: 'border-box' }} />
      {examples.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {examples.map((ex, i) => <div key={i} style={{ background: '#f8f8f8', padding: '4px 8px', fontSize: '11px', color: '#666' }}>{ex}</div>)}
        </div>
      )}
    </div>
  )
}
