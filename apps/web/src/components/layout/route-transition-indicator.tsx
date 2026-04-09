'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const MIN_VISIBLE_MS = 320;
const SAFETY_TIMEOUT_MS = 8000;

export function RouteTransitionIndicator() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef(0);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${nextUrl.pathname}${nextUrl.search}`;
      if (current === next) return;

      startedAtRef.current = Date.now();
      setPending(true);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timeout = window.setTimeout(() => setPending(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [pathname, pending]);

  useEffect(() => {
    if (!pending) return;

    const timeout = window.setTimeout(() => setPending(false), SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  if (!pending) {
    return null;
  }

  return (
    <>
      <div className="route-progress opacity-100" aria-hidden="true" />
      <div className="route-toast translate-y-0 opacity-100" aria-live="polite" aria-atomic="true">
        <span className="route-toast-dot" />
        페이지 여는 중…
      </div>
    </>
  );
}
