export default function EmailsLoading() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-[#e4e6ed] animate-pulse" />
        <div className="h-8 w-48 bg-[#e4e6ed] animate-pulse" />
      </div>

      {/* Email list skeleton */}
      <div className="bg-white border border-[#e4e6ed]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-[#e4e6ed]"
          >
            <div className="w-[3px] h-10 bg-[#e4e6ed] animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-1/3 bg-[#e4e6ed] animate-pulse" />
              <div className="h-3 w-2/3 bg-[#e4e6ed] animate-pulse mt-1.5" />
            </div>
            <div className="h-5 w-20 bg-[#e4e6ed] animate-pulse" />
            <div className="h-3 w-8 bg-[#e4e6ed] animate-pulse" />
          </div>
        ))}
      </div>
    </>
  )
}
