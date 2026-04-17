import { requireModerator, requireViewer } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type RawPost = {
  id: string;
  author_user_id: string;
  linked_race_id: string | null;
  category: 'free' | 'training' | 'review';
  title: string;
  content: string;
  status: 'published' | 'hidden' | 'deleted';
  like_count: number;
  comment_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
};

type RawComment = {
  id: string;
  post_id: string;
  author_user_id: string;
  parent_comment_id: string | null;
  content: string;
  status: 'published' | 'hidden' | 'deleted';
  created_at: string;
};

export type CommunityPost = RawPost & {
  authorLabel: string;
};

export type CommunityDetail = CommunityPost & {
  comments: Array<RawComment & { authorLabel: string }>;
};

function assertRequiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label}을(를) 입력해 주세요.`);
  }

  return normalized;
}

function getAuthorLabel(authorUserId: string, currentUserId?: string | null) {
  return currentUserId && authorUserId === currentUserId ? '나' : '러너';
}

export async function listCommunityPosts(input?: {
  category?: string;
  viewerId?: string | null;
  page?: number;
  limit?: number;
}) {
  const supabase = await getSupabaseServerClient();
  const category = input?.category;
  const viewerId = input?.viewerId ?? null;
  const page = Math.max(1, input?.page ?? 1);
  const limit = Math.max(1, input?.limit ?? 20);
  const offset = (page - 1) * limit;
  let query = supabase
    .from('community_posts')
    .select('id, author_user_id, linked_race_id, category, title, content, status, like_count, comment_count, report_count, created_at, updated_at')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`커뮤니티 목록 조회 실패: ${error.message}`);
  }

  const posts = ((data ?? []) as RawPost[]).map((post) => ({
    ...post,
    authorLabel: getAuthorLabel(post.author_user_id, viewerId),
  }));

  return {
    items: posts.slice(0, limit) as CommunityPost[],
    hasNextPage: posts.length > limit,
  };
}

export async function getCommunityPost(postId: string, viewerId?: string | null) {
  const supabase = await getSupabaseServerClient();
  const { data: post, error: postError } = await supabase
    .from('community_posts')
    .select('id, author_user_id, linked_race_id, category, title, content, status, like_count, comment_count, report_count, created_at, updated_at')
    .eq('id', postId)
    .maybeSingle();

  if (postError) {
    throw new Error(`커뮤니티 상세 조회 실패: ${postError.message}`);
  }

  if (!post || post.status === 'deleted') {
    return null;
  }

  const { data: comments, error: commentError } = await supabase
    .from('community_comments')
    .select('id, post_id, author_user_id, parent_comment_id, content, status, created_at')
    .eq('post_id', postId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: true });

  if (commentError) {
    throw new Error(`댓글 조회 실패: ${commentError.message}`);
  }

  return {
    ...(post as RawPost),
    authorLabel: getAuthorLabel(post.author_user_id, viewerId),
    comments: (comments ?? []).map((comment: RawComment) => ({
      ...comment,
      authorLabel: getAuthorLabel(comment.author_user_id, viewerId),
    })),
  } as CommunityDetail;
}

export async function createCommunityPost(input: {
  category: 'free' | 'training' | 'review';
  title: string;
  content: string;
  linkedRaceId?: string | null;
}) {
  const viewer = await requireViewer('/community');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('community_posts').insert({
    author_user_id: viewer.id,
    linked_race_id: input.linkedRaceId || null,
    category: input.category,
    title: assertRequiredText(input.title, '게시글 제목'),
    content: assertRequiredText(input.content, '게시글 내용'),
  });

  if (error) {
    throw new Error(`게시글 생성 실패: ${error.message}`);
  }
}

export async function createCommunityComment(input: { postId: string; content: string }) {
  const viewer = await requireViewer('/community');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('community_comments').insert({
    post_id: input.postId,
    author_user_id: viewer.id,
    content: assertRequiredText(input.content, '댓글 내용'),
  });

  if (error) {
    throw new Error(`댓글 생성 실패: ${error.message}`);
  }
}

export async function reportCommunityPost(input: { postId: string; reason: string; description?: string }) {
  const viewer = await requireViewer('/community');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('community_reports').insert({
    post_id: input.postId,
    reporter_user_id: viewer.id,
    reason: assertRequiredText(input.reason, '신고 사유'),
    description: input.description?.trim() || null,
  });

  if (error) {
    throw new Error(`게시글 신고 실패: ${error.message}`);
  }
}

export async function setCommunityPostHidden(postId: string, hidden: boolean) {
  const viewer = await requireModerator('/community');
  const supabase = await getSupabaseServerClient();
  const status = hidden ? 'hidden' : 'published';
  const { error } = await supabase.from('community_posts').update({ status }).eq('id', postId);

  if (error) {
    throw new Error(`게시글 숨김 상태 변경 실패: ${error.message}`);
  }

  const { error: auditError } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: viewer.id,
    target_table: 'community_posts',
    target_id: postId,
    action: hidden ? 'hide' : 'restore',
    details: { postId, status },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}
