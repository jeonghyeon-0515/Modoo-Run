import { createHash } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchRoadrunRaceDetail, fetchRoadrunRaceList, roadrunSource } from '@/lib/races/source/roadrun-fetch';
import { parseRoadrunDetail, parseRoadrunList } from '@/lib/races/source/roadrun.js';

type TriggerType = 'cron' | 'manual' | 'backfill';

type SyncOptions = {
  years?: number[];
  sourceRaceIds?: string[];
  detailLimit?: number | null;
  triggerType?: TriggerType;
};

type RoadrunListItem = {
  sourceRaceId: string;
  dateLabel: string;
  weekday: string;
  title: string;
  courseSummary: string;
  location: string;
  organizer: string;
  phone: string;
  detailPath: string;
};

type RoadrunDetail = {
  title: string;
  representativeName: string;
  schedule: string;
  phone: string;
  courseSummary: string;
  region: string;
  location: string;
  organizer: string;
  registrationPeriod: string;
  homepage: string;
  introduction: string;
};

type SyncSummary = {
  syncRunId: string;
  sourceSite: 'roadrun';
  triggerType: TriggerType;
  years: number[];
  fetchedCount: number;
  parsedCount: number;
  upsertedCount: number;
  skippedCount: number;
  failedCount: number;
  warningCount: number;
  durationMs: number;
};

const ROADRUN_SOURCE_SITE = 'roadrun';
const DETAIL_CONCURRENCY = 3;

function getCurrentSeoulYear() {
  return Number(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).format(new Date()),
  );
}

function toIsoDate(year: number, label?: string | null) {
  if (!label) return null;
  const parts = label.split('/').map((value) => Number(value.trim()));
  if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }

  const [month, day] = parts;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseRegistrationPeriod(label?: string | null) {
  if (!label) {
    return { openAt: null, closeAt: null };
  }

  const matches = [...label.matchAll(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g)];
  if (matches.length === 0) {
    return { openAt: null, closeAt: null };
  }

  const [open, close = open] = matches;
  const toDate = (match: RegExpMatchArray) =>
    `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`;

  return {
    openAt: toDate(open),
    closeAt: toDate(close),
  };
}

function inferRegistrationStatus(closeAt: string | null) {
  if (!closeAt) return 'open';
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-');

  return closeAt < today ? 'closed' : 'open';
}

function stableHash(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const currentIndex = cursor;
        cursor += 1;
        results[currentIndex] = await worker(items[currentIndex]);
      }
    }),
  );

  return results;
}

async function createSyncRun(triggerType: TriggerType, years: number[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('race_sync_runs')
    .insert({
      source_site: ROADRUN_SOURCE_SITE,
      trigger_type: triggerType,
      status: 'running',
      metadata: { years },
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`race_sync_runs 생성 실패: ${error?.message ?? 'unknown'}`);
  }

  return data.id as string;
}

async function finishSyncRun(syncRunId: string, payload: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin
    .from('race_sync_runs')
    .update({
      ...payload,
      finished_at: new Date().toISOString(),
    })
    .eq('id', syncRunId);

  if (error) {
    throw new Error(`race_sync_runs 종료 업데이트 실패: ${error.message}`);
  }
}

async function getDisabledSourceIds() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('race_sources')
    .select('source_race_id')
    .eq('source_site', ROADRUN_SOURCE_SITE)
    .eq('status', 'disabled');

  if (error) {
    throw new Error(`비활성 source 조회 실패: ${error.message}`);
  }

  return new Set(
    (data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any) => row.source_race_id as string,
    ),
  );
}

