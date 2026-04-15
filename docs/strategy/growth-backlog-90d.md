# Modoo-Run 성장 백로그 90일

작성일: 2026-04-09  
기준 전략 문서: `docs/strategy/growth-monetization-seo-90d.md`

---

## 운영 원칙
- 우선순위는 **재방문 락인 → 검색 유입 확장 → 저간섭 수익화 → B2B 실험**
- 광고는 대회 선택/상세 핵심 화면보다 **정보형 콘텐츠 화면**에 우선 적용
- Google / Naver 공식 가이드를 어기지 않는 범위에서만 SEO 자동화를 추가

---

## Epic A. 기술 SEO 기반

| ID | 우선순위 | 작업 | 성공 기준 | GitHub Actions |
|---|---|---|---|---|
| A1 | P0 | Search Console 연결 | 사이트맵 제출, 색인 현황 확인 가능 | 수동 |
| A2 | P0 | Naver Search Advisor 등록/소유확인 | 수집/색인/진단 리포트 확인 가능 | 수동 |
| A3 | P0 | `robots.ts`, `sitemap.ts` 운영 | robots/sitemap live 응답 정상 | 완료 |
| A4 | P0 | 대회 상세 `generateMetadata()` | 대회별 고유 title/description/canonical 적용 | 완료 |
| A5 | P0 | Event JSON-LD 적용 | 상세 HTML에 Event schema 노출 | 완료 |
| A6 | P0 | SEO Audit workflow 운영 | PR/스케줄 기준 기본 SEO 누락 감지 | 완료 |
| A7 | P1 | Organization / WebSite schema 추가 | 루트 HTML에 조직/사이트 스키마 노출 | 완료 |
| A8 | P1 | Breadcrumb schema 추가 | 대회 상세 breadcrumb schema 노출 | 완료 |
| A9 | P1 | 페이지 갱신 요청(IndexNow/Naver) 루틴 | 변경 후 갱신 요청 자동/반자동 가능 | 완료 |
| A10 | P2 | SEO 리포트 자동 요약 | 주간 감사 로그 축적 | Actions 후보 |

### GitHub Actions 등록 항목
- [x] `seo-audit.yml`
- [x] `ci.yml`
- [x] `daily-race-sync.yml`
- [x] `outbound-click-report.yml`
- [x] `search-portal-verify.yml`
- [x] `indexnow-notify.yml`
- 차기 등록 후보:
  - [ ] 주간 Search Console/네이버 리포트 워크플로

---

## Epic B. 재방문 락인 기능

| ID | 우선순위 | 작업 | 성공 기준 | 비고 |
|---|---|---|---|---|
| B1 | P0 | 마감 임박 알림 | 저장 사용자 대상 7/3/1일 전 알림 | 핵심 락인 |
| B2 | P0 | 캘린더 내보내기 | Google/ICS 내보내기 가능 | 신청 전환 보조 |
| B3 | P0 | 외부 신청 클릭 계측 | 상세→외부 클릭률 확인 가능 | 수익화/SEO 연결 |
| B4 | P1 | 대회 비교 기능 | 일정/거리/접수기간/장소 비교 | 검색 랜딩 연결 |
| B5 | P1 | 개인화 추천 | 첫 10K/하프/여행형 추천 | 재방문 강화 |
| B6 | P1 | 저장한 대회 변경 알림 | 일정/접수 변경 감지 | 신뢰 강화 |
| B7 | P2 | 주간 digest | 추천/마감/저장 대회 요약 | 이메일/카카오 |

---

## Epic C. 검색 유입형 콘텐츠

| ID | 우선순위 | 작업 | 성공 기준 | 비고 |
|---|---|---|---|---|
| C1 | P0 | 이번 주 접수 마감 허브 | 주간 검색 유입 확보 | 완료 |
| C2 | P0 | 서울/수도권 대회 허브 | 지역 키워드 유입 | 완료 |
| C3 | P0 | 부산/영남 대회 허브 | 지역 키워드 유입 | 완료 |
| C4 | P0 | 10K 추천 허브 | 초보 검색 의도 대응 | 완료 |
| C5 | P0 | 하프/풀 추천 허브 | 숙련 검색 의도 대응 | 완료 |
| C6 | P1 | 초보자 대회 준비 가이드 | helpful content 확보 | 제휴 연결 |
| C7 | P1 | 대회 준비물/장비 가이드 | 제휴 수익 실험 | 제휴 콘텐츠 |
| C8 | P1 | 시즌별 추천 페이지 | 봄/가을 대회 유입 | 시즌성 |
| C9 | P2 | FAQ/후기 요약형 페이지 | 롱테일 확장 | structured data 후보 |

