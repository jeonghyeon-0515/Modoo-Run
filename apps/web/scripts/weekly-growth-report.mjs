import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const KST_TIME_ZONE = 'Asia/Seoul';
const root = process.cwd();

function readEnvFile() {
  const envPath = path.join(root, '.env.local');
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

function normalizeCount(response, label) {
  if (response.error) {
    throw new Error(`${label} 조회 실패: ${response.error.message}`);
  }
  return response.count ?? 0;
}

function formatPercent(numerator, denominator) {
  if (!denominator) return '0.0%';
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatKstDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function formatKstDateTime(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function markdownTable(rows) {
  if (rows.length === 0) {
    return '_데이터 없음_';
  }

  return ['| 항목 | 값 |', '| --- | ---: |', ...rows.map((row) => `| ${row.label} | ${row.value} |`)].join('\n');
}

function getOutboundTargetLabel(targetKind) {
  if (targetKind === 'apply') return '바로 지원';
  if (targetKind === 'source_detail') return '주최 측 안내';
  if (targetKind === 'homepage') return '공식 홈페이지';
  if (targetKind === 'map') return '지도';
  if (targetKind === 'calendar_google') return 'Google 캘린더';
  if (targetKind === 'calendar_ics') return 'ICS 저장';
  if (targetKind === 'affiliate') return '제휴 클릭';
  if (targetKind === 'sponsored') return '스폰서 클릭';
  if (targetKind === 'partner_inquiry') return '문의 진입';
  return targetKind;
}

function getPartnerInquiryTypeLabel(type) {
  if (type === 'featured_listing') return 'Featured 등록';
  if (type === 'sponsorship') return '스폰서 제안';
  if (type === 'affiliate') return '제휴 제안';
  return '기타 문의';
}

function buildCountMap(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

async function fetchAllRows(client, {
  table,
  column,
  sinceIso,
  untilIso,
  label,
  pageSize = 1000,
}) {
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from(table)
      .select(column)
      .gte('created_at', sinceIso)
      .lt('created_at', untilIso)
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`${label} 조회 실패: ${error.message}`);
    }

    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) {
      return rows;
    }
  }
}

readEnvFile();

const supabaseUrl = process.env.SUPABASE_URL?.trim() || requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const reportDays = Number(process.env.GROWTH_REPORT_DAYS || '7');

if (!Number.isInteger(reportDays) || reportDays <= 0) {
  throw new Error('GROWTH_REPORT_DAYS는 1 이상의 정수여야 합니다.');
}

const now = new Date();
const sinceDate = new Date(now);
sinceDate.setUTCDate(sinceDate.getUTCDate() - reportDays);
const sinceIso = sinceDate.toISOString();
const untilIso = now.toISOString();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const [
  totalRaceCountResponse,
  openRaceCountResponse,
  raceDetailViewCountResponse,
  outboundClickCountResponse,
  partnerLeadCountResponse,
  outboundClickRows,
  partnerLeadRows,
] = await Promise.all([
  supabase.from('races').select('id', { count: 'exact', head: true }),
  supabase.from('races').select('id', { count: 'exact', head: true }).eq('registration_status', 'open'),
  supabase.from('race_detail_view_events').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso).lt('created_at', untilIso),
  supabase.from('race_outbound_click_events').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso).lt('created_at', untilIso),
  supabase.from('partner_leads').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso).lt('created_at', untilIso),
  fetchAllRows(supabase, {
    table: 'race_outbound_click_events',
    column: 'target_kind',
    sinceIso,
    untilIso,
    label: '외부 클릭 상세 집계',
  }),
  fetchAllRows(supabase, {
    table: 'partner_leads',
    column: 'inquiry_type',
    sinceIso,
    untilIso,
    label: '문의 상세 집계',
  }),
]);

const totalRaceCount = normalizeCount(totalRaceCountResponse, '전체 대회 수');
const openRaceCount = normalizeCount(openRaceCountResponse, '접수중 대회 수');
const raceDetailViewCount = normalizeCount(raceDetailViewCountResponse, '대회 상세 조회 수');
const outboundClickCount = normalizeCount(outboundClickCountResponse, '외부 클릭 수');
const partnerLeadCount = normalizeCount(partnerLeadCountResponse, '문의 수');

const outboundTargetCounts = buildCountMap(outboundClickRows, 'target_kind');
const partnerInquiryCounts = buildCountMap(partnerLeadRows, 'inquiry_type');

const outboundTargetRows = [...outboundTargetCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([targetKind, count]) => ({ label: getOutboundTargetLabel(targetKind), value: count }));

const partnerInquiryRows = [...partnerInquiryCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([inquiryType, count]) => ({ label: getPartnerInquiryTypeLabel(inquiryType), value: count }));

const reportDateKey = formatKstDateKey(now);
const outputPath = process.env.GROWTH_REPORT_OUTPUT?.trim() || path.join(root, '..', '..', 'docs', 'reports', `weekly-${reportDateKey}.md`);

const summary = [
  `# 주간 SEO/성장 리포트 (${reportDateKey})`,
  '',
  `- 생성 시각: ${formatKstDateTime(now)}`,
  `- 집계 기간: ${formatKstDateTime(sinceDate)} ~ ${formatKstDateTime(now)} (${reportDays}일)` ,
  '- 데이터 출처: 내부 DB 기준 지표만 사용',
  '- 외부 연동 상태: Search Console / Naver / Analytics API 미연동',
  '',
  '## 핵심 지표',
  markdownTable([
    { label: '전체 대회 수', value: totalRaceCount },
    { label: '접수중 대회 수', value: openRaceCount },
    { label: `최근 ${reportDays}일 상세 조회 수`, value: raceDetailViewCount },
    { label: `최근 ${reportDays}일 외부 클릭 수`, value: outboundClickCount },
    { label: `최근 ${reportDays}일 광고·제휴 문의 수`, value: partnerLeadCount },
  ]),
  '',
  '## 간단 해석',
  `- 현재 접수중 비율: ${formatPercent(openRaceCount, totalRaceCount)}`,
  `- 상세 조회 대비 외부 클릭 비율: ${formatPercent(outboundClickCount, raceDetailViewCount)}`,
  `- 외부 클릭 대비 문의 전환 비율: ${formatPercent(partnerLeadCount, outboundClickCount)}`,
  '',
  '## 외부 클릭 액션별',
  markdownTable(outboundTargetRows),
  '',
  '## 문의 유형별',
  markdownTable(partnerInquiryRows),
  '',
  '## 비고',
  '- 이 리포트는 내부 로그 기준 자동 생성 결과입니다.',
  '- 외부 검색 포털 성과는 권한 설정 후 별도 후속 연동이 필요합니다.',
  '',
];

const markdown = summary.join('\n');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown, 'utf8');

console.log(markdown);
console.log(`\n리포트 저장 위치: ${outputPath}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n\n- 저장 위치: \`${path.relative(path.join(root, '..', '..'), outputPath)}\`\n`, 'utf8');
}
