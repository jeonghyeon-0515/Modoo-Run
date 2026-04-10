import { NextRequest, NextResponse } from 'next/server';
import { normalizeNaverUserInfo } from '@/lib/auth/naver-userinfo';

const NAVER_USERINFO_URL = 'https://openapi.naver.com/v1/nid/me';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    console.error('[naver-userinfo] missing authorization header');
    return NextResponse.json({ message: 'Authorization 헤더가 없습니다.' }, { status: 401 });
  }

  const providerResponse = await fetch(NAVER_USERINFO_URL, {
    headers: {
      Authorization: authorization,
    },
    cache: 'no-store',
  });

  const text = await providerResponse.text();

  if (!providerResponse.ok) {
    console.error('[naver-userinfo] upstream request failed', {
      status: providerResponse.status,
      bodyPreview: text.slice(0, 500),
    });

    return NextResponse.json(
      {
        message: '네이버 사용자 정보를 가져오지 못했습니다.',
        providerStatus: providerResponse.status,
        providerBody: text.slice(0, 500),
      },
      { status: 502 },
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch {
    console.error('[naver-userinfo] upstream response was not json', {
      bodyPreview: text.slice(0, 500),
    });

    return NextResponse.json({ message: '네이버 사용자 정보 응답이 JSON이 아닙니다.' }, { status: 502 });
  }

  try {
    return NextResponse.json(normalizeNaverUserInfo(payload), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[naver-userinfo] failed to normalize upstream payload', {
      payload,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '네이버 사용자 정보를 정규화하지 못했습니다.',
      },
      { status: 502 },
    );
  }
}
