const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://modoo-run.vercel.app').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = Number(process.env.SEARCH_PORTAL_VERIFY_TIMEOUT_MS || '30000');
const MAX_RETRIES = Number(process.env.SEARCH_PORTAL_VERIFY_RETRIES || '3');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const text = await response.text();
      return {
        status: response.status,
        text,
      };
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw new Error(
    `요청 실패: ${url} (${MAX_RETRIES}회 재시도 후) ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const robots = await fetchText(`${baseUrl}/robots.txt`);
const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
const home = await fetchText(`${baseUrl}/`);

assert(robots.status === 200, 'robots.txt 응답이 200이 아닙니다.');
assert(sitemap.status === 200, 'sitemap.xml 응답이 200이 아닙니다.');
assert(home.status === 200, '홈 응답이 200이 아닙니다.');

const hasGoogleMeta = /google-site-verification/i.test(home.text);
const hasNaverMeta = /naver-site-verification/i.test(home.text);

console.log(`# Search Portal Verify

- baseUrl: ${baseUrl}
- timeout(ms): ${REQUEST_TIMEOUT_MS}
- retries: ${MAX_RETRIES}
- robots: ${robots.status}
- sitemap: ${sitemap.status}
- google verification meta: ${hasGoogleMeta ? 'present' : 'missing'}
- naver verification meta: ${hasNaverMeta ? 'present' : 'missing'}
`);

if (!hasGoogleMeta || !hasNaverMeta) {
  throw new Error('검색 포털 verification meta가 아직 모두 반영되지 않았습니다.');
}
