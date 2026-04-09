import { RouteLoadingChrome } from '@/components/ui/route-loading-chrome';

export default function Loading() {
  return (
    <RouteLoadingChrome>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <div className="space-y-4">
          <div className="route-loading-card h-8 w-52 rounded-2xl bg-white/90 shadow-sm" />
          <div className="route-loading-card h-4 w-72 rounded-full bg-white/70" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="route-loading-card h-40 rounded-[1.5rem] bg-white/85 shadow-sm" />
            <div className="route-loading-card h-40 rounded-[1.5rem] bg-white/70 shadow-sm" />
          </div>
        </div>
      </div>
    </RouteLoadingChrome>
  );
}
