import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getOrCreateDemoUserId } from '@/lib/demo-user';

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

function getAuthorLabel(authorUserId: string, currentUserId: string) {
  return authorUserId === currentUserId ? '데모 러너' : '러너';
}

export async function listCommunityPosts(category?: string) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  let query = admin
    .from('community_posts')
    .select('id, author_user_id, linked_race_id, category, title, content, status, like_count, comment_count, report_count, created_at, updated_at')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`커뮤니티 목록 조회 실패: ${error.message}`);
  }

  return (data ?? [])
    .filter((post: RawPost) => post.status !== 'hidden')
    .map((post: RawPost) => ({
      ...post,
      authorLabel: getAuthorLabel(post.author_user_id, currentUserId),
    })) as CommunityPost[];
}

export async function getCommunityPost(postId: string) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data: post, error: postError } = await admin
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

  const { data: comments, error: commentError } = await admin
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
    authorLabel: getAuthorLabel(post.author_user_id, currentUserId),
    comments: (comments ?? [])
      .filter((comment: RawComment) => comment.status !== 'hidden')
      .map((comment: RawComment) => ({
        ...comment,
        authorLabel: getAuthorLabel(comment.author_user_id, currentUserId),
      })),
  } as CommunityDetail;
}

export async function createCommunityPost(input: {
  category: 'free' | 'training' | 'review';
  title: string;
  content: string;
  linkedRaceId?: string | null;
}) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('community_posts').insert({
    author_user_id: currentUserId,
    linked_race_id: input.linkedRaceId || null,
    category: input.category,
    title: input.title.trim(),
    content: input.content.trim(),
  });

  if (error) {
    throw new Error(`게시글 생성 실패: ${error.message}`);
  }
}

export async function createCommunityComment(input: { postId: string; content: string }) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('community_comments').insert({
    post_id: input.postId,
    author_user_id: currentUserId,
    content: input.content.trim(),
  });

  if (error) {
    throw new Error(`댓글 생성 실패: ${error.message}`);
  }

  const { data: post, error: postError } = await admin
    .from('community_posts')
    .select('comment_count')
    .eq('id', input.postId)
    .single();

  if (postError) {
    throw new Error(`댓글 수 조회 실패: ${postError.message}`);
  }

  const { error: updateError } = await admin
    .from('community_posts')
    .update({ comment_count: (post.comment_count ?? 0) + 1 })
    .eq('id', input.postId);

  if (updateError) {
    throw new Error(`댓글 수 업데이트 실패: ${updateError.message}`);
  }
}

export async function reportCommunityPost(input: { postId: string; reason: string; description?: string }) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('community_reports').insert({
    post_id: input.postId,
    reporter_user_id: currentUserId,
    reason: input.reason.trim(),
    description: input.description?.trim() || null,
  });

  if (error) {
    throw new Error(`게시글 신고 실패: ${error.message}`);
  }

  const { data: post, error: postError } = await admin
    .from('community_posts')
    .select('report_count')
    .eq('id', input.postId)
    .single();

  if (postError) {
    throw new Error(`신고 수 조회 실패: ${postError.message}`);
  }

  const { error: updateError } = await admin
    .from('community_posts')
    .update({ report_count: (post.report_count ?? 0) + 1 })
    .eq('id', input.postId);

  if (updateError) {
    throw new Error(`신고 수 업데이트 실패: ${updateError.message}`);
  }
}

export async function setCommunityPostHidden(postId: string, hidden: boolean) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const status = hidden ? 'hidden' : 'published';
  const { error } = await admin.from('community_posts').update({ status }).eq('id', postId);

  if (error) {
    throw new Error(`게시글 숨김 상태 변경 실패: ${error.message}`);
  }

  const { error: auditError } = await admin.from('admin_audit_logs').insert({
    actor_user_id: currentUserId,
    target_table: 'community_posts',
    target_id: postId,
    action: hidden ? 'hide' : 'restore',
    details: { postId, status },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}
