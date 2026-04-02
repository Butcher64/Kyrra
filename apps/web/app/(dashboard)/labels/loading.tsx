export default function LabelsLoading() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-28 bg-[#e4e6ed] animate-pulse" />
        <div className="h-8 w-32 bg-[#e4e6ed] animate-pulse" />
      </div>

      {/* Labels grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#e4e6ed] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-[#e4e6ed] animate-pulse" />
              <div className="h-4 w-24 bg-[#e4e6ed] animate-pulse" />
            </div>
            <div className="h-3 w-full bg-[#e4e6ed] animate-pulse" />
            <div className="h-3 w-2/3 bg-[#e4e6ed] animate-pulse mt-1.5" />
          </div>
        ))}
      </div>
    </>
  )
}
