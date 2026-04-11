import { NextRequest, NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/site';
import { isPartnerClickTarget } from '@/lib/monetization/utils';
import { recordPartnerClick } from '@/lib/monetization/repository';

type Params = Promise<{ target: string }>;

function normalizeSourcePath(input: string | null) {
  if (!input || !input.startsWith('/') || input.startsWith('//')) {
    return '/';
  }

  return input;
}

function normalizeExternalUrl(value: string | null) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { target } = await params;
  const sourcePath = normalizeSourcePath(request.nextUrl.searchParams.get('source'));
  const destinationParam = normalizeExternalUrl(request.nextUrl.searchParams.get('destination'));

  if (!isPartnerClickTarget(target)) {
    return NextResponse.redirect(new URL('/advertise', request.url), 307);
  }

  const destination =
    target === 'partner_inquiry'
      ? new URL(`/advertise?source=${encodeURIComponent(sourcePath)}`, getSiteUrl()).toString()
      : destinationParam ?? new URL('/advertise', getSiteUrl()).toString();

  try {
    await recordPartnerClick({
      targetKind: target,
      targetUrl: destination,
      sourcePath,
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    });
  } catch (error) {
    console.error(error);
  }

  return NextResponse.redirect(destination, 307);
}
