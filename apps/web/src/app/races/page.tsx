import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { featuredRaces, filterGroups } from '@/lib/ui/mock-data';

export default function RacesPage() {
  return (
    <PageShell
      title="접수중인 대회"
      description="긴 설명보다 대회명, 날짜, 거리, 지역, 접수 상태를 먼저 보여주는 정보 중심 구조로 빠르게 탐색할 수 있게 설계합니다."
    >
      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">현재 조건</p>
            <p className="mt-1 text-sm text-slate-600">접수중 · 4월~5월 · 10km 이상 · 수도권 우선</p>
          </div>

          <div className="space-y-3">
            {Object.entries(filterGroups).map(([group, values]) => (
              <div key={group}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {values.map((value, index) => (
                    <button
                      key={value}
                      className={`rounded-full px-3 py-2 text-sm font-medium ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {featuredRaces.map((race) => (
          <Link key={race.id} href={`/races/${race.id}`} className="block rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{race.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{race.date}</p>
              </div>
              <StatusBadge tone={race.status === '마감임박' ? 'warning' : 'info'}>{race.status}</StatusBadge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">장소</p>
                <p className="mt-2 text-sm text-slate-700">{race.location}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">종목</p>
                <p className="mt-2 text-sm text-slate-700">{race.course}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">{race.note}</p>
              <span className="text-sm font-semibold text-[var(--brand)]">상세 보기</span>
            </div>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
