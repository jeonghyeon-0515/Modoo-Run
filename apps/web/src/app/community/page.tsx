import Link from 'next/link';
import { getOptionalViewer } from '@/lib/auth/session';
import { PageShell } from '@/components/layout/page-shell';
import { PartnerInquiryCard } from '@/components/monetization/partner-inquiry-card';
import { PromoSlotCard } from '@/components/monetization/promo-slot-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { listCommunityPosts } from '@/lib/community/repository';
import { getCommunityPromoSlots } from '@/lib/monetization/public-catalog';
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
  const activeCategoryCount = new Set(posts.map((post) => post.category)).size;
  const promoSlots = getCommunityPromoSlots();

  return (
    <PageShell
      title="러너들의 이야기"
      description="대회 준비, 훈련 기록, 완주 후기를 읽고 작성할 수 있습니다."
      viewer={viewer}
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[1.1rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">지금 보이는 글</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{posts.length.toLocaleString('ko-KR')}개</p>
          <p className="mt-2 text-sm text-slate-500">선택한 주제의 글만 표시합니다.</p>
        </article>
        <article className="rounded-[1.1rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">활성 카테고리</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{activeCategoryCount}개</p>
          <p className="mt-2 text-sm text-slate-500">읽을 주제를 골라 볼 수 있습니다.</p>
        </article>
        <article className="rounded-[1.1rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">글 남기기</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{viewer ? '가능' : '로그인 필요'}</p>
          <p className="mt-2 text-sm text-slate-500">{viewer ? '바로 아래 작성 영역에서 새 글을 남길 수 있습니다.' : '로그인 후 직접 글을 남길 수 있습니다.'}</p>
        </article>
      </section>

      <section className="mt-6 rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">카테고리</p>
            <p className="mt-1 text-sm text-slate-500">관심 있는 주제부터 먼저 골라 피드를 빠르게 좁혀보세요.</p>
          </div>
          <p className="text-xs font-medium text-slate-400">최근 글 20개씩 표시</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={categoryHref(category.value)}
              className={`focus-ring inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
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
          <p className="text-sm text-slate-600">최근 글부터 20개씩 먼저 보여줍니다.</p>
          <p className="text-sm font-semibold text-slate-900">{page}페이지</p>
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
              className="focus-ring block rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="neutral">{getCategoryLabel(post.category)}</StatusBadge>
                    {post.status === 'hidden' ? <StatusBadge tone="warning">숨김</StatusBadge> : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{post.title}</h2>
                </div>
                <span className="text-sm font-medium text-slate-500">보기</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-2">{post.content}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{post.authorLabel}</span>
                <span>댓글 {post.comment_count}</span>
                <span>신고 {post.report_count}</span>
              </div>
            </Link>
          ))
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-slate-500">이전 글도 페이지 단위로 계속 볼 수 있습니다.</p>
          <div className="flex flex-wrap gap-2">
            {page > 1 ? (
              <Link
                href={communityPageHref(selectedCategory, page - 1)}
                className="focus-ring inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                이전 페이지
              </Link>
            ) : null}
            {hasNextPage ? (
              <Link
                href={communityPageHref(selectedCategory, page + 1)}
                className="focus-ring inline-flex min-h-11 items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                다음 페이지
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">직접 이야기 남기기</h2>
                <p className="mt-2 text-sm text-slate-600">준비 과정, 훈련 기록, 완주 후기를 짧게라도 바로 남길 수 있습니다.</p>
              </div>
              {viewer ? <StatusBadge tone="success">작성 가능</StatusBadge> : <StatusBadge tone="neutral">로그인 필요</StatusBadge>}
            </div>

            {viewer ? (
              <form action={createCommunityPostAction} className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">카테고리</span>
                    <select
                      name="category"
                      defaultValue={selectedCategory === 'all' ? 'free' : selectedCategory}
                      className="focus-ring mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
                      className="focus-ring mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
                      className="focus-ring mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      placeholder="10km 첫 참가 전날 체크리스트"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">내용</span>
                    <textarea
                      name="content"
                      autoComplete="off"
                      spellCheck
                      className="focus-ring mt-2 min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      placeholder="준비 과정, 훈련 기록, 후기와 팁"
                    />
                  </label>

                  <button
                    type="submit"
                    className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    글 작성하기
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                로그인하면 대회 준비 경험이나 후기를 더 편하게 남길 수 있어요.{' '}
                <Link href="/login?next=/community" className="focus-ring inline-flex min-h-11 items-center rounded-md px-2 font-semibold text-[var(--brand)]">
                  로그인하기
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-slate-950">지금 나누기 좋은 주제</h2>
            <div className="mt-4 space-y-3">
              {starterPrompts.map((item) => (
                <div key={item.title} className="rounded-[1rem] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:pt-1">
          <section className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-base font-semibold text-slate-900">함께 보면 좋은 정보</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">피드를 다 본 뒤 참고할 수 있도록 제휴/안내 영역은 아래에 모았습니다.</p>
          </section>
          <section className="space-y-4">
            {promoSlots.map((slot) => (
              <PromoSlotCard
                key={slot.id}
                badge={slot.badge}
                title={slot.title}
                description={slot.description}
                href={slot.href}
                ctaLabel={slot.ctaLabel}
                external={slot.external}
                disclosure={slot.disclosure}
                compact
              />
            ))}
          </section>
          <PartnerInquiryCard sourcePath="/community" compact />
        </aside>
      </section>
    </PageShell>
  );
}
