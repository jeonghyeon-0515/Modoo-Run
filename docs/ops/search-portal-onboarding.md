# Search Console / Naver Search Advisor 등록 가이드

작성일: 2026-04-09  
기준 운영 주소: `https://modoo-run.vercel.app`

## 1. 현재 서비스에서 이미 준비된 것

- `https://modoo-run.vercel.app/robots.txt`
- `https://modoo-run.vercel.app/sitemap.xml`
- 대회 상세 canonical / Open Graph / `Event` JSON-LD
- 선택형 verification meta env 지원
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  - `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`

즉, 지금 남은 일은 **포털 등록과 소유 확인, 사이트맵 제출**입니다.

---

## 2. 등록 방법 비교

### 방법 A — 현재 `vercel.app` 주소 그대로 URL-prefix 등록
- 장점: 지금 바로 진행 가능
- 단점: 프로토콜/호스트 단위라 추후 커스텀 도메인 전환 시 다시 등록해야 할 수 있음

### 방법 B — 커스텀 도메인 연결 후 Domain property/DNS 검증
- 장점: 장기적으로 가장 깔끔함
- 단점: 지금은 커스텀 도메인이 없으면 바로 진행할 수 없음

### 방법 C — HTML 파일 검증
- 장점: 메타 태그를 쓰기 어려운 환경에서 대안이 됨
- 단점: 현재 앱 구조에서는 메타 태그 방식보다 운영 관리가 번거로움

## 선택
- **지금은 방법 A**
- **커스텀 도메인을 붙인 뒤에는 방법 B로 확장**

선택 이유:
- 현재 대표 주소가 `modoo-run.vercel.app` 이므로 DNS 기반 Domain property보다 **URL-prefix + 메타 검증**이 현실적입니다.

---

## 3. Google Search Console 등록 절차

참고:
- 소유 확인 가이드: https://support.google.com/webmasters/answer/9008080
- sitemap 개요: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

### 권장 절차
1. Search Console에서 **URL-prefix property** 로 `https://modoo-run.vercel.app/` 추가
2. 소유 확인 단계에서 **HTML 메타 태그 방식**을 선택
3. 발급된 토큰 값을 Vercel 환경변수에 추가
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token>`
4. 재배포 후 `View Source` 또는 브라우저 개발자도구에서 검증 메타 태그 노출 확인
5. Search Console에서 소유 확인 완료
6. `Sitemaps` 메뉴에 `https://modoo-run.vercel.app/sitemap.xml` 제출
7. 대표 페이지(`/`, `/races`, 주요 상세 URL`)를 URL 검사로 한 번씩 점검

### 현재 주소 기준 주의점
- `modoo-run.vercel.app` 는 기본 Vercel 서브도메인이므로, **지금은 URL-prefix 방식이 더 현실적**입니다.
- 나중에 `example.com` 같은 커스텀 도메인을 연결하면 그때는 **Domain property + DNS verification** 으로 확장하는 편이 좋습니다.

---

## 4. Naver Search Advisor 등록 절차

참고:
- 시작하기: https://searchadvisor.naver.com/start
- SEO 기본 가이드: https://searchadvisor.naver.com/guide/seo-help
- 페이지 갱신 요청(IndexNow): https://searchadvisor.naver.com/guide/indexnow-api-key

### 권장 절차
1. Search Advisor에서 사이트 `https://modoo-run.vercel.app/` 등록
2. 소유 확인 단계에서 제공되는 **메타 태그 토큰** 값을 확인
3. Vercel 환경변수에 추가
   - `NEXT_PUBLIC_NAVER_SITE_VERIFICATION=<token>`
4. 재배포 후 head 메타 태그 반영 확인
5. Search Advisor에서 소유 확인 완료
6. 사이트맵 / robots 확인
   - `https://modoo-run.vercel.app/sitemap.xml`
   - `https://modoo-run.vercel.app/robots.txt`
7. 검색 반영이 늦는 주요 페이지는 필요 시 IndexNow 갱신 요청 검토

---

## 5. Vercel 환경변수 체크리스트

| 이름 | 용도 | 공개 범위 |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | canonical / absolute URL 기준 | Public |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console 메타 검증 | Public |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Search Advisor 메타 검증 | Public |

권장값:
- `NEXT_PUBLIC_APP_URL=https://modoo-run.vercel.app`

---

## 6. 등록 후 바로 확인할 것

1. `robots.txt` 200 응답
2. `sitemap.xml` 200 응답
3. 상세 페이지 `<title>` / description / canonical 확인
4. 대표 대회 상세에 `Event` schema 남아 있는지 확인
5. Search Console / Search Advisor에서 사이트맵 제출 성공 여부 확인

---

## 7. 추후 확장

1. 커스텀 도메인 연결
2. Google Domain property 전환
3. Naver IndexNow 자동화 workflow 추가
4. Search Console / Naver 리포트 주간 자동화

---

## 8. 운영자가 직접 해야 할 일

아래 항목은 계정 소유권과 토큰 발급이 필요해서 제가 대신 끝낼 수 없습니다.

### 필수
1. **Google Search Console**
   - `https://modoo-run.vercel.app/` 를 URL-prefix property로 추가
   - 발급된 메타 토큰을 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 으로 Vercel에 입력
2. **Naver Search Advisor**
   - `https://modoo-run.vercel.app/` 등록
   - 발급된 메타 토큰을 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` 으로 Vercel에 입력
3. 입력 후 **재배포 또는 환경변수 재적용**
4. 두 포털에서 `sitemap.xml` 제출

### 선택
5. Preview 환경에도 같은 verification env 반영
6. 커스텀 도메인을 붙일 계획이면 이후 Domain property로 재등록
