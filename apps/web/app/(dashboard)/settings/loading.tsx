export default function SettingsLoading() {
  return (
    <>
      {/* Header */}
      <div className="h-6 w-28 bg-[#e4e6ed] animate-pulse mb-6" />

      {/* Settings sections skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((section) => (
          <div key={section} className="bg-white border border-[#e4e6ed] p-6">
            <div className="h-4 w-32 bg-[#e4e6ed] animate-pulse mb-4" />
            <div className="h-3 w-full bg-[#e4e6ed] animate-pulse" />
            <div className="h-3 w-3/4 bg-[#e4e6ed] animate-pulse mt-2" />
            <div className="h-10 w-48 bg-[#e4e6ed] animate-pulse mt-4" />
          </div>
        ))}
      </div>
    </>
  )
}
