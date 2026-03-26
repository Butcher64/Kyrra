import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0F',
        position: 'relative',
      }}>
        {/* Gradient band top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
          opacity: 0.3,
        }} />

        {/* Logo */}
        <div style={{
          fontSize: 72,
          fontWeight: 700,
          color: '#E8E8ED',
          marginBottom: 16,
        }}>
          Kyrra.
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 28,
          color: '#8B8B9E',
          marginBottom: 40,
        }}>
          Faites taire le bruit. Gardez l&apos;essentiel.
        </div>

        {/* Badge */}
        <div style={{
          fontSize: 18,
          color: '#555555',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Pare-feu cognitif anti-prospection
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
