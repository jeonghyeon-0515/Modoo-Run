import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getOrCreateDemoUserId } from '@/lib/demo-user';
import { calculatePlanStats, PlanItemStatus } from './stats';

type RawPlan = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  title: string | null;
  notes: string | null;
  target_race_id: string | null;
  goal_distance_km: number | null;
  goal_sessions: number | null;
};

type RawPlanItem = {
  id: string;
  plan_id: string;
  scheduled_date: string;
  category: string;
  title: string;
  description: string | null;
  target_distance_km: number | null;
  target_duration_minutes: number | null;
  linked_race_id: string | null;
  status: PlanItemStatus;
  sort_order: number;
};

export type PlanView = {
  plan: RawPlan | null;
  items: RawPlanItem[];
  stats: ReturnType<typeof calculatePlanStats>;
  currentUserId: string;
};

function getCurrentYearMonth() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const [year, month] = formatter.split('-').map(Number);
  return { year, month };
}

export async function getPlanView(year?: number, month?: number): Promise<PlanView> {
  const currentUserId = await getOrCreateDemoUserId();
  const currentYearMonth = getCurrentYearMonth();
  const targetYear = year ?? currentYearMonth.year;
  const targetMonth = month ?? currentYearMonth.month;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data: plan, error: planError } = await admin
    .from('monthly_plans')
    .select('id, user_id, year, month, title, notes, target_race_id, goal_distance_km, goal_sessions')
    .eq('user_id', currentUserId)
    .eq('year', targetYear)
    .eq('month', targetMonth)
    .maybeSingle();

  if (planError) {
    throw new Error(`월간 계획 조회 실패: ${planError.message}`);
  }

  let items: RawPlanItem[] = [];

  if (plan) {
    const { data: itemRows, error: itemsError } = await admin
      .from('plan_items')
      .select('id, plan_id, scheduled_date, category, title, description, target_distance_km, target_duration_minutes, linked_race_id, status, sort_order')
      .eq('plan_id', plan.id)
      .order('scheduled_date', { ascending: true })
      .order('sort_order', { ascending: true });

    if (itemsError) {
      throw new Error(`계획 아이템 조회 실패: ${itemsError.message}`);
    }

    items = (itemRows ?? []) as RawPlanItem[];
  }

  return {
    plan: (plan as RawPlan | null) ?? null,
    items,
    stats: calculatePlanStats(
      items.map((item) => ({ scheduledDate: item.scheduled_date, status: item.status })),
    ),
    currentUserId,
  };
}

export async function upsertMonthlyPlan(input: {
  year: number;
  month: number;
  title?: string;
  notes?: string;
  goalDistanceKm?: number | null;
  goalSessions?: number | null;
  targetRaceId?: string | null;
}) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const payload = {
    user_id: currentUserId,
    year: input.year,
    month: input.month,
    title: input.title?.trim() || null,
    notes: input.notes?.trim() || null,
    goal_distance_km: input.goalDistanceKm ?? null,
    goal_sessions: input.goalSessions ?? null,
    target_race_id: input.targetRaceId || null,
  };

  const { data, error } = await admin
    .from('monthly_plans')
    .upsert(payload, { onConflict: 'user_id,year,month' })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`월간 계획 저장 실패: ${error?.message ?? 'unknown'}`);
  }

  return data.id as string;
}

export async function deleteMonthlyPlan(planId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('monthly_plans').delete().eq('id', planId);
  if (error) {
    throw new Error(`월간 계획 삭제 실패: ${error.message}`);
  }
}

export async function createPlanItem(input: {
  planId: string;
  scheduledDate: string;
  category: string;
  title: string;
  description?: string;
  targetDistanceKm?: number | null;
  targetDurationMinutes?: number | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('plan_items').insert({
    plan_id: input.planId,
    scheduled_date: input.scheduledDate,
    category: input.category,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    target_distance_km: input.targetDistanceKm ?? null,
    target_duration_minutes: input.targetDurationMinutes ?? null,
  });

  if (error) {
    throw new Error(`계획 아이템 생성 실패: ${error.message}`);
  }
}

export async function updatePlanItem(input: {
  itemId: string;
  scheduledDate: string;
  category: string;
  title: string;
  description?: string;
  targetDistanceKm?: number | null;
  targetDurationMinutes?: number | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin
    .from('plan_items')
    .update({
      scheduled_date: input.scheduledDate,
      category: input.category,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      target_distance_km: input.targetDistanceKm ?? null,
      target_duration_minutes: input.targetDurationMinutes ?? null,
    })
    .eq('id', input.itemId);

  if (error) {
    throw new Error(`계획 아이템 수정 실패: ${error.message}`);
  }
}

export async function deletePlanItem(itemId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('plan_items').delete().eq('id', itemId);
  if (error) {
    throw new Error(`계획 아이템 삭제 실패: ${error.message}`);
  }
}

export async function setPlanItemStatus(input: { itemId: string; status: PlanItemStatus }) {
  const currentUserId = await getOrCreateDemoUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('plan_items').update({ status: input.status }).eq('id', input.itemId);

  if (error) {
    throw new Error(`계획 상태 변경 실패: ${error.message}`);
  }

  const { error: logError } = await admin.from('plan_item_logs').insert({
    plan_item_id: input.itemId,
    user_id: currentUserId,
    status: input.status,
  });

  if (logError) {
    throw new Error(`계획 상태 로그 기록 실패: ${logError.message}`);
  }
}
