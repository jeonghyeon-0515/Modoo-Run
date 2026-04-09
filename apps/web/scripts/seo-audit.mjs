import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function run() {
  assert(exists('src/app/robots.ts'), 'robots.ts 가 없습니다.');
  assert(exists('src/app/sitemap.ts'), 'sitemap.ts 가 없습니다.');
  assert(exists('src/components/ui/route-loading-chrome.tsx'), '공통 route loading chrome 이 없습니다.');

  const layout = read('src/app/layout.tsx');
  assert(layout.includes('metadataBase'), 'layout metadataBase 설정이 없습니다.');
  assert(layout.includes('openGraph'), 'layout openGraph 설정이 없습니다.');

  const raceDetail = read('src/app/races/[raceId]/page.tsx');
  assert(raceDetail.includes('generateMetadata'), '대회 상세 generateMetadata 가 없습니다.');
  assert(raceDetail.includes('application/ld+json'), '대회 상세 JSON-LD structured data 가 없습니다.');
  assert(raceDetail.includes('"@type": \'Event\''.replace(/'/g, '"')) || raceDetail.includes("'@type': 'Event'"), 'Event schema 가 없습니다.');

  const strategyDoc = path.join(root, '..', '..', 'docs', 'strategy', 'growth-backlog-90d.md');
  assert(fs.existsSync(strategyDoc), '성장 백로그 문서가 없습니다.');

  console.log('SEO audit passed');
}

run();
