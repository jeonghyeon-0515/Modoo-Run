import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCommunityPost } from '@/lib/community/repository';
import { createCommunityCommentAction, reportCommunityPostAction, toggleCommunityPostHiddenAction } from '../actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ postId: string }>;

function getCategoryLabel(value: string) {
  if (value === 'training') return '대회 준비';
  if (value === 'review') return '후기';
  return '자유게시판';
}

export default async function CommunityDetailPage({ params }: { params: Params }) {
  const { postId } = await params;
  const post = await getCommunityPost(postId);

  if (!post) {
    notFound();
  }

  return (
    <PageShell
      title={post.title}
      description="제목, 본문, 댓글, 신고와 관리 동작이 하나의 흐름으로 이어지도록 단순한 구조를 유지합니다."
    >
      <div className="mb-4">
        <Link href="/community" className="text-sm font-semibold text-[var(--brand)]">
          ← 커뮤니티 목록으로 돌아가기
        </Link>
      </div>

      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <StatusBadge tone="neutral">{getCategoryLabel(post.category)}</StatusBadge>
        <p className="mt-3 text-sm text-slate-500">
          {post.authorLabel} · {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(post.created_at))}
        </p>
        {post.status === 'hidden' ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">이 글은 현재 숨김 상태입니다. 관리자 복원으로 다시 노출할 수 있습니다.</p>
        ) : null}
        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={reportCommunityPostAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="reason" value="운영 검토 요청" />
            <input type="hidden" name="description" value="사용자가 직접 신고 버튼을 눌렀습니다." />
            <button
              type="submit"
              className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
            >
              신고하기
            </button>
          </form>

          <form action={toggleCommunityPostHiddenAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="hidden" value={post.status === 'hidden' ? 'false' : 'true'} />
            <button
              type="submit"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {post.status === 'hidden' ? '숨김 해제' : '관리자 숨김'}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-semibold text-slate-950">댓글 작성</h2>
        <form action={createCommunityCommentAction} className="mt-4 space-y-3">
          <input type="hidden" name="postId" value={post.id} />
          <textarea
            name="content"
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
            placeholder="경험이나 팁을 댓글로 남겨보세요."
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            댓글 작성
          </button>
        </form>
      </section>

      <section className="mt-6 space-y-4">
        {post.comments.length === 0 ? (
          <article className="rounded-[1.75rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-base font-semibold text-slate-950">아직 댓글이 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">첫 댓글로 준비 경험이나 팁을 남겨보세요.</p>
          </article>
        ) : (
          post.comments.map((comment) => (
            <article key={comment.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-slate-900">{comment.authorLabel}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{comment.content}</p>
            </article>
          ))
        )}
      </section>
    </PageShell>
  );
}
