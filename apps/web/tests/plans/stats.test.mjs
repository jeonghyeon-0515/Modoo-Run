import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { calculatePlanStats } = require('../../src/lib/plans/stats.ts');

test('계획 통계는 완료율과 streak를 계산한다', () => {
  const result = calculatePlanStats([
    { scheduledDate: '2026-04-01', status: 'completed' },
    { scheduledDate: '2026-04-02', status: 'completed' },
    { scheduledDate: '2026-04-03', status: 'partial' },
    { scheduledDate: '2026-04-04', status: 'skipped' },
  ]);

  assert.equal(result.totalCount, 4);
  assert.equal(result.completedCount, 2);
  assert.equal(result.partialCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.completionRate, 63);
  assert.equal(result.streak, 2);
});

test('완료 기록이 없으면 streak는 0이다', () => {
  const result = calculatePlanStats([
    { scheduledDate: '2026-04-03', status: 'planned' },
    { scheduledDate: '2026-04-04', status: 'partial' },
  ]);

  assert.equal(result.streak, 0);
  assert.equal(result.completionRate, 25);
});
