import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { hashPartnerLeadAuditIdentifierWithSecret } = require('../../src/lib/monetization/privacy-helpers.ts');

test('감사용 해시는 같은 secret에서만 안정적으로 재현된다', () => {
  const secret = 'partner-guard-secret';
  assert.equal(
    hashPartnerLeadAuditIdentifierWithSecret(' Sales@Example.com ', secret),
    hashPartnerLeadAuditIdentifierWithSecret('sales@example.com', secret),
  );
});

test('감사용 해시는 secret이 바뀌면 달라진다', () => {
  assert.notEqual(
    hashPartnerLeadAuditIdentifierWithSecret('sales@example.com', 'secret-a'),
    hashPartnerLeadAuditIdentifierWithSecret('sales@example.com', 'secret-b'),
  );
});
