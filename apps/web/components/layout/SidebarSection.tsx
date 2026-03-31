interface SidebarSectionProps {
  label: string
  children: React.ReactNode
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <div className="mb-2">
      {label && (
        <div className="px-3 mb-3 mt-6">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/15">
            {label}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  )
}
