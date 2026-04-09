'use client';

import { useLinkStatus } from 'next/link';

type LinkPendingOverlayProps = {
  label?: string;
};

export function LinkPendingOverlay({ label = '불러오는 중…' }: LinkPendingOverlayProps) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="route-link-overlay" aria-hidden="true">
      <span className="route-link-spinner" />
      <span>{label}</span>
    </div>
  );
}
