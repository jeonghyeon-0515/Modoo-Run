import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getRaceStatusLabel,
  getRaceStatusTone,
  normalizeMonthFilter,
} = require('../../src/lib/races/formatters.ts');

test('대회 상태 라벨과 톤을 반환한다', () => {
  assert.equal(getRaceStatusLabel('open'), '접수중');
  assert.equal(getRaceStatusLabel('closed'), '접수마감');
  assert.equal(getRaceStatusTone('open'), 'info');
  assert.equal(getRaceStatusTone('closed'), 'warning');
});

test('월 필터를 숫자로 정규화한다', () => {
  assert.equal(normalizeMonthFilter('4월'), 4);
  assert.equal(normalizeMonthFilter(' 11 '), 11);
  assert.equal(normalizeMonthFilter('13월'), null);
});
