import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { communityPosts } from '@/lib/ui/mock-data';

const tabs = ['자유게시판', '대회 준비', '후기'];

export default function CommunityPage() {
  return (
    <PageShell
      title="러너 커뮤니티"
      description="준비 과정, 훈련 기록, 후기와 팁을 읽기 쉽고 부담 없이 나눌 수 있는 기본 커뮤니티 구조를 먼저 만듭니다."
    >
      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => (
            <button key={tab} className={`rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? 'bg-[var(--brand)] text-white' : 'bg-slate-100 text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">다른 러너들이 어떻게 준비하고 있는지 확인해보세요.</p>
          <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">글 작성하기</button>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {communityPosts.map((post) => (
          <Link key={post.id} href={`/community/${post.id}`} className="block rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-blue-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusBadge tone="neutral">{post.category}</StatusBadge>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{post.title}</h2>
              </div>
              <span className="text-sm font-semibold text-[var(--brand)]">읽기</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{post.author} · {post.meta}</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
