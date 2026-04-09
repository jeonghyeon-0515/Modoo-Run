import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildRaceCalendarIcs,
  getRaceGoogleCalendarUrl,
  getRacePrimaryApplyUrl,
  getRaceMapLinkUrl,
  resolveRaceOutboundUrl,
} = require('../../src/lib/races/outbound.ts');

const sampleRace = {
  sourceRaceId: '40317',
  title: '부산 이기대트레일런',
  summary: '부산에서 제일 아름다운 이기대해안길 코스입니다.',
  description: '해안길을 달리는 트레일런 대회입니다.',
  region: '부산',
  location: '이기대수변공원입구',
  organizer: '명품트레일',
  eventDate: '2026-04-18',
  eventDateLabel: '2026년 4월 18일 토',
  registrationPeriodLabel: '2025년11월11일~2026년4월17일',
  homepageUrl: 'https://example.com/apply',
  sourceDetailUrl: 'https://example.com/guide',
};

test('기본 지원 링크는 공식 홈페이지를 우선 사용한다', () => {
  assert.equal(getRacePrimaryApplyUrl(sampleRace), 'https://example.com/apply');
});

test('지도 링크와 구글 캘린더 링크를 생성한다', () => {
  const mapUrl = getRaceMapLinkUrl(sampleRace);
  const calendarUrl = getRaceGoogleCalendarUrl(sampleRace);

  assert.ok(mapUrl.includes('google.com/maps/search'));
  assert.ok(calendarUrl.includes('calendar.google.com/calendar/render'));
  assert.ok(calendarUrl.includes('dates=20260418/20260419'));
});

test('외부 이동 대상 URL을 종류별로 해석한다', () => {
  assert.equal(resolveRaceOutboundUrl(sampleRace, 'apply'), 'https://example.com/apply');
  assert.equal(resolveRaceOutboundUrl(sampleRace, 'source_detail'), 'https://example.com/guide');
  assert.equal(resolveRaceOutboundUrl(sampleRace, 'homepage'), 'https://example.com/apply');
});

test('ICS 본문에 일정 핵심 정보가 들어간다', () => {
  const ics = buildRaceCalendarIcs(sampleRace, new Date('2026-04-09T12:00:00Z'));

  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:부산 이기대트레일런'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260418'));
  assert.ok(ics.includes('DTEND;VALUE=DATE:20260419'));
  assert.ok(ics.includes('URL:https://modoo-run.vercel.app/races/40317'));
});