async function upsertRaceRecord(item: RoadrunListItem, detail: RoadrunDetail, year: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const registrationPeriod = parseRegistrationPeriod(detail.registrationPeriod);
  const now = new Date().toISOString();
  const sourcePayload = { list: item, detail };
  const sourceHash = stableHash(sourcePayload);

  const { data: existing, error: existingError } = await admin
    .from('races')
    .select('id, source_hash, last_changed_at')
    .eq('source_site', ROADRUN_SOURCE_SITE)
    .eq('source_race_id', item.sourceRaceId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`기존 race 조회 실패: ${existingError.message}`);
  }

  const hasChanged = !existing || existing.source_hash !== sourceHash;
  const racePayload = {
    source_site: ROADRUN_SOURCE_SITE,
    source_race_id: item.sourceRaceId,
    title: detail.title || item.title,
    event_date: toIsoDate(year, item.dateLabel),
    event_date_label: item.dateLabel,
    weekday_label: item.weekday,
    region: detail.region || null,
    location: detail.location || item.location,
    course_summary: detail.courseSummary || item.courseSummary,
    organizer: detail.organizer || item.organizer,
    representative_name: detail.representativeName || null,
    phone: detail.phone || item.phone,
    homepage_url: detail.homepage || null,
    registration_open_at: registrationPeriod.openAt,
    registration_close_at: registrationPeriod.closeAt,
    registration_period_label: detail.registrationPeriod || null,
    registration_status: inferRegistrationStatus(registrationPeriod.closeAt),
    summary: detail.introduction || null,
    description: detail.introduction || null,
    source_list_url: roadrunSource.listUrl,
    source_detail_url: `${roadrunSource.detailUrlBase}?no=${encodeURIComponent(item.sourceRaceId)}`,
    source_hash: sourceHash,
    parser_version: 'v1',
    last_synced_at: now,
    last_seen_at: now,
    last_changed_at: hasChanged ? now : existing?.last_changed_at ?? now,
  };

  const { data: race, error: raceError } = await admin
    .from('races')
    .upsert(racePayload, { onConflict: 'source_site,source_race_id' })
    .select('id')
    .single();

  if (raceError || !race) {
    throw new Error(`race upsert 실패: ${raceError?.message ?? 'unknown'}`);
  }

  const { error: sourceError } = await admin.from('race_sources').upsert(
    {
      race_id: race.id,
      source_site: ROADRUN_SOURCE_SITE,
      source_race_id: item.sourceRaceId,
      source_list_url: roadrunSource.listUrl,
      source_detail_url: `${roadrunSource.detailUrlBase}?no=${encodeURIComponent(item.sourceRaceId)}`,
      source_payload: sourcePayload,
      parser_version: 'v1',
      content_hash: sourceHash,
      status: 'active',
      fetched_at: now,
      disabled_at: null,
      updated_at: now,
    },
    { onConflict: 'source_site,source_race_id' },
  );

  if (sourceError) {
    throw new Error(`race_source upsert 실패: ${sourceError.message}`);
  }
}

export async function setRaceSourceDisabled(sourceRaceId: string, disabled: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('race_sources')
    .update({
      status: disabled ? 'disabled' : 'active',
      disabled_at: disabled ? now : null,
      updated_at: now,
    })
    .eq('source_site', ROADRUN_SOURCE_SITE)
    .eq('source_race_id', sourceRaceId)
    .select('id, source_race_id, status')
    .maybeSingle();

  if (error) {
    throw new Error(`source disable 처리 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error('해당 source_race_id를 가진 race_source가 없습니다. 먼저 sync가 한 번 실행되어야 합니다.');
  }

  return data;
}

export async function runRoadrunSync(options: SyncOptions = {}): Promise<SyncSummary> {
  const startedAt = Date.now();
  const years = [...new Set((options.years?.length ? options.years : [getCurrentSeoulYear()]).map(Number))];
  const triggerType = options.triggerType ?? 'manual';
  const sourceRaceIdFilter = options.sourceRaceIds?.length ? new Set(options.sourceRaceIds) : null;
  const syncRunId = await createSyncRun(triggerType, years);

  let fetchedCount = 0;
  let parsedCount = 0;
  let upsertedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let warningCount = 0;

  try {
    const disabledSourceIds = await getDisabledSourceIds();

    for (const year of years) {
      const listBytes = await fetchRoadrunRaceList(year);
      fetchedCount += 1;

      const parsedItems = parseRoadrunList(listBytes) as RoadrunListItem[];
      parsedCount += parsedItems.length;

      let targetItems = parsedItems.filter((item) => !disabledSourceIds.has(item.sourceRaceId));
      skippedCount += parsedItems.length - targetItems.length;

      if (sourceRaceIdFilter) {
        const beforeFilterCount = targetItems.length;
        targetItems = targetItems.filter((item) => sourceRaceIdFilter.has(item.sourceRaceId));
        skippedCount += beforeFilterCount - targetItems.length;
      }

      if (typeof options.detailLimit === 'number' && options.detailLimit > 0) {
        targetItems = targetItems.slice(0, options.detailLimit);
      }

      await mapWithConcurrency(targetItems, DETAIL_CONCURRENCY, async (item) => {
        try {
          const detailBytes = await fetchRoadrunRaceDetail(item.sourceRaceId);
          fetchedCount += 1;
          const detail = parseRoadrunDetail(detailBytes) as RoadrunDetail;
          await upsertRaceRecord(item, detail, year);
          upsertedCount += 1;
        } catch (error) {
          failedCount += 1;
          warningCount += 1;
          return {
            sourceRaceId: item.sourceRaceId,
            message: error instanceof Error ? error.message : String(error),
          };
        }

        return null;
      });
    }

    const status = failedCount > 0 ? (upsertedCount > 0 ? 'partial' : 'failed') : 'success';
    await finishSyncRun(syncRunId, {
      status,
      fetched_count: fetchedCount,
      parsed_count: parsedCount,
      upserted_count: upsertedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
      warning_count: warningCount,
    });

    return {
      syncRunId,
      sourceSite: 'roadrun',
      triggerType,
      years,
      fetchedCount,
      parsedCount,
      upsertedCount,
      skippedCount,
      failedCount,
      warningCount,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    await finishSyncRun(syncRunId, {
      status: upsertedCount > 0 ? 'partial' : 'failed',
      fetched_count: fetchedCount,
      parsed_count: parsedCount,
      upserted_count: upsertedCount,
      skipped_count: skippedCount,
      failed_count: failedCount + 1,
      warning_count: warningCount,
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
