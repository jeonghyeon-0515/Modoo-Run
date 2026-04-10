# 환경변수 및 운영 시크릿 정리

- 관련 이슈: #12 배포 환경변수와 운영 시크릿 구성을 정리한다
- 연관 이슈: #5 GitHub Actions로 매일 접수중 대회 데이터를 동기화한다
- 연관 이슈: #6 대회 수집 sync endpoint와 upsert 로직을 구현한다

## 1. 현재 선택한 운영 방향

현재 기준 운영 흐름은 다음과 같습니다.

1. **Vercel**에 Next.js 웹앱 배포
2. **Supabase**를 Auth / Postgres 백엔드로 사용
3. **GitHub Actions**가 매일 정해진 시각에 실행
4. GitHub Actions 러너에서 `apps/web`를 실행하고 로컬 Next.js 서버를 기동
5. GitHub Actions가 로컬의 내부 sync endpoint를 호출
6. 앱 서버가 외부 대회 데이터를 수집하고 Supabase에 upsert

즉, **GitHub Actions는 배포 도메인에 직접 붙지 않고, 러너 내부에서 앱을 실행한 뒤 로컬 sync endpoint를 호출하는 방식**을 기본안으로 둡니다.

---

## 2. 환경변수/시크릿 구분 원칙

### Public
- 브라우저에서 접근 가능한 값
- `NEXT_PUBLIC_` 접두사 사용
- 노출돼도 되지만, 값의 역할은 제한적이어야 함

### Server only
- 서버에서만 사용
- 브라우저에 노출되면 안 됨
- Vercel 프로젝트 환경변수 또는 GitHub Actions secrets로만 관리

### GitHub Actions only
- GitHub Actions가 워크플로에서만 사용
- 저장소 Secrets / Variables에만 저장
- 앱 코드에는 직접 포함하지 않음

---

## 3. 앱(web) 기준 환경변수

파일: `apps/web/.env.example`

### 필수
| 이름 | 범위 | 용도 | 비고 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase 프로젝트 URL | 브라우저 사용 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key | 브라우저 사용 가능 |
| `NEXT_PUBLIC_APP_URL` | Public | canonical / sitemap / metadata 기준 URL | `https://modoo-run.vercel.app` 권장 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Public | Search Console 메타 검증 토큰 | 선택 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Public | Naver Search Advisor 메타 검증 토큰 | 선택 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | 서버 측 upsert, 관리자 수준 DB 작업 | 절대 클라이언트 노출 금지 |
| `RACE_SYNC_SHARED_SECRET` | Server only | 내부 sync endpoint 보호용 shared secret | GitHub Actions와 동일 값 사용 |
| `UPSTASH_REDIS_REST_URL` | Server only | Upstash Redis REST 엔드포인트 | 대회 캐시용 |
| `UPSTASH_REDIS_REST_TOKEN` | Server only | Upstash Redis REST 토큰 | 절대 클라이언트 노출 금지 |
| `INDEXNOW_KEY` | Server only | Naver IndexNow 소유 확인/갱신 요청 키 | 루트 key 파일과 workflow에 사용 |

### 현재 단계에서 아직 선택하지 않은 값
아래 값은 구현 범위가 커질 때 추가할 수 있습니다.
- `ROADRUN_LIST_URL`
- `ROADRUN_DETAIL_BASE_URL`
- `SYNC_SCHEDULE_TIMEZONE`

현재는 꼭 필요한 값만 유지합니다.

---

## 4. Vercel에 넣을 환경변수

Vercel Project Settings → Environment Variables 에 아래를 넣습니다.

| 이름 | 환경 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview / Production | 클라이언트 Supabase 연결 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview / Production | 클라이언트 Supabase 연결 |
| `NEXT_PUBLIC_APP_URL` | Preview / Production | canonical / metadata 기준 URL |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Preview / Production | Google Search Console 메타 검증 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Preview / Production | Naver Search Advisor 메타 검증 |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview / Production | 서버 측 DB upsert |
| `RACE_SYNC_SHARED_SECRET` | Preview / Production | GitHub Actions가 호출하는 sync endpoint 검증 |
| `UPSTASH_REDIS_REST_URL` | Preview / Production | 대회 캐시 저장/조회 |
| `UPSTASH_REDIS_REST_TOKEN` | Preview / Production | 대회 캐시 저장/조회 |
| `INDEXNOW_KEY` | Production | Naver IndexNow key 파일/자동 제출 |

### 주의
- `SUPABASE_SERVICE_ROLE_KEY`는 **절대 `NEXT_PUBLIC_`로 시작하면 안 됩니다.**
- Preview와 Production 값을 동일하게 둘지 분리할지는 이후 환경 전략에 따라 결정합니다.
- MVP 초기에는 Preview/Production 동일 값을 써도 되지만, 장기적으로는 분리하는 것이 안전합니다.

---

