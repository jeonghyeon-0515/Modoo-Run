import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { communityPosts, featuredRaces, planHighlights, summaryStats } from '@/lib/ui/mock-data';

const toneMap = {
  info: 'info',
  warning: 'warning',
  neutral: 'neutral',
} as const;

export default function Home() {
  return (
    <PageShell
      title="대회 탐색부터 월간 플랜까지"
      description="접수중인 마라톤 대회를 더 보기 쉽게 찾고, 목표 대회를 기준으로 계획을 세우고, 매일의 달성을 기록하며, 다른 러너와 준비 과정을 나누는 흐름을 하나로 연결합니다."
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {summaryStats.map((item) => (
          <article key={item.label} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <div className="mt-3 flex items-center justify-between">
              <strong className="text-3xl font-bold text-slate-950">{item.value}</strong>
              <StatusBadge tone={toneMap[item.tone]}>{item.label}</StatusBadge>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            차분하고 실용적인 러닝 경험
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            접수중인 대회부터 월간 훈련 계획까지,
            <br className="hidden sm:block" /> 한 곳에서 관리하세요.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            이번 달 목표를 세우고, 매일의 달성을 차곡차곡 쌓아보세요. 중요한 정보는 빠르게 읽히고,
            다음 행동은 자연스럽게 이어지도록 설계합니다.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/races" className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]">
            대회 둘러보기
          </Link>
          <Link href="/plan" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            플랜 만들기
          </Link>
          <Link href="/community" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            러너 이야기 보기
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">접수중인 대회</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">지금 접수 가능한 마라톤 대회를 지역, 거리, 월별로 쉽게 찾아보세요.</p>
            </div>
            <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">더 보기</Link>
          </div>
          <div className="mt-5 space-y-4">
            {featuredRaces.map((race) => (
              <Link key={race.id} href={`/races/${race.id}`} className="block rounded-[1.25rem] border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{race.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{race.date}</p>
                  </div>
                  <StatusBadge tone={race.status === '마감임박' ? 'warning' : 'info'}>{race.status}</StatusBadge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>{race.location}</p>
                  <p>{race.course}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{race.note}</p>
              </Link>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">월간 플랜</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">목표 대회에 맞춰 훈련 계획을 세우고 날짜별로 실천 여부를 기록하세요.</p>
              </div>
              <Link href="/plan" className="text-sm font-semibold text-[var(--brand)]">보기</Link>
            </div>
            <div className="mt-5 space-y-3">
              {planHighlights.map((item) => (
                <div key={`${item.day}-${item.title}`} className="rounded-[1.25rem] border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.day}</p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-950">{item.title}</h3>
                    </div>
                    <StatusBadge tone={item.status === '완료' ? 'success' : item.status === '부분 완료' ? 'warning' : 'neutral'}>
                      {item.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.meta}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">러너 커뮤니티</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">대회 준비, 훈련 기록, 후기와 팁을 다른 러너와 나눠보세요.</p>
              </div>
              <Link href="/community" className="text-sm font-semibold text-[var(--brand)]">더 보기</Link>
            </div>
            <div className="mt-5 space-y-3">
              {communityPosts.slice(0, 2).map((post) => (
                <Link key={post.id} href={`/community/${post.id}`} className="block rounded-[1.25rem] border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                  <StatusBadge tone="neutral">{post.category}</StatusBadge>
                  <h3 className="mt-3 text-sm font-semibold text-slate-950">{post.title}</h3>
                  <p className="mt-2 text-xs text-slate-500">{post.author} · {post.meta}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
