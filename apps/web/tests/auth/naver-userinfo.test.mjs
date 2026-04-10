import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeNaverUserInfo } = require('../../src/lib/auth/naver-userinfo.ts');

test('네이버 응답을 Supabase custom provider가 읽을 수 있는 형태로 평탄화한다', () => {
  assert.deepEqual(
    normalizeNaverUserInfo({
      resultcode: '00',
      message: 'success',
      response: {
        id: 'naver-user-123',
        email: 'runner@modoo.run',
        name: '모두 러너',
        nickname: '달리미',
        profile_image: 'https://example.com/avatar.png',
      },
    }),
    {
      sub: 'naver-user-123',
      email: 'runner@modoo.run',
      email_verified: true,
      name: '달리미',
      nickname: '달리미',
      full_name: '모두 러너',
      picture: 'https://example.com/avatar.png',
      avatar_url: 'https://example.com/avatar.png',
    },
  );
});

test('네이버 고유값이 없으면 명시적인 오류를 던진다', () => {
  assert.throws(
    () =>
      normalizeNaverUserInfo({
        response: {
          email: 'runner@modoo.run',
        },
      }),
    /고유값\(id\)이 없습니다/,
  );
});
