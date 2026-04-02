export default function DashboardLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-6 w-48 bg-[#e4e6ed] animate-pulse" />
          <div className="h-3 w-64 bg-[#e4e6ed] animate-pulse mt-2" />
        </div>
        <div className="flex items-center gap-5">
          <div className="h-8 w-12 bg-[#e4e6ed] animate-pulse" />
          <div className="w-px h-7 bg-[#e4e6ed]" />
          <div className="h-8 w-16 bg-[#e4e6ed] animate-pulse" />
        </div>
      </div>

      {/* 2-column grid skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Weekly overview */}
        <div className="bg-white border border-[#e4e6ed] p-6">
          <div className="h-3 w-24 bg-[#e4e6ed] animate-pulse mb-4" />
          <div className="flex gap-6 mb-6">
            <div className="h-8 w-16 bg-[#e4e6ed] animate-pulse" />
            <div className="h-8 w-16 bg-[#e4e6ed] animate-pulse" />
            <div className="h-8 w-16 bg-[#e4e6ed] animate-pulse" />
          </div>
          <div className="flex items-end gap-2 h-[80px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-[#e4e6ed] animate-pulse"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>

        {/* Featured label card */}
        <div className="bg-white border border-[#e4e6ed]">
          <div className="px-6 py-4 border-b border-[#e4e6ed]">
            <div className="h-4 w-24 bg-[#e4e6ed] animate-pulse" />
          </div>
          <div className="divide-y divide-[#e4e6ed]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 px-6 py-3.5">
                <div className="w-[3px] h-10 bg-[#e4e6ed] animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-[#e4e6ed] animate-pulse" />
                  <div className="h-3 w-12 bg-[#e4e6ed] animate-pulse mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section skeleton */}
      <div className="bg-white border border-[#e4e6ed]">
        <div className="px-6 py-4 border-b border-[#e4e6ed]">
          <div className="h-4 w-32 bg-[#e4e6ed] animate-pulse" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#e4e6ed]">
          {[1, 2, 3].map((col) => (
            <div key={col} className="divide-y divide-[#e4e6ed]">
              <div className="px-6 py-2.5">
                <div className="h-3 w-16 bg-[#e4e6ed] animate-pulse" />
              </div>
              {[1, 2].map((row) => (
                <div key={row} className="flex items-start gap-3 px-6 py-3.5">
                  <div className="w-[3px] h-8 bg-[#e4e6ed] animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3.5 w-3/4 bg-[#e4e6ed] animate-pulse" />
                    <div className="h-2.5 w-10 bg-[#e4e6ed] animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
