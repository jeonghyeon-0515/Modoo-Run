# 모바일 + 일반 웹 디자인 P0 실행 체크리스트 — 2026-04-24

기준 문서:
- `docs/ui/mobile-web-design-review-2026-04-24.md`

목표:
- 모바일웹과 일반웹에서 공통으로 체감되는 가장 큰 품질 리스크만 먼저 정리한다.
- 화면별 구조 개편보다 먼저, 루트 접근성/포커스/안전영역/모션/기본 입력 품질을 안정화한다.

## P0 범위
이번 라운드에서 P0로 보는 항목은 아래 6가지다.
1. skip link 추가
2. `themeColor` 추가
3. safe-area 대응
4. reduced motion 대응
5. 공통 `focus-visible` 정리
6. 자주 누르는 컨트롤의 최소 터치 영역 확보

---

## 1. 루트 접근성 진입점 만들기
### 작업
- [ ] `apps/web/src/app/layout.tsx`에 skip link를 추가한다.
- [ ] `apps/web/src/components/layout/page-shell.tsx`의 `<main>`에 skip link가 연결될 수 있는 `id`를 부여한다.
- [ ] skip link는 키보드 포커스 시에만 보이도록 처리한다.

### 대상 파일
- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/layout/page-shell.tsx`
- `apps/web/src/app/globals.css`

### 완료 기준
- [ ] 키보드로 첫 Tab을 눌렀을 때 “본문으로 바로가기”가 노출된다.
- [ ] Enter 시 현재 화면의 메인 콘텐츠 영역으로 포커스가 이동한다.
- [ ] 모바일/데스크톱 모두 기존 레이아웃이 깨지지 않는다.

---

## 2. 모바일 브라우저 크롬 톤 맞추기
### 작업
- [ ] `apps/web/src/app/layout.tsx` metadata에 `themeColor`를 추가한다.
- [ ] 현재 서비스 배경과 충돌하지 않는 값으로 맞춘다.

### 대상 파일
- `apps/web/src/app/layout.tsx`

### 완료 기준
- [ ] 모바일 브라우저 상단 크롬 색이 페이지 배경 톤과 어색하게 분리되지 않는다.
- [ ] 라이트 테마 기준에서 헤더/배경과 시각적 이질감이 줄어든다.

---

## 3. safe-area 대응 넣기
### 작업
- [ ] 루트 레이아웃 또는 공통 셸에서 safe-area inset을 받을 수 있도록 기본 여백을 넣는다.
- [ ] 하단 고정 내비게이션에 `env(safe-area-inset-bottom)` 대응을 추가한다.
- [ ] 필요하면 sticky 헤더도 `env(safe-area-inset-top)` 영향을 고려한다.

### 대상 파일
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/layout/page-shell.tsx`
- `apps/web/src/components/layout/bottom-nav.tsx`

### 완료 기준
- [ ] iPhone 계열처럼 홈 인디케이터가 있는 화면에서도 하단 내비가 너무 바닥에 붙어 보이지 않는다.
- [ ] 상단 sticky 영역이 노치/상단 안전영역과 충돌하지 않는다.
- [ ] 모바일 세로 화면에서 CTA/내비 텍스트가 잘리지 않는다.

---

## 4. reduced motion 대응 추가
### 작업
- [ ] `apps/web/src/app/globals.css`에 `prefers-reduced-motion` 분기 스타일을 추가한다.
- [ ] 무한 반복 애니메이션(로딩 바, 토스트 펄스, shimmer, spinner)을 축소하거나 제거한다.
- [ ] `html { scroll-behavior: smooth; }`도 reduced motion일 때는 완화 또는 비활성화한다.

### 대상 파일
- `apps/web/src/app/globals.css`

### 완료 기준
- [ ] OS에서 motion 감소 설정이 켜진 경우 과한 움직임이 멈추거나 최소화된다.
- [ ] 로딩 상태는 유지되지만 시각 피로는 줄어든다.
- [ ] 일반 설정에서는 기존 인터랙션이 유지된다.

---

## 5. 공통 focus-visible 기준 통일
### 작업
- [ ] 링크, 버튼, 탭, 칩, 입력 필드에 공통 `focus-visible` 스타일을 정한다.
- [ ] `outline-none`만 있고 대체 포커스가 약한 입력 필드를 보강한다.
- [ ] 상단 탭/하단 내비/폼 입력에서 같은 수준의 포커스 인지가 되도록 맞춘다.

### 우선 대상 파일
- `apps/web/src/app/globals.css`
- `apps/web/src/components/layout/service-tabs.tsx`
- `apps/web/src/components/layout/bottom-nav.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/app/plan/page.tsx`

### 완료 기준
- [ ] 키보드 탐색 시 현재 포커스 위치가 확실히 보인다.
- [ ] 입력 필드에서 border-color 변화만으로 끝나지 않고 ring/outline 등 명확한 시각 피드백이 있다.
- [ ] 링크/버튼/칩/탭 사이에 포커스 스타일 품질 편차가 크지 않다.

---

## 6. 자주 누르는 컨트롤 터치 영역 확보
### 작업
- [ ] 대회 목록 필터 칩의 높이와 패딩을 키운다.
- [ ] 플랜 상태 버튼의 높이와 간격을 키우거나 더 누르기 쉬운 형태로 바꾼다.
- [ ] 상단 서비스 탭과 하단 내비도 최소 터치 영역 기준을 맞춘다.

### 우선 대상 파일
- `apps/web/src/app/races/page.tsx`
- `apps/web/src/app/plan/page.tsx`
- `apps/web/src/components/layout/service-tabs.tsx`
- `apps/web/src/components/layout/bottom-nav.tsx`

### 완료 기준
- [ ] 모바일에서 자주 누르는 칩/탭/상태 버튼이 최소 44px 안팎의 터치 영역을 가진다.
- [ ] 좁은 화면에서도 오탭 가능성이 줄어든다.
- [ ] 데스크톱에서는 기존 정보 밀도를 크게 해치지 않는다.

---

## 7. 있으면 같이 처리할 항목
아래는 P0와 붙여 처리하면 좋은 항목이다.
- [ ] `community/page.tsx`, `plan/page.tsx` 입력에 `autocomplete`, `inputMode`, `spellCheck`를 적절히 넣기
- [ ] 가로 스크롤 레일 affordance 보강 전, 최소한 포커스/터치 상태부터 먼저 정리하기

---

## 추천 작업 순서
1. `layout.tsx` + `page-shell.tsx` + `globals.css`로 공통 기반 먼저 정리
2. `bottom-nav.tsx` + `service-tabs.tsx`로 공통 내비 정리
3. `community/page.tsx` + `plan/page.tsx` 입력 포커스 정리
4. `races/page.tsx` + `plan/page.tsx` 자주 누르는 컨트롤 터치 영역 정리

## 이번 라운드 완료 정의
아래가 되면 P0 라운드는 끝난 것으로 본다.
- [ ] 키보드 첫 진입 경로가 있다.
- [ ] 모바일 safe-area가 적용된다.
- [ ] reduced motion 대응이 있다.
- [ ] 공통 focus-visible이 있다.
- [ ] 핵심 칩/탭/버튼이 모바일에서 누르기 어렵지 않다.
- [ ] 모바일/데스크톱 레이아웃이 기존보다 불안정해지지 않는다.
