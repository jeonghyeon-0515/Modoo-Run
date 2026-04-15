import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { requireModerator } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const adminLinks = [
  {
    href: '/ops/corrections',
    title: '대회 정보 수정 요청',
    description: '사용자와 주최측이 보낸 일정·장소·접수 정보 수정 요청을 검토합니다.',
  },
  {
    href: '/ops/featured',
    title: 'Featured Listing 편성',
    description: '대회 목록 상단 featured 노출 대회를 직접 선택하고 문구를 수정합니다.',
  },
  {
    href: '/ops/partners',
    title: '제휴 링크 관리',
    description: 'Garmin, Nike, Decathlon 등 공개 제휴 링크를 운영자가 직접 수정합니다.',
  },
  {
    href: '/ops/outbound-clicks',
    title: '외부 클릭 · 문의 흐름',
    description: '광고·제휴 문의, 외부 이동, 차단 로그와 추이를 한 화면에서 확인합니다.',
  },
  {
    href: '/advertise',
    title: '광고 · 제휴 문의 페이지',
    description: '일반 사용자에게 실제로 보이는 문의 페이지와 공개 노출 문구를 확인합니다.',
  },
  {
    href: '/gear',
    title: '공개 제휴 가이드',
    description: '일반 사용자 화면에서 노출되는 준비물/제휴 콘텐츠 랜딩 페이지를 점검합니다.',
  },
];

export default async function OpsHomePage() {
  await requireModerator('/ops');

  return (
    <PageShell
      title="관리자 기능"
      description="운영 흐름, 공개 노출 상태, 광고·제휴 진입 화면을 빠르게 확인할 수 있습니다."
      compactIntro
    >
      <section className="grid gap-4 md:grid-cols-3">
        {adminLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-4 text-xs font-semibold text-[var(--brand-strong)]">바로 열기 →</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
