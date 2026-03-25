interface SidebarSectionProps {
  label: string
  children: React.ReactNode
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <div className="mb-2">
      {label && (
        <div className="px-4 mb-3 mt-6">
          <p className="text-[10px] font-label text-slate-500 tracking-widest uppercase">
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
