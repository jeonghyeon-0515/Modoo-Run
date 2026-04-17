import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { AdvertiseSubmitButton } from './submit-button';
import { createPartnerLeadAction } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const placementItems = [
  {
    badge: 'Featured',
    title: '대회 목록 상단 Featured Listing',
    description: '대회 목록 상단 주목할 대회 영역에서 메인 1개, 보조 1개 슬롯으로 노출합니다.',
  },
  {
    badge: '스폰서',
    title: '대회 상세 내 파트너 슬롯',
    description: '대회 준비 흐름을 해치지 않는 위치에 배너가 아닌 정보형 슬롯으로 노출합니다.',
  },
  {
    badge: '제휴',
    title: '러닝 준비물 / 장비 콘텐츠 연결',
    description: '러너에게 실제 도움이 되는 준비물 콘텐츠 안에서 제휴 링크를 운영합니다.',
  },
];

const inquiryChecklist = [
  '대회명 또는 브랜드명',
  '원하는 노출 유형(Featured / 스폰서 / 제휴)',
  '희망 일정과 캠페인 기간',
  '강조하고 싶은 핵심 정보(일정, 장소, 접수, 코스 등)',
  '회신 받을 담당자 이름과 이메일',
];

export default async function AdvertisePage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const message = readFirstValue(resolvedSearchParams.message);
  const sourcePath = readFirstValue(resolvedSearchParams.source) ?? '/advertise';
  const isError = Boolean(message && /문제|실패|오류|입력|짧은 시간|잠시 후|제한/.test(message));

  return (
    <PageShell
      title="광고 · 제휴 문의"
      description="브랜드 협업, 스폰서 노출, featured listing 운영 문의를 남길 수 있습니다."
      compactIntro
    >
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-slate-950">상품 안내와 운영 원칙</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>• 러너의 대회 탐색 흐름을 방해하지 않는 위치만 사용합니다.</li>
            <li>• 광고, 제휴, 스폰서 표기는 화면에서 명확하게 구분합니다.</li>
            <li>• Featured listing은 `/races` 상단 주목할 대회 영역에 메인 1개, 보조 1개 슬롯으로 운영합니다.</li>
            <li>• 가격과 계약 조건은 아직 최종 확정 전이라 문의 후 별도 협의가 필요합니다.</li>
          </ul>

          <div className="mt-6 space-y-3">
            {placementItems.map((item) => (
              <div key={item.title} className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <StatusBadge tone="disclosure">{item.badge}</StatusBadge>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">문의에 포함해 주세요</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {inquiryChecklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">운영 메모</p>
            <p className="mt-2">
              현재는 상품 구조와 노출 기준만 정리된 상태입니다. 실제 판매 가격, 계약 조건, 세금계산서 처리 방식은
              문의 접수 후 운영팀이 별도로 안내합니다.
            </p>
          </div>
        </article>

        <section className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          {message ? (
            <div
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                isError
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {message}
            </div>
          ) : null}

          <form action={createPartnerLeadAction} className="mt-6 space-y-4">
            <input type="hidden" name="sourcePath" value={sourcePath} />
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="partner-website">웹사이트</label>
              <input id="partner-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">이름</span>
              <input
                name="name"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="홍길동"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">이메일</span>
              <input
                name="email"
                type="email"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="contact@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">브랜드 / 주최측명</span>
              <input
                name="organizationName"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="브랜드명 또는 대회 주최측명"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">문의 유형</span>
              <select
                name="inquiryType"
                defaultValue="featured_listing"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="featured_listing">Featured 등록 문의</option>
                <option value="sponsorship">스폰서 제안</option>
                <option value="affiliate">제휴 제안</option>
                <option value="other">기타 문의</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">문의 내용</span>
              <textarea
                name="message"
                className="mt-2 min-h-36 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="원하는 노출 방식, 예산, 일정, 협업 목적을 적어주세요."
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-slate-400">
                보내주신 문의는 운영자가 직접 확인하며, 반복 제출은 잠시 제한될 수 있습니다.
              </p>
              <AdvertiseSubmitButton />
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
            러너용 서비스 화면으로 돌아가려면{' '}
            <Link href="/races" className="font-medium text-slate-700 hover:text-slate-950">
              대회 일정 보기
            </Link>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
