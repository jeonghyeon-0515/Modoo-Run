import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getOutboundTargetLabel,
  summarizeOutboundClicks,
} = require('../../src/lib/races/outbound-report.ts');

const sampleRows = [
  {
    sourceRaceId: '40317',
    raceTitle: '부산 이기대트레일런',
    targetKind: 'apply',
    sourcePath: '/races/40317',
    viewerRole: 'anon',
    createdAt: '2026-04-09T12:00:00.000Z',
  },
  {
    sourceRaceId: '40317',
    raceTitle: '부산 이기대트레일런',
    targetKind: 'calendar_ics',
    sourcePath: '/races/40317',
    viewerRole: 'user',
    createdAt: '2026-04-09T11:59:00.000Z',
  },
  {
    sourceRaceId: '50001',
    raceTitle: '서울 벚꽃런',
    targetKind: 'apply',
    sourcePath: '/races/50001',
    viewerRole: 'user',
    createdAt: '2026-04-09T11:58:00.000Z',
  },
];

test('외부 클릭 로그를 대상/대회 기준으로 요약한다', () => {
  const summary = summarizeOutboundClicks(sampleRows, { topRaceLimit: 5, recentLimit: 2 });

  assert.equal(summary.totalCount, 3);
  assert.equal(summary.uniqueRaceCount, 2);
  assert.equal(summary.targetSummaries[0].targetKind, 'apply');
  assert.equal(summary.targetSummaries[0].count, 2);
  assert.equal(summary.topRaces[0].sourceRaceId, '40317');
  assert.equal(summary.topRaces[0].count, 2);
  assert.equal(summary.recentEvents.length, 2);
});

test('외부 클릭 대상 라벨을 사용자 친화적으로 바꾼다', () => {
  assert.equal(getOutboundTargetLabel('apply'), '바로 지원');
  assert.equal(getOutboundTargetLabel('calendar_ics'), 'ICS 저장');
  assert.equal(getOutboundTargetLabel('unknown_kind'), 'unknown_kind');
});

