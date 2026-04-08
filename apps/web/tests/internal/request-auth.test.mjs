import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  isAuthorizedInternalRequest,
  readBearerToken,
} = require('../../src/lib/internal/request-auth.ts');

test('Bearer 토큰을 올바르게 추출한다', () => {
  assert.equal(readBearerToken('Bearer secret-token'), 'secret-token');
  assert.equal(readBearerToken('bearer secret-token'), 'secret-token');
  assert.equal(readBearerToken('Token secret-token'), null);
  assert.equal(readBearerToken(null), null);
});

test('공유 시크릿 헤더와 Bearer 토큰 모두 내부 요청으로 인정한다', () => {
  const allowedSecrets = ['shared-secret', 'cron-secret'];

  assert.equal(
    isAuthorizedInternalRequest({
      sharedSecretHeader: 'shared-secret',
      authorizationHeader: null,
      allowedSecrets,
    }),
    true,
  );

  assert.equal(
    isAuthorizedInternalRequest({
      sharedSecretHeader: null,
      authorizationHeader: 'Bearer cron-secret',
      allowedSecrets,
    }),
    true,
  );

  assert.equal(
    isAuthorizedInternalRequest({
      sharedSecretHeader: 'wrong-secret',
      authorizationHeader: 'Bearer wrong-secret',
      allowedSecrets,
    }),
    false,
  );
});
