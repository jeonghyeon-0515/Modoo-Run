export default function Loading() {
  return (
    <>
      <div className="route-progress opacity-100" aria-hidden="true" />
      <div className="route-toast translate-y-0 opacity-100" aria-live="polite" aria-atomic="true">
        <span className="route-toast-dot" />
        페이지 여는 중…
      </div>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-white/80 shadow-sm" />
      </div>
    </>
  );
}
