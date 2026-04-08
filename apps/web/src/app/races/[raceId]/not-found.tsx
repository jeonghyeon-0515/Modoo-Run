import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

export default function RaceNotFound() {
  return (
    <PageShell
      title="대회를 찾을 수 없습니다"
      description="찾으려던 대회가 아직 준비되지 않았거나 링크가 달라졌을 수 있어요. 다른 대회부터 둘러보세요."
    >
      <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-base font-semibold text-slate-950">대회 정보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          아직 정보가 덜 들어왔거나 링크가 바뀌었을 수 있어요.
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
