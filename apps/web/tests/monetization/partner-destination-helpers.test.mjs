import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizePartnerDestinationUrl } = require('../../src/lib/monetization/partner-destination-helpers.ts');

test('파트너 링크는 http/https URL만 허용한다', () => {
  assert.equal(normalizePartnerDestinationUrl(' https://example.com/path '), 'https://example.com/path');
  assert.throws(() => normalizePartnerDestinationUrl('javascript:alert(1)'), /http 또는 https 링크만/);
  assert.throws(() => normalizePartnerDestinationUrl('not-a-url'), /올바른 URL/);
});
