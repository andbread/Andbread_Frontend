# Supabase 개발 환경 구성 및 API 키 이전 세션 기록

출처: Codex 세션 대화
확인 날짜: 2026-08-14

## 세션 목적

이슈 #198의 후속 작업으로 개발 전용 Supabase 프로젝트를 만들고 저장소의 마이그레이션을 적용했다. 이어서 운영 프로젝트에서 발견된 레거시 `anon`, `service_role` 키 사용 범위를 조사하고 Edge Function의 데이터베이스 연결을 새 Secret Key 방식으로 이전했다.

실제 API 키, Vault 비밀값, 데이터베이스 비밀번호는 이 기록에 포함하지 않는다.

## 개발 프로젝트 생성

- 조직 `andbread`의 요금제와 신규 프로젝트 비용을 먼저 확인했다.
- 신규 프로젝트 비용은 월 0달러로 확인됐고 사용자 승인 후 프로젝트를 생성했다.
- 프로젝트 이름은 `andbread-dev`, 프로젝트 식별자는 `ugujkypcxlpalihcrvjt`, 지역은 도쿄 `ap-northeast-1`이다.
- 생성 직후 상태는 `ACTIVE_HEALTHY`였으며 `public` 스키마는 비어 있었다.

## 개발 데이터베이스 마이그레이션 적용

- `20260814100000_baseline_schema.sql`과 `20260814111507_schedule_auto_generate_nbread_records_cron.sql`을 개발 프로젝트에 적용했다.
- baseline을 처음 적용할 때 운영 대시보드에서 만든 Database Webhook 트리거 6개가 포함된 사실을 발견했다.
- 해당 트리거에는 운영 프로젝트 주소와 레거시 `service_role` JWT가 직접 들어 있었고 신규 프로젝트에는 `supabase_functions` 스키마도 없어 적용이 실패했다.
- 환경 전용 웹훅 트리거 6개를 baseline에서 제거한 뒤 다시 적용했다.
- 원격 마이그레이션 이력은 저장소 파일 버전인 `20260814100000`, `20260814111507`과 일치하도록 정리했다.
- 적용 후 개발 데이터베이스에는 `public` 테이블 13개, 함수 14개, 트리거 6개, RLS 정책 44개가 생성됐다. 13개 테이블 모두 RLS가 활성화됐다.
- `auto-generate-nbread-records` 예약 작업도 생성됐으며 현재 활성 상태다. 개발용 Vault 값과 Edge Function 배포가 끝나기 전에는 정상 호출되지 않는다.

## Git 이력의 운영 키 제거

- 운영 키가 들어 있던 baseline 커밋은 원격에 올라가기 전인 로컬 커밋이었다.
- 기존 로컬 커밋 두 개를 다시 작성해 참조 가능한 Git 이력에서 운영 프로젝트 주소와 JWT가 검색되지 않도록 정리했다.
- 다시 작성한 커밋은 `dccb7b3`과 `f385cc9`이다.
- 레거시 키는 Git 이력 정리와 별개로 사용처를 새 키로 이전한 후 비활성화해야 한다고 판단했다.

## 키 사용 범위 조사

### 프론트엔드와 Next.js 서버

