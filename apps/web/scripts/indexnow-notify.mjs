import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    if (process.env[key]) continue;
    process.env[key] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile();

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://modoo-run.vercel.app').trim().replace(/\/$/, '');
const endpoint = (process.env.INDEXNOW_ENDPOINT || 'https://searchadvisor.naver.com/indexnow').trim();
const indexNowKey = (process.env.INDEXNOW_KEY || '').trim();
const maxUrls = Number(process.env.INDEXNOW_MAX_URLS || '1000');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`요청 실패: ${url} (${response.status})`);
  }

  return response.text();
}

function extractUrlsFromSitemap(xml) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return [...new Set(matches.map((match) => match[1]?.trim()).filter(Boolean))];
}

assert(indexNowKey, 'INDEXNOW_KEY 환경변수가 필요합니다.');

const sitemapXml = await fetchText(`${baseUrl}/sitemap.xml`);
const urlList = extractUrlsFromSitemap(sitemapXml).slice(0, maxUrls);

assert(urlList.length > 0, '제출할 URL이 없습니다.');

const payloads = chunk(urlList, 10000).map((urls) => ({
  host: new URL(baseUrl).host,
  key: indexNowKey,
  keyLocation: `${baseUrl}/${indexNowKey}.txt`,
  urlList: urls,
}));

const results = [];

for (const payload of payloads) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const body = await response.text();
  results.push({
    status: response.status,
    body,
    submitted: payload.urlList.length,
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`IndexNow 제출 실패 (${response.status}): ${body}`);
  }
}

const summary = `# IndexNow Notify

- endpoint: ${endpoint}
- host: ${new URL(baseUrl).host}
- keyLocation: ${baseUrl}/${indexNowKey}.txt
- urlCount: ${urlList.length}
- batches: ${payloads.length}
- statuses: ${results.map((item) => item.status).join(', ')}
`;

console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  await import('node:fs/promises').then((fs) => fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, 'utf8'));
}
