import { RouteLoadingChrome } from '@/components/ui/route-loading-chrome';

export default function RaceDetailLoading() {
  return (
    <RouteLoadingChrome>
      <div className="space-y-6">
        <div className="route-loading-card h-12 w-48 rounded-full bg-white/90 shadow-sm" />

        <section className="hero-shell overflow-hidden rounded-[1.75rem] p-6 sm:rounded-[2rem] sm:p-8">
          <div className="space-y-4">
            <div className="route-loading-card h-5 w-44 rounded-full bg-white/20" />
            <div className="route-loading-card h-10 w-72 rounded-full bg-white/20" />
            <div className="route-loading-card h-4 w-80 rounded-full bg-white/15" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="route-loading-card h-24 rounded-[1.1rem] bg-white/10 ring-1 ring-white/10" />
              ))}
            </div>
          </div>
        </section>

        <div className="route-loading-card h-[320px] rounded-[1.5rem] bg-white/90 shadow-sm ring-1 ring-black/5" />
      </div>
    </RouteLoadingChrome>
  );
}
