'use client';

import { useLinkStatus } from 'next/link';

type LinkPendingCueProps = {
  label?: string;
  mode?: 'inline' | 'pill' | 'dot' | 'badge';
  className?: string;
};

export function LinkPendingCue({
  label = '여는 중…',
  mode = 'inline',
  className = '',
}: LinkPendingCueProps) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  if (mode === 'dot') {
    return <span className={`route-link-dot ${className}`.trim()} aria-hidden="true" />;
  }

  if (mode === 'pill') {
    return (
      <span className={`route-link-pill ${className}`.trim()}>
        <span className="route-link-dot" aria-hidden="true" />
        {label}
      </span>
    );
  }

  if (mode === 'badge') {
    return (
      <span className={`route-link-badge ${className}`.trim()}>
        <span className="route-link-dot" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <span className={`route-link-inline ${className}`.trim()}>
      <span className="route-link-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
