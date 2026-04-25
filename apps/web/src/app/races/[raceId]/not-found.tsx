import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

export default function RaceNotFound() {
  return (
    <PageShell
      title="대회를 찾을 수 없습니다"
      description="요청한 대회 정보를 찾을 수 없습니다. 링크가 변경됐거나 아직 수집되지 않았을 수 있습니다."
    >
      <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-base font-semibold text-slate-950">대회 정보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          대회 정보가 아직 수집되지 않았거나 링크가 변경됐을 수 있습니다.
        </p>
        <Link
          href="/races"
          className="focus-ring pressable mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
        >
          대회 목록으로 이동
        </Link>
      </article>
    </PageShell>
  );
}
