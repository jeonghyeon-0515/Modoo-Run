import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { communityDetail } from '@/lib/ui/mock-data';

export default function CommunityDetailPage() {
  return (
    <PageShell
      title={communityDetail.title}
      description="게시판은 단순하지만 읽기 편해야 합니다. 제목, 본문, 관련 대회, 댓글 순서로 빠르게 읽히는 구조를 우선합니다."
    >
      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <StatusBadge tone="neutral">{communityDetail.category}</StatusBadge>
        <p className="mt-3 text-sm text-slate-500">{communityDetail.author} · {communityDetail.createdAt}</p>
        <p className="mt-5 text-sm leading-7 text-slate-700">{communityDetail.content}</p>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">댓글</h2>
          <button className="text-sm font-semibold text-[var(--brand)]">신고</button>
        </div>
        <div className="mt-4 space-y-3">
          {communityDetail.comments.map((comment, index) => (
            <article key={`${comment.author}-${index}`} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{comment.content}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
