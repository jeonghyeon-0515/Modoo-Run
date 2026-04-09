import { ReactNode } from 'react';

export function RouteLoadingChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="route-loading-overlay" aria-hidden="true" />
      <div className="route-progress opacity-100" aria-hidden="true" />
      <div className="route-toast translate-y-0 opacity-100" aria-live="polite" aria-atomic="true">
        <span className="route-toast-dot" />
        페이지 여는 중…
      </div>
      {children}
    </>
  );
}
