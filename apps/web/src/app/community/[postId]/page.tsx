import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOptionalViewer } from '@/lib/auth/session';
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
  const [post, viewer] = await Promise.all([getCommunityPost(postId), getOptionalViewer()]);

  if (!post) {
    notFound();
  }

  return (
    <PageShell
      title={post.title}
      description="글을 읽고 댓글을 남기거나 필요한 경우 신고할 수 있습니다."
    >
      <div className="mb-4">
        <Link href="/community" className="text-sm font-semibold text-[var(--brand)]">
          ← 커뮤니티 목록으로 돌아가기
        </Link>
      </div>

      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">{getCategoryLabel(post.category)}</StatusBadge>
          {post.status === 'hidden' ? <StatusBadge tone="warning">숨김 상태</StatusBadge> : null}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {post.authorLabel} · {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(post.created_at))}
        </p>
        {post.status === 'hidden' ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">이 글은 현재 숨김 상태입니다. 운영자가 다시 공개할 수 있습니다.</p>
        ) : null}
        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {viewer ? (
            <form action={reportCommunityPostAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="reason" value="운영 검토 요청" />
              <input type="hidden" name="description" value="사용자가 직접 신고 버튼을 눌렀습니다." />
              <button
                type="submit"
                className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                이 글 신고하기
              </button>
            </form>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(`/community/${post.id}`)}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              로그인하고 의견 남기기
            </Link>
          )}

          {viewer?.isStaff ? (
            <form action={toggleCommunityPostHiddenAction}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="hidden" value={post.status === 'hidden' ? 'false' : 'true'} />
              <button
                type="submit"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {post.status === 'hidden' ? '다시 보이기' : '잠시 가리기'}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-semibold text-slate-950">댓글 남기기</h2>
        {viewer ? (
          <form action={createCommunityCommentAction} className="mt-4 space-y-3">
            <input type="hidden" name="postId" value={post.id} />
            <textarea
              name="content"
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              placeholder="공감한 점이나 직접 해본 팁을 편하게 남겨보세요."
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              댓글 남기기
            </button>
          </form>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            댓글 남기기는 로그인 후 사용할 수 있습니다.{' '}
            <Link href={`/login?next=${encodeURIComponent(`/community/${post.id}`)}`} className="font-semibold text-[var(--brand)]">
              로그인하기
            </Link>
          </div>
        )}
      </section>

      <section className="mt-6 space-y-4">
        {post.comments.length === 0 ? (
          <article className="rounded-[1.75rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-base font-semibold text-slate-950">아직 댓글이 없어요.</p>
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
