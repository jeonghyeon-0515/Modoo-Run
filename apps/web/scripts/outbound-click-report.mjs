import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (process.env[key]) continue;
    process.env[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  }
  return value;
}

function markdownTable(rows) {
  if (rows.length === 0) {
    return '_데이터 없음_';
  }

  const header = '| 구분 | 값 |';
  const divider = '| --- | ---: |';
  return [header, divider, ...rows.map((row) => `| ${row.label} | ${row.value} |`)].join('\n');
}

readEnvFile();

const supabaseUrl = process.env.SUPABASE_URL?.trim() || requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const reportDays = Number(process.env.OUTBOUND_REPORT_DAYS || '7');
const startDate = new Date();
startDate.setUTCDate(startDate.getUTCDate() - reportDays);
const sinceIso = startDate.toISOString();

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase
  .from('race_outbound_click_events')
  .select('source_race_id,target_kind,created_at')
  .gte('created_at', sinceIso)
  .order('created_at', { ascending: false })
  .limit(5000);

if (error) {
  throw error;
}

const { data: viewData, error: viewError } = await supabase
  .from('race_detail_view_events')
  .select('source_race_id,created_at')
  .gte('created_at', sinceIso)
  .order('created_at', { ascending: false })
  .limit(5000);

if (viewError) {
  throw viewError;
}

const rows = data ?? [];
const viewRows = viewData ?? [];
const byTarget = new Map();
const byRace = new Map();

for (const row of rows) {
  byTarget.set(row.target_kind, (byTarget.get(row.target_kind) ?? 0) + 1);
  byRace.set(row.source_race_id, (byRace.get(row.source_race_id) ?? 0) + 1);
}

const targetRows = [...byTarget.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([label, value]) => ({ label, value }));

const raceRows = [...byRace.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([label, value]) => ({ label, value }));

const summary = [
  `# 외부 신청 클릭 리포트 (${reportDays}일)`,
  '',
  `- 기준 시작 시각: ${sinceIso}`,
  `- 총 상세 조회 수: ${viewRows.length}`,
  `- 총 클릭 수: ${rows.length}`,
  `- 바로 지원 전환율: ${viewRows.length > 0 ? ((byTarget.get('apply') ?? 0) / viewRows.length * 100).toFixed(1) : '0.0'}%`,
  '',
  '## 대상별 클릭 수',
  markdownTable(targetRows),
  '',
  '## 많이 눌린 대회(sourceRaceId)',
  markdownTable(raceRows),
  '',
];

const text = summary.join('\n');
console.log(text);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`, 'utf8');
}
