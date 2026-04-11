import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';

export function PartnerInquiryCard({
  sourcePath,
  compact = false,
}: {
  sourcePath: string;
  compact?: boolean;
}) {
  return (
    <section className={`rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-sm ${compact ? '' : 'mt-6'}`}>
      <div className="flex items-center gap-2">
        <StatusBadge tone="info">광고 · 제휴</StatusBadge>
        <h2 className="text-base font-semibold text-slate-950">브랜드/주최측 문의</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        featured listing, 스폰서 노출, 준비물 제휴 같은 협업 문의를 받습니다.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">운영자가 직접 확인 후 답변합니다.</p>
        <Link
          href={`/out/partner/partner_inquiry?source=${encodeURIComponent(sourcePath)}`}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          문의하기
        </Link>
      </div>
    </section>
  );
}
