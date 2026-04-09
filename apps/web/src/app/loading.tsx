export default function Loading() {
  return (
    <>
      <div className="route-loading-overlay" aria-hidden="true" />
      <div className="route-progress opacity-100" aria-hidden="true" />
      <div className="route-toast translate-y-0 opacity-100" aria-live="polite" aria-atomic="true">
        <span className="route-toast-dot" />
        페이지 여는 중…
      </div>
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
    </>
  );
}
