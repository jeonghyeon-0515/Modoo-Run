import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildBreadcrumbSchema,
  buildSiteStructuredData,
  serializeJsonLd,
} = require('../../src/lib/seo/schema.ts');

test('사이트 루트에 Organization/WebSite schema를 노출한다', () => {
  const schema = buildSiteStructuredData('https://modoo-run.vercel.app');

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@graph'][0]['@type'], 'Organization');
  assert.equal(schema['@graph'][0].name, '모두의 러닝');
  assert.equal(schema['@graph'][1]['@type'], 'WebSite');
  assert.equal(schema['@graph'][1].publisher['@id'], schema['@graph'][0]['@id']);
});

test('대회 상세 breadcrumb schema를 절대 URL로 만든다', () => {
  const schema = buildBreadcrumbSchema(
    [
      { name: '홈', path: '/' },
      { name: '대회 일정', path: '/races' },
      { name: '테스트 대회', path: '/races/123' },
    ],
    'https://modoo-run.vercel.app/',
  );

  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema.itemListElement.length, 3);
  assert.deepEqual(
    schema.itemListElement.map((item) => item.position),
    [1, 2, 3],
  );
  assert.equal(schema.itemListElement[2].item, 'https://modoo-run.vercel.app/races/123');
});

test('JSON-LD 직렬화는 script 종료 문자열 주입을 막는다', () => {
  const serialized = serializeJsonLd({
    '@context': 'https://schema.org',
    name: '</script><script>alert(1)</script>',
  });

  assert.equal(serialized.includes('</script>'), false);
  assert.ok(serialized.includes('\\u003c/script>'));
});
