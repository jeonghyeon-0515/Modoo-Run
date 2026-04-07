import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

export default function CommunityPostNotFound() {
  return (
    <PageShell
      title="게시글을 찾을 수 없습니다"
      description="삭제되었거나 존재하지 않는 게시글입니다. 커뮤니티 목록으로 돌아가 다른 글을 확인해보세요."
    >
      <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-base font-semibold text-slate-950">게시글 정보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          이미 삭제되었거나 잘못된 링크일 수 있습니다.
        </p>
        <Link
          href="/community"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          커뮤니티 목록으로 이동
        </Link>
      </article>
    </PageShell>
  );
}
