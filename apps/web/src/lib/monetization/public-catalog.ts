import type { RaceDetailItem, RaceListItem } from '../races/types';

export type PublicPartnerTargetKind = 'affiliate' | 'sponsored';
export type PublicPartnerDestinationKey = 'garmin' | 'nike' | 'decathlon';

export type FeaturedRacePlacement = {
  race: RaceListItem;
  eyebrow: string;
  summary: string;
};

export type PromoSlot = {
  id: string;
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  external?: boolean;
  disclosure?: string;
};

type GuideResource = {
  label: string;
  title: string;
  description: string;
  targetKind: PublicPartnerTargetKind;
  destinationKey: PublicPartnerDestinationKey;
  destinationUrl: string;
  ctaLabel: string;
};

export type AffiliateGuideSection = {
  title: string;
  description: string;
  resources: GuideResource[];
};

export const publicPartnerDestinations: Record<PublicPartnerDestinationKey, string> = {
  garmin: 'https://www.garmin.com/ko-KR/',
  nike: 'https://www.nike.com/kr/',
  decathlon: 'https://www.decathlon.co.kr/',
} as const;

export const affiliateGuideSections: AffiliateGuideSection[] = [
  {
    title: '기록과 페이스 관리',
    description: '대회 준비 단계에서 기록을 쌓고 레이스 플랜을 세울 때 많이 찾는 공식 브랜드 홈을 모았습니다.',
    resources: [
      {
        label: '스폰서',
        title: '러닝 워치 · 기록 도구 둘러보기',
        description: '심박, 페이스, 코스 기록을 한 번에 정리하고 싶은 러너를 위한 공식 브랜드 홈입니다.',
        targetKind: 'sponsored',
        destinationKey: 'garmin',
        destinationUrl: publicPartnerDestinations.garmin,
        ctaLabel: 'Garmin 공식 홈 보기',
      },
    ],
  },
  {
    title: '레이스데이 장비 · 보조용품',
    description: '러닝화, 양말, 벨트, 보급용 수납 용품처럼 대회 직전에 많이 찾는 준비물 중심입니다.',
    resources: [
      {
        label: '제휴',
        title: '러닝화 · 장비 카테고리 보기',
        description: '첫 대회 준비물부터 재사용 가능한 훈련 장비까지 한 번에 둘러볼 수 있는 카테고리 진입점입니다.',
        targetKind: 'affiliate',
        destinationKey: 'decathlon',
        destinationUrl: publicPartnerDestinations.decathlon,
        ctaLabel: 'Decathlon 보기',
      },
      {
        label: '제휴',
        title: '브랜드 러닝 컬렉션 보기',
        description: '러닝 의류와 슈즈 중심으로 현재 공식 컬렉션을 확인할 수 있습니다.',
        targetKind: 'affiliate',
        destinationKey: 'nike',
        destinationUrl: publicPartnerDestinations.nike,
        ctaLabel: 'Nike 러닝 보기',
      },
    ],
  },
];

export function resolvePublicPartnerDestination(destinationKey: string) {
  return publicPartnerDestinations[destinationKey as PublicPartnerDestinationKey] ?? null;
}

function buildPartnerOutboundHref(
  targetKind: PublicPartnerTargetKind,
  sourcePath: string,
  destinationKey: PublicPartnerDestinationKey,
) {
  const query = new URLSearchParams({
    source: sourcePath,
    destinationKey,
  });
  return `/out/partner/${targetKind}?${query.toString()}`;
}

