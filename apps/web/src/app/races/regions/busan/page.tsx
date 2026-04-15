import type { Metadata } from 'next';
import { RaceLandingPage } from '@/components/races/race-landing-page';
import { getRaceLandingConfig } from '@/lib/races/landing-config';

const config = getRaceLandingConfig('busan-yeongnam');

export const metadata: Metadata = {
  title: `${config.title} | 모두의 러닝`,
  description: config.description,
  alternates: {
    canonical: config.path,
  },
  openGraph: {
    title: config.title,
    description: config.description,
    url: config.path,
    siteName: '모두의 러닝',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function BusanYeongnamRacesPage() {
  return <RaceLandingPage landingKey="busan-yeongnam" />;
}
