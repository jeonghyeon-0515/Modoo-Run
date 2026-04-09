const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://modoo-run.vercel.app').replace(/\/$/, '');

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
  });

  const text = await response.text();
  return {
    status: response.status,
    text,
  };
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
- robots: ${robots.status}
- sitemap: ${sitemap.status}
- google verification meta: ${hasGoogleMeta ? 'present' : 'missing'}
- naver verification meta: ${hasNaverMeta ? 'present' : 'missing'}
`);

if (!hasGoogleMeta || !hasNaverMeta) {
  throw new Error('검색 포털 verification meta가 아직 모두 반영되지 않았습니다.');
}