export function getRacesPagePromoSlots(): PromoSlot[] {
  return [
    {
      id: 'races-guide',
      badge: '제휴 가이드',
      title: '첫 대회 준비물 가이드',
      description: '러닝화, 벨트, 워치처럼 실제로 많이 찾는 준비물만 모아 공개 페이지로 정리했습니다.',
      ctaLabel: '가이드 보기',
      href: '/gear',
      disclosure: '일부 링크는 제휴 링크로 연결될 수 있습니다.',
    },
    {
      id: 'races-sponsored-watch',
      badge: '스폰서',
      title: '러닝 워치 · 기록 도구 살펴보기',
      description: '훈련 기록과 레이스 페이스 관리에 관심 있는 러너를 위한 공식 브랜드 홈입니다.',
      ctaLabel: '공식 홈 보기',
      href: buildPartnerOutboundHref('sponsored', '/races', 'garmin'),
      external: true,
      disclosure: '광고 · 스폰서 링크',
    },
  ];
}

export function getCommunityPromoSlots(): PromoSlot[] {
  return [
    {
      id: 'community-affiliate-kit',
      badge: '제휴',
      title: '러닝 장비 컬렉션 보기',
      description: '커뮤니티에서 많이 나오는 러닝화, 장비 카테고리를 공식 스토어 홈으로 연결합니다.',
      ctaLabel: '카테고리 보기',
      href: buildPartnerOutboundHref('affiliate', '/community', 'decathlon'),
      external: true,
      disclosure: '제휴 링크',
    },
    {
      id: 'community-guide',
      badge: '공개 가이드',
      title: '완주 준비 체크 가이드',
      description: '후기와 질문에서 자주 나오는 준비 포인트를 정리한 공개 페이지입니다.',
      ctaLabel: '가이드 읽기',
      href: '/gear',
      disclosure: '일부 섹션에 제휴 링크가 포함됩니다.',
    },
  ];
}

export function getRaceDetailPromoSlots(race: RaceDetailItem): PromoSlot[] {
  return [
    {
      id: `race-guide-${race.sourceRaceId}`,
      badge: '제휴 가이드',
      title: '대회 전날 준비물 다시 보기',
      description: `${race.title} 참가 전에 체크하기 좋은 준비물과 기록 장비 가이드를 공개 페이지로 정리했습니다.`,
      ctaLabel: '준비물 가이드 보기',
      href: '/gear',
      disclosure: '일부 링크는 제휴 링크로 연결될 수 있습니다.',
    },
    {
      id: `race-sponsored-${race.sourceRaceId}`,
      badge: '스폰서',
      title: '레이스 페이스 기록 도구 살펴보기',
      description: '러닝 워치, 기록 도구 같은 스폰서형 정보 슬롯입니다. 공식 브랜드 홈으로 이동합니다.',
      ctaLabel: '스폰서 정보 보기',
      href: buildPartnerOutboundHref('sponsored', `/races/${race.sourceRaceId}`, 'garmin'),
      external: true,
      disclosure: '광고 · 스폰서 링크',
    },
  ];
}

const featuredTemplates = [
  {
    eyebrow: 'Featured Listing',
    summary: '지금 눈여겨볼 대회로 먼저 보여주는 시범 노출 영역입니다.',
  },
  {
    eyebrow: '지역 추천',
    summary: '같은 흐름에서 함께 비교하기 좋은 대회를 눈에 띄게 노출합니다.',
  },
];

export function pickFeaturedRaces(races: RaceListItem[], limit = 2): FeaturedRacePlacement[] {
  const source = races.filter((race) => race.registrationStatus === 'open');
  const pool = source.length > 0 ? source : races;
  const placements: FeaturedRacePlacement[] = [];
  const usedIds = new Set<string>();
  const usedRegions = new Set<string>();

  for (const template of featuredTemplates.slice(0, limit)) {
    const candidate =
      pool.find((race) => !usedIds.has(race.id) && race.region && !usedRegions.has(race.region)) ??
      pool.find((race) => !usedIds.has(race.id));

    if (!candidate) {
      break;
    }

    placements.push({
      race: candidate,
      eyebrow: template.eyebrow,
      summary: template.summary,
    });
    usedIds.add(candidate.id);
    if (candidate.region) {
      usedRegions.add(candidate.region);
    }
  }

  return placements;
}
