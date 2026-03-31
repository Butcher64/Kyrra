'use client'

import { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  Mail,
  Tag,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  user: { email: string; name?: string }
  pipelineStatus: 'active' | 'paused' | 'degraded'
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/emails', icon: Mail, label: 'Mes emails' },
  { href: '/labels', icon: Tag, label: 'Libellés' },
]

const pipelineRows = [
  { label: 'fingerprint', status: 'ok' },
  { label: 'llm gateway', status: 'ok' },
  { label: 'gmail sync', status: 'ok' },
]

export function Sidebar({ user, pipelineStatus, mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userInitial = (user.name ?? user.email)[0]?.toUpperCase() ?? 'K'
  const displayName = user.name ?? user.email.split('@')[0]

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[260px] flex flex-col z-50 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ backgroundColor: '#0c1a32' }}
      >
        <div className="flex flex-col h-full" style={{ position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div style={{ padding: '24px 24px 32px' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{ width: 22, height: 22, backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.7)' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.04em' }}>
                Kyrra
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 10, paddingLeft: 35 }}>
              <span style={{ width: 5, height: 5, backgroundColor: '#2dd881', borderRadius: '50%', boxShadow: '0 0 6px #2dd881', display: 'inline-block' }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
                actif
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1" style={{ padding: '0 12px' }}>
            <div style={{ padding: '0 12px', marginBottom: 12 }}>
              <span className="font-mono" style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}>
                Navigation
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 2 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className="flex items-center gap-3 no-underline"
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      transition: 'all 150ms',
                    }}
                  >
                    <item.icon size={16} strokeWidth={1.5} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Pipeline status */}
          <div style={{ padding: '0 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ padding: '16px 12px 8px' }}>
              <span className="font-mono" style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}>
                Pipeline
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 6, padding: '0 12px 16px' }}>
              {pipelineRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span style={{ width: 4, height: 4, backgroundColor: '#2dd881', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User section */}
          <div style={{ padding: '0 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3" style={{ padding: '16px 12px' }}>
              <Link
                href="/settings"
                className="flex items-center gap-3 flex-1 min-w-0 no-underline"
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}
                >
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{displayName}</p>
                  <p className="font-mono truncate" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{user.email}</p>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>&#9881;</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{ padding: 6, color: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                aria-label="Déconnexion"
              >
                <LogOut size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
