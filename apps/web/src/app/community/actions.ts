'use server';

import { revalidatePath } from 'next/cache';
import {
  createCommunityComment,
  createCommunityPost,
  reportCommunityPost,
  setCommunityPostHidden,
} from '@/lib/community/repository';

export async function createCommunityPostAction(formData: FormData) {
  await createCommunityPost({
    category: String(formData.get('category')) as 'free' | 'training' | 'review',
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
    linkedRaceId: String(formData.get('linkedRaceId') ?? '') || null,
  });
  revalidatePath('/community');
}

export async function createCommunityCommentAction(formData: FormData) {
  const postId = String(formData.get('postId'));
  await createCommunityComment({
    postId,
    content: String(formData.get('content') ?? ''),
  });
  revalidatePath('/community');
  revalidatePath(`/community/${postId}`);
}

export async function reportCommunityPostAction(formData: FormData) {
  const postId = String(formData.get('postId'));
  await reportCommunityPost({
    postId,
    reason: String(formData.get('reason') ?? '기타'),
    description: String(formData.get('description') ?? ''),
  });
  revalidatePath('/community');
  revalidatePath(`/community/${postId}`);
}

export async function toggleCommunityPostHiddenAction(formData: FormData) {
  const postId = String(formData.get('postId'));
  const hidden = String(formData.get('hidden')) === 'true';
  await setCommunityPostHidden(postId, hidden);
  revalidatePath('/community');
  revalidatePath(`/community/${postId}`);
}
