export type PlanItemStatus = 'planned' | 'completed' | 'partial' | 'skipped';

export type PlanItemForStats = {
  scheduledDate: string;
  status: PlanItemStatus;
};

export type PlanStats = {
  totalCount: number;
  completedCount: number;
  partialCount: number;
  skippedCount: number;
  completionRate: number;
  streak: number;
};

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function calculatePlanStats(items: PlanItemForStats[]): PlanStats {
  const totalCount = items.length;
  const completedCount = items.filter((item) => item.status === 'completed').length;
  const partialCount = items.filter((item) => item.status === 'partial').length;
  const skippedCount = items.filter((item) => item.status === 'skipped').length;
  const completionRate = totalCount === 0 ? 0 : Math.round(((completedCount + partialCount * 0.5) / totalCount) * 100);

  const completedDates = Array.from(
    new Set(
      items
        .filter((item) => item.status === 'completed')
        .map((item) => toDateKey(item.scheduledDate)),
    ),
  ).sort();

  let streak = 0;
  if (completedDates.length > 0) {
    const cursor = new Date(`${completedDates.at(-1)}T00:00:00Z`);
    const completedDateSet = new Set(completedDates);

    while (completedDateSet.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return {
    totalCount,
    completedCount,
    partialCount,
    skippedCount,
    completionRate,
    streak,
  };
}
