interface SidebarSectionProps {
  label: string
  children: React.ReactNode
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--sidebar-fg)]/50">
        {label}
      </div>
      <nav className="flex flex-col gap-0.5">
        {children}
      </nav>
    </div>
  )
}
