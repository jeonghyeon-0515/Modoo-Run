import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getRaceLandingConfig, raceLandingPages } = require('../../src/lib/races/landing-config.ts');

test('검색 유입 랜딩 페이지는 5개 핵심 경로를 가진다', () => {
  assert.deepEqual(
    raceLandingPages.map((page) => page.path),
    [
      '/races/closing-soon',
      '/races/regions/seoul',
      '/races/regions/busan',
      '/races/distances/10k',
      '/races/distances/half-full',
    ],
  );
});

test('검색 유입 랜딩 페이지 title과 description은 중복되지 않는다', () => {
  assert.equal(new Set(raceLandingPages.map((page) => page.title)).size, raceLandingPages.length);
  assert.equal(new Set(raceLandingPages.map((page) => page.description)).size, raceLandingPages.length);
});

test('랜딩 config는 key로 조회할 수 있다', () => {
  assert.equal(getRaceLandingConfig('closing-soon').path, '/races/closing-soon');
  assert.equal(getRaceLandingConfig('half-full').eyebrow, '하프 · 풀');
});
