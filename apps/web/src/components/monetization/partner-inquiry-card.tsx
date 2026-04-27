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
    <section className={`soft-surface rounded-[1.25rem] border border-black/5 bg-white p-5 ${compact ? '' : 'mt-6'}`}>
      <div className="flex items-center gap-2">
        <StatusBadge tone="disclosure">광고 · 제휴</StatusBadge>
        <h2 className="text-balance text-base font-semibold text-slate-950">브랜드/주최측 문의</h2>
      </div>
      <p className="text-pretty mt-3 text-sm leading-6 text-slate-600">
        featured listing, 스폰서 노출, 준비물 제휴처럼 공개 노출과 연결된 협업 문의를 받습니다.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-pretty text-xs text-slate-400/90">운영자가 공개 노출 성격을 확인한 뒤 답변합니다.</p>
        <Link
          href={`/out/partner/partner_inquiry?source=${encodeURIComponent(sourcePath)}`}
          className="public-primary-button pressable inline-flex min-h-11 items-center justify-center rounded-[0.95rem] px-4 py-2.5 text-center text-sm font-semibold"
        >
          문의하기
        </Link>
      </div>
    </section>
  );
}
