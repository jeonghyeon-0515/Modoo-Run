import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  affiliateGuideSections,
  getCommunityPromoSlots,
  getRaceDetailPromoSlots,
  getRacesPagePromoSlots,
  pickFeaturedRaces,
  resolvePublicPartnerDestination,
} = require('../../src/lib/monetization/public-catalog.ts');

const sampleRaces = [
  {
    id: '1',
    sourceRaceId: '40317',
    title: '서울 봄런',
    eventDate: '2026-05-01',
    eventDateLabel: '5/1',
    weekdayLabel: '금',
    region: '서울',
    location: '여의도공원',
    courseSummary: '10km,5km',
    organizer: '모두런',
    registrationStatus: 'open',
    registrationPeriodLabel: '4/1~4/20',
    lastSyncedAt: null,
  },
  {
    id: '2',
    sourceRaceId: '50001',
    title: '부산 하프런',
    eventDate: '2026-05-10',
    eventDateLabel: '5/10',
    weekdayLabel: '일',
    region: '부산',
    location: '광안리',
    courseSummary: '하프',
    organizer: '모두런',
    registrationStatus: 'open',
    registrationPeriodLabel: '4/5~4/25',
    lastSyncedAt: null,
  },
];

test('featured race는 접수중 대회에서 최대 2개를 뽑는다', () => {
  const featured = pickFeaturedRaces(sampleRaces);
  assert.equal(featured.length, 2);
  assert.equal(featured[0].race.registrationStatus, 'open');
  assert.notEqual(featured[0].race.id, featured[1].race.id);
});

test('공개 제휴 가이드는 외부 자원 섹션을 가진다', () => {
  assert.ok(affiliateGuideSections.length >= 2);
  assert.ok(affiliateGuideSections.every((section) => section.resources.length >= 1));
});

test('사용자 화면용 promo slot이 준비되어 있다', () => {
  assert.ok(getRacesPagePromoSlots().length >= 2);
  assert.ok(getCommunityPromoSlots().length >= 2);
  assert.ok(getRaceDetailPromoSlots({ ...sampleRaces[0], representativeName: null, phone: null, homepageUrl: null, summary: null, description: null, sourceDetailUrl: null, sourceListUrl: null, registrationOpenAt: null, registrationCloseAt: null }).length >= 2);
});

test('허용된 partner destination key만 실제 URL로 해석한다', () => {
  assert.equal(resolvePublicPartnerDestination('garmin'), 'https://www.garmin.com/ko-KR/');
  assert.equal(resolvePublicPartnerDestination('unknown'), null);
});
