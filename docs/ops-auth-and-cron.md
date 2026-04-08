# 모두의 러닝 운영 메모 — 인증/권한/크론

## 1. 사용자 권한 모델
- 비로그인 사용자: 대회/공개 커뮤니티 읽기만 가능
- 로그인 사용자: 본인 플랜, 본인 북마크, 게시글/댓글/신고 작성 가능
- 운영자(`moderator`, `admin`): 숨김 처리, 운영 로그 조회, 내부 운영 데이터 접근 가능

## 2. 운영자 권한 부여
이 프로젝트의 운영자 판별 기준은 **Supabase Auth의 `app_metadata.role`** 값이다.

- 일반 사용자: `app_metadata.role` 미설정 또는 `user`
- 운영자: `moderator`
- 관리자: `admin`

권한 부여 예시:
1. Supabase Dashboard → Authentication → Users 이동
2. 대상 사용자 선택
3. `app_metadata`에 아래 형태로 저장

```json
{
  "role": "moderator"
}
```

또는

```json
{
  "role": "admin"
}
```

## 3. 크론/내부 동기화 시크릿
- `CRON_SECRET`: Vercel Cron의 Bearer 인증에 사용
- `RACE_SYNC_SHARED_SECRET`: 수동/내부 호출용 `x-race-sync-secret` 헤더에 사용 가능

현재 내부 sync endpoint는 아래 2가지 인증 방식을 모두 허용한다.
- `Authorization: Bearer <CRON_SECRET>`
- `x-race-sync-secret: <RACE_SYNC_SHARED_SECRET>`

## 3-1. 현재 배포 플랜 제약
- 현재 Vercel 프로젝트는 **Hobby 플랜 제약**으로 하루 1회보다 잦은 Cron을 사용할 수 없다.
- 그래서 현재 `apps/web/vercel.json`의 운영 크론은 **UTC 00:00, 하루 1회**로 설정되어 있다.
- 더 자주 동기화가 필요하면 아래 둘 중 하나로 확장한다.
  1. Vercel Pro 이상으로 업그레이드
  2. Supabase 스케줄러/pg_cron 기반으로 수집 주기를 이전

## 4. 배포 후 확인 체크리스트
1. `apps/web/vercel.json`의 cron이 배포 프로젝트 루트 기준으로 반영됐는지 확인
2. `/api/internal/race-sync` 무인증 호출이 401인지 확인
3. 운영자 계정으로 숨김/복원 버튼 노출 여부 확인
4. 일반 사용자 계정으로 숨김 처리 시도가 차단되는지 확인
5. 댓글/신고 후 `comment_count`, `report_count`가 증가하는지 확인
