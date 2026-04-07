import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { raceDetail } from '@/lib/ui/mock-data';

export default function RaceDetailPage() {
  return (
    <PageShell
      title={raceDetail.title}
      description="핵심 정보는 바로 읽히고, 필요한 상세 설명은 아래에서 차분하게 확인할 수 있는 구조를 목표로 합니다."
    >
      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{raceDetail.date}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{raceDetail.title}</h2>
          </div>
          <StatusBadge tone="info">{raceDetail.status}</StatusBadge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ['종목', raceDetail.course],
            ['지역', raceDetail.region],
            ['장소', raceDetail.location],
            ['주최', raceDetail.organizer],
            ['접수기간', raceDetail.registration],
            ['수집 시각', raceDetail.fetchedAt],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-semibold text-slate-950">대회 소개</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{raceDetail.intro}</p>
        </article>

        <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-semibold text-slate-950">다음 행동</h3>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/plan" className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]">
              이 대회로 계획 만들기
            </Link>
            <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              관심 대회 저장
            </button>
            <a href={raceDetail.homepage} className="text-center text-sm font-semibold text-[var(--brand)]">
              원문 보기
            </a>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
