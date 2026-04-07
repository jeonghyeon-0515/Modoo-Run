const ROADRUN_LIST_URL = 'http://www.roadrun.co.kr/schedule/list.php';
const ROADRUN_DETAIL_URL = 'http://www.roadrun.co.kr/schedule/view.php';

async function fetchRoadrunBytes(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Roadrun 요청 실패: ${response.status} ${response.statusText}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function fetchRoadrunRaceList(year: number) {
  const body = new URLSearchParams({
    take_key: '접수중',
    syear_key: String(year),
  });

  return fetchRoadrunBytes(ROADRUN_LIST_URL, {
    method: 'POST',
    body,
  });
}

export async function fetchRoadrunRaceDetail(sourceRaceId: string) {
  const detailUrl = `${ROADRUN_DETAIL_URL}?no=${encodeURIComponent(sourceRaceId)}`;
  return fetchRoadrunBytes(detailUrl, {
    headers: {
      'content-type': 'text/html; charset=euc-kr',
    },
  });
}

export const roadrunSource = {
  listUrl: ROADRUN_LIST_URL,
  detailUrlBase: ROADRUN_DETAIL_URL,
};