## 5. GitHub Actions에 넣을 Secrets / Variables

GitHub Repository Settings → Secrets and variables → Actions

### Secrets
| 이름 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 러너에서 실행되는 Next.js 앱의 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 러너에서 실행되는 Next.js 앱의 공개 키 |
| `NEXT_PUBLIC_APP_URL` | metadata / sitemap 기준 URL |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console 메타 검증이 필요한 경우 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Search Advisor 메타 검증이 필요한 경우 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 측 upsert 및 sync 실행 |
| `RACE_SYNC_SHARED_SECRET` | 로컬 sync endpoint 인증용 secret |
| `UPSTASH_REDIS_REST_URL` | 캐시 warm 테스트가 필요할 때 사용 |
| `UPSTASH_REDIS_REST_TOKEN` | 캐시 warm 테스트가 필요할 때 사용 |
| `INDEXNOW_KEY` | IndexNow 자동 제출용 키 |

### 왜 GitHub Actions에 service role key가 필요한가
현재 기본안에서는 GitHub Actions 러너가 **앱을 직접 실행**하고, 그 앱 서버가 Supabase에 upsert 합니다.
따라서 GitHub Actions 환경에도 `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다.

---

## 6. Supabase에서 가져와야 하는 값

Supabase Dashboard에서 아래 값을 확인해 입력합니다.

| 값 | 위치 |
|---|---|
| Project URL | Project Settings → API |
| anon public key | Project Settings → API |
| service_role key | Project Settings → API |

### 보안 주의
- anon key는 공개 가능하지만, 클라이언트 범위로만 사용합니다.
- service role key는 관리자 권한이므로 **문서, 로그, 브라우저, 커밋에 노출되면 안 됩니다.**

---

## 7. sync endpoint 보안 기준

GitHub Actions가 호출할 sync endpoint는 러너 내부의 로컬 주소(`http://127.0.0.1:3000/api/internal/race-sync`)를 사용합니다.

### 권장 방식
- HTTP 헤더로 shared secret 전달
- 서버에서 `RACE_SYNC_SHARED_SECRET`와 비교
- 일치하지 않으면 401 또는 403 반환

### 예시 헤더
- `x-race-sync-secret: <secret>`

### 추가 권장 사항
- `POST`만 허용
- 실행 이력 `race_sync_runs`에 저장
- 실패 사유를 응답과 로그에 남김
- 추후 rate limit 또는 IP 제한 검토 가능

---

## 8. 로컬 개발 규칙

### 로컬 파일
- 실제 값은 `apps/web/.env.local`에 저장
- `.env.local`은 커밋하지 않음

### 예시
```bash
cp apps/web/.env.example apps/web/.env.local
```

### 로컬에서 필요한 최소 값
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RACE_SYNC_SHARED_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `INDEXNOW_KEY`

---

## 9. 운영 체크리스트

### 앱 배포 전
- [ ] Vercel에 필수 환경변수 입력
- [ ] Search Console / Naver 검증 토큰이 있으면 public env 추가
- [ ] Supabase 값 확인
- [ ] `RACE_SYNC_SHARED_SECRET` 랜덤값 생성

### GitHub Actions 연결 전
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 입력
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
- [ ] `NEXT_PUBLIC_APP_URL` 입력
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 입력
- [ ] `RACE_SYNC_SHARED_SECRET` 입력
- [ ] `UPSTASH_REDIS_REST_URL` 입력
- [ ] `UPSTASH_REDIS_REST_TOKEN` 입력
- [ ] `INDEXNOW_KEY` 입력
- [ ] sync endpoint가 인증 헤더를 검사하도록 구현

### 운영 중
- [ ] secret 값을 README나 이슈에 남기지 않기
- [ ] 로그에 service role key 출력되지 않기
- [ ] secret 교체 시 Vercel / GitHub Actions 둘 다 함께 갱신하기

---

## 10. 지금 사용자에게 받아야 할 정보

이 문서 정리까지는 추가 정보 없이 진행 가능했습니다.

하지만 실제 배포 연결 단계(#5, #6)에서 아래 값이 필요합니다.

1. **Supabase Project URL**
2. **Supabase anon key**
3. **Supabase service_role key**
4. **RACE_SYNC_SHARED_SECRET로 사용할 랜덤 문자열**
5. **UPSTASH_REDIS_REST_URL**
6. **UPSTASH_REDIS_REST_TOKEN**

이 값이 준비되면 바로
- #6 sync endpoint 구현
- #5 GitHub Actions 일일 동기화
로 이어갈 수 있습니다.

### Upstash Redis 참고
- 현재 구현은 `@upstash/redis`의 **REST URL + REST TOKEN** 조합을 사용합니다.
- 사용자가 가진 Redis 포트 `6379` 정보는 TCP 연결용이며, 이번 Next.js 서버리스 캐시 구현에서는 직접 사용하지 않습니다.
