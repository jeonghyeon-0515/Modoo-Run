'use server';

import { revalidatePath } from 'next/cache';
import {
  createPlanItem,
  deleteMonthlyPlan,
  deletePlanItem,
  setPlanItemStatus,
  updatePlanItem,
  upsertMonthlyPlan,
} from '@/lib/plans/repository';

function toOptionalNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function upsertMonthlyPlanAction(formData: FormData) {
  await upsertMonthlyPlan({
    year: Number(formData.get('year')),
    month: Number(formData.get('month')),
    title: String(formData.get('title') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    goalDistanceKm: toOptionalNumber(formData.get('goalDistanceKm')),
    goalSessions: toOptionalNumber(formData.get('goalSessions')),
    targetRaceId: String(formData.get('targetRaceId') ?? '') || null,
  });
  revalidatePath('/plan');
}

export async function deleteMonthlyPlanAction(formData: FormData) {
  await deleteMonthlyPlan(String(formData.get('planId')));
  revalidatePath('/plan');
}

export async function createPlanItemAction(formData: FormData) {
  await createPlanItem({
    planId: String(formData.get('planId')),
    scheduledDate: String(formData.get('scheduledDate')),
    category: String(formData.get('category')),
    title: String(formData.get('title')),
    description: String(formData.get('description') ?? ''),
    targetDistanceKm: toOptionalNumber(formData.get('targetDistanceKm')),
    targetDurationMinutes: toOptionalNumber(formData.get('targetDurationMinutes')),
  });
  revalidatePath('/plan');
}

export async function updatePlanItemAction(formData: FormData) {
  await updatePlanItem({
    itemId: String(formData.get('itemId')),
    scheduledDate: String(formData.get('scheduledDate')),
    category: String(formData.get('category')),
    title: String(formData.get('title')),
    description: String(formData.get('description') ?? ''),
    targetDistanceKm: toOptionalNumber(formData.get('targetDistanceKm')),
    targetDurationMinutes: toOptionalNumber(formData.get('targetDurationMinutes')),
  });
  revalidatePath('/plan');
}

export async function deletePlanItemAction(formData: FormData) {
  await deletePlanItem(String(formData.get('itemId')));
  revalidatePath('/plan');
}

export async function setPlanItemStatusAction(formData: FormData) {
  await setPlanItemStatus({
    itemId: String(formData.get('itemId')),
    status: String(formData.get('status')) as 'planned' | 'completed' | 'partial' | 'skipped',
  });
  revalidatePath('/plan');
}
