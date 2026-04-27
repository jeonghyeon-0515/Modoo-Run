import Link from 'next/link';
import { getOptionalViewer } from '@/lib/auth/session';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { listCommunityPosts } from '@/lib/community/repository';
import { listRaces } from '@/lib/races/repository';
import { createCommunityPostAction } from './actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const categories = [
  { label: '전체', value: 'all' },
  { label: '자유게시판', value: 'free' },
  { label: '대회 준비', value: 'training' },
  { label: '후기', value: 'review' },
];

const starterPrompts = [
  {
    title: '첫 대회 전날 체크리스트',
    description: '번호표 수령, 이동, 복장, 에너지젤처럼 실전 준비를 한 번에 정리해보세요.',
  },
  {
    title: '이번 주 러닝 목표 공유',
    description: '거리 목표나 회복 목표를 짧게 남기면 다른 러너가 함께 응원할 수 있습니다.',
  },
  {
    title: '완주 후기와 코스 팁',
    description: '초반 페이스, 급수 포인트, 어려웠던 구간 같은 실전 정보를 남겨보세요.',
  },
];

function readValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getCategoryLabel(value: string) {
  return categories.find((category) => category.value === value)?.label ?? value;
}

function categoryHref(value: string) {
  return value === 'all' ? '/community' : `/community?category=${value}`;
}

function communityPageHref(category: string, page: number) {
  const params = new URLSearchParams();
  if (category !== 'all') {
    params.set('category', category);
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  const query = params.toString();
  return query ? `/community?${query}` : '/community';
}

export default async function CommunityPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = readValue(resolvedSearchParams.category) ?? 'all';
  const pageParam = Number(readValue(resolvedSearchParams.page) ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const viewerPromise = getOptionalViewer();
  const [viewer, postResult, races] = await Promise.all([
    viewerPromise,
    viewerPromise.then((resolvedViewer) =>
      listCommunityPosts({
        category: selectedCategory,
        viewerId: resolvedViewer?.id,
        page,
        limit: 20,
      }),
    ),
    listRaces({ registrationStatus: 'all', limit: 20 }),
  ]);

  const posts = postResult.items;
  const hasNextPage = postResult.hasNextPage;

  return (
    <PageShell
      title="러너들의 이야기"
      description="대회 준비, 훈련 기록, 완주 후기를 읽고 남길 수 있습니다."
      viewer={viewer}
    >
      <section className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">카테고리</p>
          <p className="text-xs font-medium text-slate-400">20개씩 보기</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={categoryHref(category.value)}
              className={`focus-ring pressable inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium ${
                selectedCategory === category.value ? 'public-chip-active' : 'public-chip-idle'
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-700">최근 글</p>
          <p className="text-sm font-semibold tabular-nums text-slate-900">{page}페이지</p>
        </div>
        {posts.length === 0 ? (
          <article className="rounded-[1.25rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-base font-semibold text-slate-950">등록된 글이 아직 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              첫 글로 준비 과정이나 완주 경험을 가볍게 남겨보세요.
            </p>
          </article>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="focus-ring interactive-card soft-surface block rounded-[1.1rem] border border-black/5 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="neutral">{getCategoryLabel(post.category)}</StatusBadge>
                    {post.status === 'hidden' ? <StatusBadge tone="warning">숨김</StatusBadge> : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{post.title}</h2>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{post.authorLabel}</span>
                <span className="tabular-nums">댓글 {post.comment_count}</span>
                <span className="tabular-nums">신고 {post.report_count}</span>
              </div>
            </Link>
          ))
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-slate-500">페이지 이동</p>
          <div className="flex flex-wrap gap-2">
            {page > 1 ? (
              <Link
                href={communityPageHref(selectedCategory, page - 1)}
                className="focus-ring pressable inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                이전
              </Link>
            ) : null}
            {hasNextPage ? (
              <Link
                href={communityPageHref(selectedCategory, page + 1)}
                className="focus-ring public-primary-button pressable inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold"
              >
                다음
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--secondary)]">직접 이야기 남기기</h2>
                <p className="mt-2 text-sm text-slate-600">준비 과정, 훈련 기록, 완주 후기를 바로 남길 수 있습니다.</p>
              </div>
              {viewer ? <StatusBadge tone="success">작성 가능</StatusBadge> : <StatusBadge tone="neutral">로그인 필요</StatusBadge>}
            </div>

            {viewer ? (
              <form action={createCommunityPostAction} className="mt-6 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">카테고리</span>
                    <select
                      name="category"
                      defaultValue={selectedCategory === 'all' ? 'free' : selectedCategory}
                      className="focus-ring mt-2 w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
                    >
                      {categories
                        .filter((category) => category.value !== 'all')
                        .map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">관련 대회</span>
                    <select
                      name="linkedRaceId"
                      defaultValue=""
                      className="focus-ring mt-2 w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
                    >
                      <option value="">선택 안 함</option>
                      {races.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">제목</span>
                    <input
                      name="title"
                      autoComplete="off"
                      spellCheck={false}
                      className="focus-ring mt-2 w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
                      placeholder="10km 첫 참가 전날 체크리스트"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">내용</span>
                    <textarea
                      name="content"
                      autoComplete="off"
                      spellCheck
                      className="focus-ring mt-2 min-h-36 w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
                      placeholder="준비 과정, 훈련 기록, 후기와 팁"
                    />
                  </label>

                  <button
                    type="submit"
                    className="focus-ring public-primary-button pressable inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    글 작성하기
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                로그인하면 대회 준비 경험이나 후기를 더 편하게 남길 수 있어요.{' '}
                <Link href="/login?next=/community" className="focus-ring inline-flex min-h-11 items-center rounded-md px-2 font-semibold text-[var(--brand)]">
                  로그인하기
                </Link>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:pt-1">
          <section className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffaf8] p-5">
            <h2 className="text-base font-semibold text-[var(--secondary)]">지금 나누기 좋은 주제</h2>
            <div className="mt-4 space-y-3">
              {starterPrompts.map((item) => (
                <div key={item.title} className="rounded-[1rem] bg-white p-4 shadow-sm ring-1 ring-[var(--line)]">
                  <p className="text-sm font-semibold text-[var(--secondary)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5">
            <h2 className="text-base font-semibold text-[var(--secondary)]">커뮤니티 흐름</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">글을 읽고, 관련 대회를 보고, 다시 준비 팁을 남기는 흐름이 끊기지 않도록 구성했습니다.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/races"
                className="focus-ring pressable inline-flex min-h-11 items-center rounded-full border border-[rgba(255,107,84,0.18)] bg-[#fff7f4] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)]"
              >
                대회 일정 보기
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </PageShell>
  );
}