- 브라우저용 공통 클라이언트 `src/lib/supabaseClient.ts`는 `NEXT_PUBLIC_SUPABASE_KEY`를 사용한다.
- 로컬 환경과 Vercel의 `NEXT_PUBLIC_SUPABASE_KEY`는 새 `sb_publishable_...` 형식인 것으로 확인됐다.
- `src/app/api/auth/delete-account/route.ts`와 `src/lib/supabaseAdminClient.ts`는 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`를 우선 사용한다.
- 로컬의 해당 변수에는 새 `sb_secret_...` 값이 들어 있었지만, Vercel 운영 환경에서는 레거시 JWT 값이 들어 있던 것으로 확인됐다. 사용자가 새 Secret Key를 발급했다.
- Secret Key 변수에는 `NEXT_PUBLIC_` 접두사를 붙이지 않아야 하며 현재 서버 전용 코드에서만 참조한다.

### 운영 Edge Function과 Database Webhook

- 운영 프로젝트 식별자는 `yyisakaqnaoomehqlyjz`다.
- 운영에는 Edge Function 7개가 배포돼 있다.
  - `auto-generate-nbread-records`
  - `chat-notification`
  - `friend-request-notification`
  - `friend-response-notification`
  - `nbread-invite-notification`
  - `nbread-invite-accept-notification`
  - `payment-notification`
- 모든 함수가 공통 파일 `_shared/createClient.ts`에서 `SUPABASE_SERVICE_ROLE_KEY`를 읽어 데이터베이스에 접근하고 있었다.
- 운영 데이터베이스에는 알림 함수 6개를 호출하는 `supabase_functions.http_request` 기반 웹훅 트리거 6개가 있다.
- 이 웹훅들은 레거시 `service_role` JWT를 `Authorization: Bearer`로 전달한다.
- 알림 함수 6개는 현재 `verify_jwt: true`이며, 예약 함수만 별도 `x-cron-secret`을 검사하면서 `verify_jwt: false`다.

## Edge Function의 새 Secret Key 이전

### 최초 적용과 문제 발견

- 공식 문서의 옵션 1을 따라 `SUPABASE_SECRET_KEYS` 환경변수의 JSON을 파싱하고 `default` 키를 읽도록 공통 클라이언트를 변경했다.
- 실제 키 값은 코드나 로그에 기록하지 않았고 값 존재 여부, JSON 형식, `sb_secret_` 접두사를 검증하도록 했다.
- 이 공통 파일을 운영 함수 7개에 처음 배포했다.
- 이후 사용자 검토로 새 키를 `createClient(url, secretKey)`에 그대로 전달하면 `supabase-js`가 `apikey`뿐 아니라 `Authorization: Bearer`에도 같은 키를 넣을 수 있다는 문제가 제기됐다.
- 설치된 `@supabase/supabase-js@2.89.0`의 구현을 확인한 결과 실제로 두 헤더를 모두 설정하는 것을 확인했다. 새 Secret Key는 JWT가 아니므로 이 상태에서는 `Invalid JWT`가 발생할 수 있었다.

### 교정한 최종 구현

- 옵션 1을 유지하되 공통 `fetch` 래퍼에서 `Authorization` 헤더를 제거하도록 수정했다.
- `apikey` 헤더는 유지하고 세션 저장, 자동 토큰 갱신, 주소에서 세션 감지를 비활성화했다.
- 가짜 전송기로 실제 `supabase-js` 요청 헤더를 가로채 다음을 검증했다.
  - `apikey` 헤더가 존재한다.
  - `Authorization` 헤더가 존재하지 않는다.
  - `apikey` 값이 `sb_secret_` 형식이다.
- 교정된 공통 클라이언트를 운영 함수 7개에 다시 배포했다.
- 모든 함수에서 `SUPABASE_SECRET_KEYS` 사용, `Authorization` 제거 코드 포함, `SUPABASE_SERVICE_ROLE_KEY` 내부 참조 제거, `ACTIVE` 상태를 확인했다.
- 로컬 변경 파일은 `supabase/functions/_shared/createClient.ts`이며 아직 커밋하지 않았다.

## 옵션 1과 `@supabase/server` 비교 결정

- 현재 적용한 옵션 1은 공식적으로 지원되는 최소 이전 방식이다.
- 장점은 공통 클라이언트 한 곳만 바꿔 기존 함수 7개의 비즈니스 로직을 유지할 수 있다는 점이다.
- 단점은 JSON 파싱과 헤더 처리, 요청 인증을 직접 유지해야 한다는 점이다.
- `@supabase/server`는 `withSupabase`와 `auth` 모드로 호출자 인증과 관리자 및 사용자 클라이언트 구성을 맡아 신규 함수에 권장되는 방식이다.
- 현재 함수들은 전역 `supabaseClient`를 공통 유틸 여러 곳에서 직접 가져오므로 `ctx.supabaseAdmin` 방식으로 바꾸려면 함수 7개와 알림 설정 조회, 알림 저장, FCM 토큰 삭제 유틸의 인자 구조를 함께 바꿔야 한다.
- 따라서 이번 세션에서는 옵션 1로 내부 데이터베이스 연결만 안정화하고, `@supabase/server` 전환은 개발 환경에서 함수 하나를 복제해 검증한 뒤 별도 작업으로 진행하는 방안을 권장했다.

## 현재 인증 흐름

현재 운영 알림 함수의 흐름은 다음과 같다.

```text
Database Webhook
  └─ 레거시 service_role JWT를 Authorization: Bearer로 전달
       └─ Edge Function의 verify_jwt가 요청을 검사
            └─ 함수 내부에서는 새 Secret Key를 apikey 헤더로 사용해 DB 접근
```

예약 함수는 다음과 같다.

```text
pg_cron
  └─ x-cron-secret으로 함수 호출
       └─ 함수 내부에서는 새 Secret Key를 apikey 헤더로 사용해 DB 접근
```

함수 내부의 데이터베이스 연결은 새 방식으로 이전됐지만 웹훅의 함수 호출 인증은 아직 레거시 방식이다. 따라서 레거시 `service_role` 키를 아직 비활성화하면 안 된다.

## 다음 작업

- Vercel의 서버 전용 키를 새 `sb_secret_...` 값으로 교체하고 운영 및 미리보기 배포를 다시 실행한다.
- 회원 탈퇴 서버 경로를 검증한다.
- 개발 프로젝트에 Edge Function과 웹훅 인증 흐름을 구성한다.
- 알림 함수 하나를 복제해 `@supabase/server`와 `auth: 'secret:default'` 방식으로 먼저 검증한다.
- 웹훅의 하드코딩된 Bearer JWT를 제거하고 Vault에서 새 키를 읽어 `apikey` 헤더로 전달하도록 바꾼다.
- 새 키로 함수를 호출할 때는 `verify_jwt: false`로 바꾸고 함수 코드 또는 `@supabase/server`에서 직접 호출자를 인증한다.
- 채팅, 친구 요청과 응답, 엔빵 초대와 수락, 결제 알림을 실제로 검증한다.
- 예약 함수의 호출과 데이터베이스 작업을 검증한다.
- 모든 사용처의 이전과 마지막 사용 확인이 끝난 뒤 레거시 `anon`, `service_role` 키를 비활성화한다.

## 확인 필요

- Vercel의 새 Secret Key 교체와 재배포가 실제로 완료됐는지 확인해야 한다.
- 운영 함수는 배포 상태와 코드 반영을 확인했지만 실제 알림을 발생시키는 끝까지의 검증은 수행하지 않았다.
- 개발 프로젝트에는 아직 Edge Function 7개, Vault 값, 웹훅 6개가 구성되지 않았다.
- 옵션 1을 장기 유지할지 `@supabase/server`로 전환할지는 개발 환경 시범 적용 결과를 보고 결정해야 한다.
- 레거시 키는 아직 비활성화하지 않았다.
