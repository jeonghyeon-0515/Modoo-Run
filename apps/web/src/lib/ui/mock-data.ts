export const summaryStats = [
  { label: '이번 달 완료율', value: '68%', tone: 'info' as const },
  { label: '관심 대회', value: '4개', tone: 'neutral' as const },
  { label: '다가오는 레이스', value: 'D-18', tone: 'warning' as const },
];

export const featuredRaces = [
  {
    id: 'seoul-spring-race',
    title: '2026 서울봄꽃레이스',
    date: '2026.04.05 (일)',
    location: '신정교 하부 육상트랙구장',
    course: '10km · 5km',
    status: '접수중',
    note: '가볍게 시즌을 시작하기 좋은 도심 러닝',
  },
  {
    id: 'the-race-seoul-21k',
    title: '2026 THE RACE SEOUL 21K',
    date: '2026.04.05 (일)',
    location: '광화문광장(예정)',
    course: '하프 · 10km',
    status: '접수중',
    note: '하프 도전자를 위한 대표 봄 시즌 레이스',
  },
  {
    id: 'yangsan-run10',
    title: '2026 JUST RUN10 양산 10K 러닝',
    date: '2026.05.16 (토)',
    location: '양산 가산수변공원 일원',
    course: '10km · 5km',
    status: '마감임박',
    note: '주말 10K 목표를 잡기 좋은 중거리 이벤트',
  },
];

export const filterGroups = {
  region: ['서울', '경기', '인천', '강원', '충남'],
  month: ['4월', '5월', '6월'],
  distance: ['5km', '10km', '하프', '풀'],
  status: ['접수중', '마감임박'],
};

export const planHighlights = [
  { day: '월', title: '회복 런', meta: '5km · 가볍게', status: '완료' },
  { day: '수', title: '템포 런', meta: '8km · 목표 페이스', status: '부분 완료' },
  { day: '토', title: '롱런', meta: '14km · 대회 준비', status: '예정' },
];

export const communityPosts = [
  {
    id: 'race-prep-checklist',
    category: '대회 준비',
    title: '10km 첫 참가 전날 체크리스트 공유합니다',
    author: '준비하는러너',
    meta: '댓글 12 · 좋아요 28',
  },
  {
    id: 'spring-race-review',
    category: '후기',
    title: '서울봄꽃레이스 10km 후기와 코스 팁',
    author: '달리는하루',
    meta: '댓글 8 · 좋아요 19',
  },
  {
    id: 'weekly-plan-routine',
    category: '자유게시판',
    title: '직장인 주 3회 러닝 루틴 어떻게 짜세요?',
    author: '퇴근후러닝',
    meta: '댓글 15 · 좋아요 14',
  },
];

export const raceDetail = {
  title: '2026 THE RACE SEOUL 21K',
  status: '접수중',
  date: '2026년 4월 5일 오전 8시',
  registration: '2026년 2월 20일 ~ 2026년 3월 28일',
  region: '서울',
  location: '광화문광장(예정)',
  course: '하프 · 10km',
  organizer: '헤럴드경제',
  homepage: 'https://example.com',
  fetchedAt: '2026-04-07 20:45 KST',
  intro:
    '도심 중심 코스를 기반으로 하프와 10km를 함께 운영하는 봄 시즌 대표 레이스. 참가 전 일정과 이동 동선을 미리 확인하는 것이 좋습니다.',
};

export const communityDetail = {
  category: '대회 준비',
  title: '10km 첫 참가 전날 체크리스트 공유합니다',
  author: '준비하는러너',
  createdAt: '2026.04.06 21:10',
  content:
    '저는 전날에 배번호, 양말, 젤, 기록용 워치까지 미리 가방에 넣어둡니다. 아침 이동 시간을 줄이는 게 생각보다 큰 도움이 되더라고요.',
  comments: [
    { author: '달리는하루', content: '핀과 작은 비닐봉지도 챙기면 좋더라고요.' },
    { author: '루틴메이커', content: '출발 2시간 전 간단한 식사도 추천합니다.' },
  ],
};
