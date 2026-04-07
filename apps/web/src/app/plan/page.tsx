import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { planHighlights } from '@/lib/ui/mock-data';

const calendarCells = [
  ['1', '회복 런'],
  ['2', '휴식'],
  ['3', '템포'],
  ['4', '근력'],
  ['5', '롱런'],
  ['6', '휴식'],
  ['7', '조깅'],
];

export default function PlanPage() {
  return (
    <PageShell
      title="월간 플랜"
      description="한 달 계획은 한 화면에서 읽히고, 각 날짜 상태는 짧은 배지와 요약으로 바로 확인할 수 있게 설계합니다."
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">이번 달 완료율</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">68%</p>
        </article>
        <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">계획 수</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">14개</p>
        </article>
        <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">연속 달성</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">5일</p>
        </article>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">2026년 4월</h2>
            <p className="mt-2 text-sm text-slate-600">목표 대회에 맞춰 이번 달 계획을 세우고 상태를 기록하세요.</p>
          </div>
          <button className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">계획 추가</button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {calendarCells.map(([day, label], index) => (
            <div key={day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{day}</span>
                <StatusBadge tone={index % 3 === 0 ? 'success' : index % 3 === 1 ? 'neutral' : 'warning'}>
                  {index % 3 === 0 ? '완료' : index % 3 === 1 ? '예정' : '부분 완료'}
                </StatusBadge>
              </div>
              <p className="mt-4 text-sm text-slate-700">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {planHighlights.map((item) => (
          <article key={`${item.day}-${item.title}`} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.day}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">{item.title}</h3>
              </div>
              <StatusBadge tone={item.status === '완료' ? 'success' : item.status === '부분 완료' ? 'warning' : 'neutral'}>
                {item.status}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.meta}</p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
