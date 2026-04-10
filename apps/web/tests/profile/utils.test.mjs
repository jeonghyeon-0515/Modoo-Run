import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeMultiSelectValues } = require('../../src/lib/profile/utils.ts');

test('다중선택 값은 trim, 중복 제거, 공백 제거를 거친다', () => {
  assert.deepEqual(
    normalizeMultiSelectValues([' 서울 ', '부산', '서울', '', '  ', '대전']),
    ['서울', '부산', '대전'],
  );
});
