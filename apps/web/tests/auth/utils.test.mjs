import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  isStaffRole,
  normalizeNextPath,
  resolveDisplayName,
  resolveViewerRole,
} = require('../../src/lib/auth/utils.ts');

test('next 경로는 내부 경로만 허용한다', () => {
  assert.equal(normalizeNextPath('/plan?year=2026&month=4'), '/plan?year=2026&month=4');
  assert.equal(normalizeNextPath('https://evil.example'), '/');
  assert.equal(normalizeNextPath('//evil.example'), '/');
  assert.equal(normalizeNextPath('community'), '/');
});

test('뷰어 역할과 스태프 여부를 판별한다', () => {
  assert.equal(resolveViewerRole('admin'), 'admin');
  assert.equal(resolveViewerRole('moderator'), 'moderator');
  assert.equal(resolveViewerRole('unexpected'), 'user');
  assert.equal(isStaffRole('admin'), true);
  assert.equal(isStaffRole('moderator'), true);
  assert.equal(isStaffRole('user'), false);
});

test('표시 이름은 profile -> metadata -> email 순으로 결정한다', () => {
  assert.equal(
    resolveDisplayName({
      email: 'runner@modoo.run',
      profileName: '프로필 이름',
      metadataName: '메타데이터 이름',
    }),
    '프로필 이름',
  );

  assert.equal(
    resolveDisplayName({
      email: 'runner@modoo.run',
      profileName: '',
      metadataName: '메타데이터 이름',
    }),
    '메타데이터 이름',
  );

  assert.equal(
    resolveDisplayName({
      email: 'runner@modoo.run',
      profileName: '',
      metadataName: '',
    }),
    'runner',
  );
});