---

## Epic D. 수익화 실험

| ID | 우선순위 | 작업 | 성공 기준 | 비고 |
|---|---|---|---|---|
| D1 | P0 | 제휴 카테고리 선정 | 3개 카테고리 확정 | 러닝화/워치/회복 |
| D2 | P0 | 제휴 링크 삽입 가이드 | 광고와 혼동 없는 배치 기준 문서화 | UX 보호 |
| D3 | P1 | 제휴 콘텐츠 10개 발행 | 제휴 CTR 측정 시작 | Coupang Partners 포함 |
| D4 | P1 | 저밀도 광고 파일럿 | 정보형 페이지 하단만 테스트 | 정책 준수 |
| D5 | P1 | featured listing 상품안 | 가격/노출 위치/표기 기준 확정 | B2B 전 단계 |
| D6 | P2 | 뉴스레터 스폰서 파일럿 | 첫 제안서 발송 | B2B |

---

## Epic E. B2B / 파트너십

| ID | 우선순위 | 작업 | 성공 기준 | 비고 |
|---|---|---|---|---|
| E1 | P1 | 주최측 수정 요청 폼 | 잘못된 정보 수정 루프 확보 | 데이터 신뢰 |
| E2 | P2 | 주최측 직접 등록 폼 | 수동 등록 프로세스 시작 | 판매 전 단계 |
| E3 | P2 | featured race 운영 가이드 | 스폰서 표기/정책 정리 | 법적/신뢰 고려 |
| E4 | P2 | 러닝 크루 제휴 목록화 | 지역 크루 10곳 접촉 | 홍보 채널 |

---

## 30 / 60 / 90일 정렬

### 0~30일
- A1, A2, A3, A4, A5, A6
- B1 설계, B2 설계, B3 구현
- C1~C5 기획/우선 발행
- D1, D2

### 31~60일
- B2, B4, B5
- C6, C7, C8
- D3, D4
- E1

### 61~90일
- B6, B7
- C9
- D5, D6
- E2, E3, E4

---

## GitHub Actions로 이미 등록했거나 등록이 필요한 항목

### 등록 완료
1. **SEO Audit**
   - 파일: `.github/workflows/seo-audit.yml`
   - 목적: robots, sitemap, metadata, structured data, 전략 문서 존재 여부 점검
2. **Web CI**
   - 파일: `.github/workflows/ci.yml`
   - 목적: test / typecheck / lint / build 기본 검증
3. **Daily Race Sync**
   - 파일: `.github/workflows/daily-race-sync.yml`
   - 목적: 일일 대회 동기화 실행
4. **Outbound Click Report**
   - 파일: `.github/workflows/outbound-click-report.yml`
   - 목적: 외부 클릭/조회 리포트 생성
5. **Search Portal Verify**
   - 파일: `.github/workflows/search-portal-verify.yml`
   - 목적: robots / sitemap / verification meta 점검
6. **IndexNow Notify**
   - 파일: `.github/workflows/indexnow-notify.yml`
   - 목적: daily sync 이후 Naver IndexNow 제출

### 다음 등록 후보
7. **주간 SEO/성장 리포트**
   - 조건: Search Console / Analytics / Naver 데이터 접근 방식 확정
8. **콘텐츠 신선도 점검**
   - 오래된 허브/랜딩 문서 갱신 알림

---

## 바로 실행 추천
1. A1/A2 진행 현황 확인
2. B3 외부 신청 클릭 계측 구현
3. C1~C5 랜딩 페이지 우선순위 확정
4. D1/D2 제휴 가이드 문서화
5. E1 주최측 수정 요청 폼 추가
