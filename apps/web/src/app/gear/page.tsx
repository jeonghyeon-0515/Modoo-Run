import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { affiliateGuideSections } from '@/lib/monetization/public-catalog';

export default function GearGuidePage() {
  return (
    <PageShell
      title="러닝 준비물 가이드"
      description="첫 대회 준비물, 기록 장비, 러닝화 컬렉션처럼 자주 찾는 주제를 공개 페이지로 정리했습니다."
      compactIntro
    >
      <section className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="disclosure">광고 · 제휴 안내</StatusBadge>
          <p className="text-sm font-semibold text-slate-900">일부 링크는 스폰서 또는 제휴 링크입니다.</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          러너에게 실제로 도움이 되는 공개 가이드만 먼저 보여주고, 외부 링크는 모두 명확하게 표기합니다.
        </p>
      </section>

      <section className="mt-6 space-y-5">
        {affiliateGuideSections.map((section) => (
          <article key={section.title} className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {section.resources.map((resource) => (
                <a
                  key={resource.title}
                  href={`/out/partner/${resource.targetKind}?source=${encodeURIComponent('/gear')}&destinationKey=${encodeURIComponent(resource.destinationKey)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="disclosure">{resource.label}</StatusBadge>
                    <p className="text-base font-semibold text-slate-950">{resource.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
                  <p className="mt-4 text-sm font-semibold text-[var(--public-accent-strong)]">{resource.ctaLabel} →</p>
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-semibold text-slate-950">운영 문의</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          featured listing, 스폰서 노출, 제휴 가이드 편성 문의는 운영팀이 직접 확인합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/advertise"
            className="public-primary-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          >
            광고 · 제휴 문의하기
          </Link>
          <Link
            href="/races"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            대회 일정으로 돌아가기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
