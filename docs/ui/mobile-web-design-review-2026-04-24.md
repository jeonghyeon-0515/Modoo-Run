# 모바일 + 일반 웹 디자인 리뷰 — 2026-04-24

## 1. 리뷰 범위
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/layout/page-shell.tsx`
- `apps/web/src/components/layout/service-tabs.tsx`
- `apps/web/src/components/layout/bottom-nav.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/races/page.tsx`
- `apps/web/src/app/races/[raceId]/page.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/app/plan/page.tsx`

기준:
- Vercel Web Interface Guidelines 최신 체크리스트
- 모바일 웹 + 일반 웹(데스크톱) 동시 운영 관점

## 2. 재점검 총평
첫 리뷰 때 잡은 포인트는 유효했고, 2차 점검에서 공통 레이아웃 레벨의 누락이 더 분명하게 보였습니다. 특히 `skip link`, `safe-area`, `themeColor`, `reduced motion`, `focus-visible`, `autocomplete` 계열은 화면 하나의 문제가 아니라 전체 서비스 품질에 영향을 주는 공통 이슈입니다.

전체적으로는:
- 모바일에서는 `터치 밀도`, `CTA 우선순위`, `첫 화면 정보량` 문제가 큽니다.
- 일반 웹에서는 `정보 그룹 간 위계`, `가로 레일 affordance`, `폼 접근성`, `상태 전환 피드백 품질`이 아쉽습니다.

## 3. 이번 재점검에서 추가로 확인된 부족한 부분
- `apps/web/src/app/layout.tsx:6-23` — `themeColor` 메타데이터가 보이지 않습니다.
- `apps/web/src/app/layout.tsx:25-40` — 루트에 `skip link`가 없습니다.
- `apps/web/src/app/layout.tsx:33-40`, `apps/web/src/app/globals.css:36-41`, `apps/web/src/components/layout/bottom-nav.tsx:21-37` — safe-area inset 대응이 보이지 않습니다.
- `apps/web/src/app/globals.css:78-299` — 로딩 바/토스트/스피너 애니메이션에 `prefers-reduced-motion` 대응이 없습니다.
- `apps/web/src/components/layout/service-tabs.tsx:23-38` — 상단 탭이 가로 스크롤이지만 스크롤 가능성에 대한 힌트가 약합니다.
- `apps/web/src/components/layout/bottom-nav.tsx:21-37` — 하단 고정 내비게이션이 safe-area 없이 붙어 있어 모바일 기기에서 답답할 수 있습니다.
- `apps/web/src/app/community/page.tsx:131-180`, `apps/web/src/app/plan/page.tsx:169-223` — 입력 필드에 `autocomplete`, `inputMode`, `spellCheck` 같은 기본 힌트가 거의 없습니다.

## 4. 화면별 Before / After

### A. 공통 레이아웃 / 셸
관련 파일:
- `apps/web/src/app/layout.tsx:6-40`
- `apps/web/src/app/globals.css:32-41`
- `apps/web/src/components/layout/page-shell.tsx:29-143`
- `apps/web/src/components/layout/service-tabs.tsx:22-41`
- `apps/web/src/components/layout/bottom-nav.tsx:21-37`

**Before**
- 루트 차원의 접근성 진입점이 없습니다. (`layout.tsx:25-40`)
- 모바일 브라우저 상단/하단 안전영역 보정이 보이지 않습니다. (`layout.tsx:33-40`, `globals.css:36-41`, `bottom-nav.tsx:21-37`)
- 상단 탭과 하단 탭은 동작은 단순하지만, 포커스/활성 상태가 강하게 드러나지 않습니다. (`service-tabs.tsx:23-38`, `bottom-nav.tsx:24-34`)
- 여러 로딩 애니메이션이 존재하지만 reduced motion 고려가 없습니다. (`globals.css:78-299`)

**After**
- `main` 바로 가는 skip link를 루트에 추가합니다.
- 루트/헤더/하단 고정 내비에 `padding-top/bottom: env(safe-area-inset-*)` 계열을 반영합니다.
- `themeColor`를 페이지 배경과 맞춰 모바일 브라우저 크롬 톤을 정리합니다.
- `:focus-visible` 기준의 공통 포커스 스타일을 링크/버튼/칩/탭에 통일합니다.
- `prefers-reduced-motion`일 때 로딩 바/토스트/스피너 애니메이션을 축소 또는 제거합니다.

**영향**
- 모바일: 홈 인디케이터/노치 기기에서 완성도 개선
- 일반 웹: 키보드 탐색성과 상태 인지가 개선

---

### B. 홈
관련 파일:
- `apps/web/src/app/page.tsx:35-61`

**Before**
- 카드 전체 클릭 패턴이 강하고 CTA 텍스트는 상대적으로 약합니다. (`page.tsx:37-45`, `page.tsx:49-57`)
- 모바일에서는 첫 카드가 높고 조밀해서 첫 뷰포트 소비가 큽니다. (`page.tsx:39-45`)
- 일반 웹에서는 “무엇을 누르면 어디로 가는지”보다 카드 자체가 먼저 보입니다. CTA의 명시성이 약합니다. (`page.tsx:44`, `page.tsx:57`)

**After**
- 카드 전체 클릭은 유지하되, 하단 CTA를 버튼형 또는 더 강한 라벨로 분리합니다.
- 모바일에서는 첫 카드 본문 길이를 줄이고 액션을 더 빨리 보이게 합니다.
- 일반 웹에서는 대표 카드 1개 + 보조 카드 2개의 위계를 더 분명히 해, 시선이 제목 → 설명 → 행동으로 흐르게 만듭니다.

**추천 방향**
- 모바일: 카드 높이 축소, CTA 선명화
- 일반 웹: 카드 간 역할 차이를 더 분명히 표현

---

### C. 대회 목록
관련 파일:
- `apps/web/src/app/races/page.tsx:76-97`
- `apps/web/src/app/races/page.tsx:232-295`
- `apps/web/src/app/races/page.tsx:330-389`

**Before**
- 필터 칩이 작고 촘촘합니다. 모바일에서 반복 탭하기 부담됩니다. (`races/page.tsx:88-95`)
- 빠른 링크 레일은 가로 스크롤이지만 넘겨볼 수 있다는 힌트가 약합니다. (`races/page.tsx:242-251`)
- 고급 필터가 `<details>` 안에 한 번에 몰려 있어 모바일에서 인지 부담이 큽니다. (`races/page.tsx:289-295`)
- `조건 초기화`가 약한 텍스트 링크라 필터 해제 동선이 눈에 잘 안 띕니다. (`races/page.tsx:270-273`)
- 카드 메타가 `장소 · 종목 · 접수` 식으로 압축돼 모바일/데스크톱 모두 스캔성이 떨어집니다. (`races/page.tsx:354-360`)
- 보조 CTA인 `자세히 보기 →`가 너무 작아 행동 유도가 약합니다. (`races/page.tsx:367-369`)

**After**
- 상태 필터와 세부 필터를 시각적으로 분리하고, 칩 높이/간격을 키웁니다.
- 빠른 링크 레일에 시작/끝 fade, 일부 잘림, “옆으로 더 보기” 힌트를 넣어 스크롤 가능성을 보여줍니다.
- 모바일에서는 필터를 단계적으로, 일반 웹에서는 2열 이상으로 정리해 밀도를 나눕니다.
- `조건 초기화`를 버튼 수준으로 올려 현재 필터 상태와 더 가까이 배치합니다.
- 카드 메타는 2줄 구조로 나눠 `장소`와 `종목/접수`의 위계를 명확히 합니다.
- 카드 하단 보조 액션을 더 명확한 버튼/링크 스타일로 강화합니다.

**추천 방향**
- 모바일: 필터 탐색 피로 감소가 최우선
- 일반 웹: 많은 정보를 보여주더라도 그룹 간 구분을 더 선명하게

---

### D. 대회 상세
관련 파일:
- `apps/web/src/app/races/[raceId]/page.tsx:181-190`
- `apps/web/src/app/races/[raceId]/page.tsx:192-278`
- `apps/web/src/app/races/[raceId]/page.tsx:300-417`

**Before**
- 상단 뒤로가기 CTA가 길고 먼저 보여 작은 화면에서 공간을 먹습니다. (`[raceId]/page.tsx:181-190`)
- 히어로 내부 액션이 한 줄에 많이 몰려 핵심 행동이 묻힙니다. (`[raceId]/page.tsx:221-278`)
- `주최 측 안내`, `공식 홈페이지`, `지도`, `캘린더`, `ICS`, `비교`가 같은 톤으로 섞여 우선순위가 흐립니다. (`[raceId]/page.tsx:232-277`)
- 스폰서/제휴 블록이 핵심 정보 흐름 초반에 등장합니다. (`[raceId]/page.tsx:300-325`)
- 일반 웹에서도 정보는 풍부하지만 “어디부터 읽어야 하는지”보다 “무엇이 많은지”가 먼저 느껴집니다.

**After**
- 최상단 행동은 `바로 지원하기` 1개를 명확히 띄우고, 나머지는 2차 액션 그룹으로 분리합니다.
- 모바일에서는 보조 액션을 접거나 2열 버튼군으로 재구성합니다.
- 일반 웹에서는 `핵심 정보 / 보조 링크 / 도구성 액션`으로 구역을 나눕니다.
- 스폰서/제휴 블록은 지도/관련 대회 아래로 내리거나 노출 강도를 낮춥니다.
- 뒤로가기는 아이콘형+짧은 라벨로 축소해 상단 공간을 줄입니다.

**추천 방향**
- 모바일: CTA 수를 줄이고 우선순위를 더 선명하게
- 일반 웹: 정보량은 유지하되 구역별 의미를 더 분리

---

### E. 커뮤니티
관련 파일:
- `apps/web/src/app/community/page.tsx:92-107`
- `apps/web/src/app/community/page.tsx:110-231`
- `apps/web/src/app/community/page.tsx:234-293`

**Before**
- 모바일에서 작성/프로모션/사이드 성격 콘텐츠가 피드보다 먼저 길게 나옵니다. (`community/page.tsx:110-231`)
- 피드 상단 상태 바도 첫 화면 공간을 추가로 차지합니다. (`community/page.tsx:235-238`)
- 작성 폼은 라벨은 있지만 포커스 강조와 폼 힌트가 약합니다. (`community/page.tsx:131-180`)
- 일반 웹에서는 2단 레이아웃이 자연스럽지만, 현재는 우측 보조 정보의 존재감이 메인 피드와 꽤 비슷합니다. (`community/page.tsx:202-231`)

**After**
- 모바일에서는 `카테고리 → 피드 → 작성/프로모션` 순으로 재배치합니다.
- 일반 웹에서는 2단 구조를 유지하되, 우측 보조영역 시각 밀도를 낮춥니다.
- 작성 CTA는 통계 카드 안의 상태 설명보다 직접 행동을 유도하는 방식으로 바꿉니다.
- 입력 필드에 `autocomplete`, `spellCheck`, 명확한 포커스 스타일을 보강합니다.

**추천 방향**
- 모바일: 읽기 흐름 우선
- 일반 웹: 보조 영역은 유지하되 주연/조연 차이를 더 크게

---

### F. 플랜
관련 파일:
- `apps/web/src/app/plan/page.tsx:147-249`
- `apps/web/src/app/plan/page.tsx:252-379`
- `apps/web/src/app/plan/page.tsx:381-468`

**Before**
- 모바일에서 생성 흐름과 새 일정 추가가 아래로 밀려 첫 행동이 늦게 보입니다. (`plan/page.tsx:252-468`)
- 상태 버튼 4개가 반복 카드마다 촘촘하게 붙어 있습니다. (`plan/page.tsx:289-305`)
- 편집 UI가 `<details>` 내부에 중첩되어 조작 깊이가 깊습니다. (`plan/page.tsx:308-374`)
- 저장/삭제가 가까워 모바일에서 실수 여지가 있습니다. (`plan/page.tsx:228-245`, `plan/page.tsx:358-371`)
- 입력 필드에 `autocomplete`/`inputMode` 힌트가 거의 없습니다. (`plan/page.tsx:169-223`, `plan/page.tsx:313-355`, `plan/page.tsx:388-427`)
- 일반 웹에서는 정보량 자체는 괜찮지만, 작성/수정/상태 변경이 한 화면에 너무 많이 섞여 있습니다.

**After**
- 모바일에서는 `이번 달 요약 → 새 일정 추가 → 일정 목록` 순으로 우선순위를 바꿉니다.
- 상태 변경은 segmented control 또는 드롭다운으로 축약합니다.
- 편집은 인라인 전체 노출보다 별도 화면/시트/모달로 분리하는 쪽이 낫습니다.
- 삭제는 위험 액션 구역으로 분리하고 확인 단계 또는 undo를 둡니다.
- 거리/시간 입력은 `inputMode="decimal"`, `inputMode="numeric"` 등 기본 힌트를 넣습니다.

**추천 방향**
- 모바일: 작성/수정 밀도 분산
- 일반 웹: 편집 도구는 많되, 동시에 다 보이지 않게 정리

## 5. 공통 가이드라인 이슈 정리
- 접근성
  - `skip link` 부재: `apps/web/src/app/layout.tsx:25-40`
  - 공통 포커스 가시성 부족: `apps/web/src/app/plan/page.tsx:172-223`, `apps/web/src/app/community/page.tsx:136-180`
- 폼
  - `autocomplete`, `inputMode`, `spellCheck` 힌트 부족: `apps/web/src/app/community/page.tsx:131-180`, `apps/web/src/app/plan/page.tsx:169-223`
- 모션
  - reduced motion 대응 없음: `apps/web/src/app/globals.css:78-299`
- 내비게이션/레이아웃
  - safe-area 대응 부족: `apps/web/src/app/layout.tsx:33-40`, `apps/web/src/components/layout/bottom-nav.tsx:21-37`
  - 가로 스크롤 탭/레일 affordance 약함: `apps/web/src/components/layout/service-tabs.tsx:23-38`, `apps/web/src/app/races/page.tsx:242-251`
- CTA/정보 구조
  - 홈/대회목록/상세/플랜 전반에서 행동 우선순위가 다소 흐립니다.

## 6. 추천 개선 순서
1. 루트 공통 품질부터 정리: `skip link`, `themeColor`, `safe-area`, `focus-visible`, `reduced motion`
2. 대회 목록 필터 UX 재정리: 칩 크기, 리셋, 가로 레일 affordance, 카드 메타 위계
3. 대회 상세 CTA 계층 재설계: 1차/2차 액션 분리, 스폰서 블록 위치 재조정
4. 플랜 작성/수정 흐름 단순화: 상태 변경/편집/삭제 분리
5. 커뮤니티 모바일 순서 조정: 피드 우선, 프로모션 후순위
6. 홈 CTA 선명도 개선: 카드 전체 클릭은 유지하되 행동 목적은 더 분명하게

## 7. 한 줄 결론
지금 구조는 “기능은 많고 화면도 채워져 있는” 상태에 가깝고, 다음 단계는 모바일과 일반 웹 모두에서 **무엇을 먼저 보고, 무엇을 바로 누를지**가 더 자연스럽게 드러나도록 공통 레이어와 각 화면의 위계를 다듬는 것입니다.
