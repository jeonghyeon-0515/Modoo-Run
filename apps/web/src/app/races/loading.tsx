export default function RacesLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.4rem] bg-white/90 p-4 shadow-sm ring-1 ring-black/5">
        <div className="route-loading-card h-5 w-40 rounded-full bg-slate-100" />
        <div className="mt-3 route-loading-card h-4 w-64 rounded-full bg-slate-100" />
        <div className="mt-4 flex gap-2">
          <div className="route-loading-card h-9 w-20 rounded-full bg-slate-100" />
          <div className="route-loading-card h-9 w-20 rounded-full bg-slate-100" />
          <div className="route-loading-card h-9 w-20 rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[1.25rem] bg-white/90 p-4 shadow-sm ring-1 ring-black/5">
            <div className="route-loading-card h-4 w-28 rounded-full bg-slate-100" />
            <div className="mt-3 route-loading-card h-6 w-56 rounded-full bg-slate-100" />
            <div className="mt-3 route-loading-card h-4 w-48 rounded-full bg-slate-100" />
            <div className="mt-2 route-loading-card h-4 w-40 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
