import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

export default function RaceNotFound() {
  return (
    <PageShell
      title="대회를 찾을 수 없습니다"
      description="요청한 대회 정보가 없거나 아직 수집되지 않았습니다. 목록으로 돌아가 다른 대회를 확인해보세요."
    >
      <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-base font-semibold text-slate-950">대회 정보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          수집이 아직 되지 않았거나, 잘못된 링크로 접근했을 수 있습니다.
        </p>
        <Link
          href="/races"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          대회 목록으로 이동
        </Link>
      </article>
    </PageShell>
  );
}
