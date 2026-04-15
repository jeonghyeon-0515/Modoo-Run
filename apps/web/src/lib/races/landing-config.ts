export type RaceLandingKey =
  | 'closing-soon'
  | 'seoul-metro'
  | 'busan-yeongnam'
  | '10k'
  | 'half-full';

export type RaceLandingConfig = {
  key: RaceLandingKey;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  helperText: string;
  emptyMessage: string;
  listTitle: string;
};

export const raceLandingPages: RaceLandingConfig[] = [
  {
    key: 'closing-soon',
    path: '/races/closing-soon',
    eyebrow: '접수 마감 임박',
    title: '이번 주 접수 마감 러닝 대회',
    description: '접수 마감이 가까운 국내 러닝 대회를 빠르게 확인하세요.',
    helperText: '접수중 대회 중 마감일이 가까운 일정부터 정리했습니다.',
    emptyMessage: '이번 주 접수 마감으로 분류된 대회가 없습니다.',
    listTitle: '마감이 가까운 대회',
  },
  {
    key: 'seoul-metro',
    path: '/races/regions/seoul',
    eyebrow: '서울 · 수도권',
    title: '서울·수도권 마라톤 대회',
    description: '서울, 경기, 인천에서 열리는 접수중 러닝 대회를 모았습니다.',
    helperText: '이동 부담이 낮은 수도권 접수중 대회를 우선 보여드립니다.',
    emptyMessage: '현재 서울·수도권 접수중 대회가 없습니다.',
    listTitle: '서울·수도권 접수중 대회',
  },
  {
    key: 'busan-yeongnam',
    path: '/races/regions/busan',
    eyebrow: '부산 · 영남',
    title: '부산·영남 마라톤 대회',
    description: '부산, 울산, 대구, 경남, 경북에서 열리는 러닝 대회를 확인하세요.',
    helperText: '영남권 러너가 비교하기 쉬운 접수중 일정을 모았습니다.',
    emptyMessage: '현재 부산·영남 접수중 대회가 없습니다.',
    listTitle: '부산·영남 접수중 대회',
  },
  {
    key: '10k',
    path: '/races/distances/10k',
    eyebrow: '10K 추천',
    title: '10K 마라톤 대회',
    description: '첫 대회나 기록 도전에 적합한 10K 러닝 대회를 모았습니다.',
    helperText: '종목 정보에 10K가 포함된 접수중 대회를 일정순으로 정리했습니다.',
    emptyMessage: '현재 10K로 분류된 접수중 대회가 없습니다.',
    listTitle: '10K 접수중 대회',
  },
  {
    key: 'half-full',
    path: '/races/distances/half-full',
    eyebrow: '하프 · 풀',
    title: '하프·풀코스 마라톤 대회',
    description: '하프, 풀코스 도전을 준비하는 러너를 위한 접수중 대회를 확인하세요.',
    helperText: '종목 정보에 하프 또는 풀코스가 포함된 대회를 모았습니다.',
    emptyMessage: '현재 하프·풀코스로 분류된 접수중 대회가 없습니다.',
    listTitle: '하프·풀코스 접수중 대회',
  },
];

export function getRaceLandingConfig(key: RaceLandingKey) {
  const config = raceLandingPages.find((item) => item.key === key);
  if (!config) {
    throw new Error(`알 수 없는 대회 랜딩 키입니다: ${key}`);
  }
  return config;
}
