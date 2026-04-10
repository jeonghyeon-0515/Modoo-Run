import { NextRequest, NextResponse } from 'next/server';
import { normalizeNaverUserInfo } from '@/lib/auth/naver-userinfo';

const NAVER_USERINFO_URL = 'https://openapi.naver.com/v1/nid/me';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
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
    return NextResponse.json({ message: '네이버 사용자 정보 응답이 JSON이 아닙니다.' }, { status: 502 });
  }

  try {
    return NextResponse.json(normalizeNaverUserInfo(payload), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '네이버 사용자 정보를 정규화하지 못했습니다.',
      },
      { status: 502 },
    );
  }
}
