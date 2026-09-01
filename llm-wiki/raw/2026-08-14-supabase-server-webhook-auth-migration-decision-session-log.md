# @supabase/server 시범 적용 검토와 Database Webhook 인증 이전 방향 결정 세션 기록

출처: Claude Code 세션 대화
확인 날짜: 2026-08-14

## 세션 목적

`raw/2026-08-14-supabase-api-key-migration-session-log.md`에 정리된 다음 작업 중 두 가지, `@supabase/server` 시범 적용과 Database Webhook 인증 이전을 검토했다. 실제로는 `@supabase/server` 시범 코드를 한 번 작성했다가 되돌리고, Database Webhook 인증 이전의 세부 요구사항을 확인한 뒤 두 작업을 하나의 후속 이슈로 묶는 방향으로 결론이 났다.

## `@supabase/server` 조사

- 공식 GitHub 저장소, npm 페이지, 블로그 글, API 레퍼런스 페이지를 확인했다.
- `withSupabase(options, handler)` 형태로 Edge Function 핸들러를 감싸며, `auth` 옵션에 따라 호출자를 검증하고 `ctx.supabaseAdmin`(RLS 우회), `ctx.supabase`(RLS 적용), `ctx.userClaims`, `ctx.jwtClaims`, `ctx.authMode`, `ctx.authKeyName`을 핸들러에 넘겨준다.
- `auth: 'secret'`은 `SUPABASE_SECRET_KEYS` JSON의 `default` 키를 검증하고, `auth: 'secret:이름'`은 그 JSON 안의 특정 이름의 키를 검증하며, `auth: 'secret:*'`은 그 안의 아무 키나 허용한다.
- 이 패키지는 현재 운영 Edge Function에 이미 배포돼 있는 환경변수 `SUPABASE_SECRET_KEYS`(JSON, `default` 키 포함)를 그대로 재사용한다. 새 시크릿을 추가로 만들 필요가 없다.
- `auth: 'secret'` 계열, `'publishable'`, `'none'`을 쓰려면 `supabase/config.toml`에서 해당 함수의 `verify_jwt`를 반드시 `false`로 꺼야 한다. 플랫폼 레벨 `verify_jwt`는 `Authorization: Bearer` 헤더의 JWT만 검사하며 `apikey` 헤더는 보지 않기 때문이다.

## 시범 코드 작성과 되돌림

- `chat-notification`을 복제한 `chat-notification-pilot` Edge Function을 만들어 `Deno.serve(withSupabase({ auth: 'secret:default' }, handler))` 형태로 작성하고, DB 접근을 `ctx.supabaseAdmin`으로 바꿨다.
- 공용 유틸 `filterNotificationEnabledUsers`, `insertNotificationResult`에 세 번째 인자로 `client: SupabaseClient = supabaseClient`를 추가해, 기존 6개 함수는 그대로 두고 pilot 함수만 `ctx.supabaseAdmin`을 넘기도록 했다.
- `config.toml`에 `chat-notification-pilot` 블록(`verify_jwt = false`)을 추가했다.
- 사용자가 `ctx.supabaseAdmin` 방식 적용은 별도 후속 이슈로 진행할 생각이었다고 밝혀, pilot 함수 폴더 전체와 `config.toml`, 두 유틸 파일의 변경을 모두 되돌렸다. `git checkout`으로 원상복구하고 `chat-notification-pilot` 폴더를 삭제했다. 이 세션이 끝난 시점에는 이 pilot 관련 변경이 diff에 남아있지 않다.

## Database Webhook 인증 이전 검토

- 사용자가 Supabase 공식 마이그레이션 가이드의 pg_net/Database Webhook 예시를 제시했다. 핵심은 `Authorization: Bearer <service_role key>` 대신 `apikey` 헤더에 새 Secret Key(`sb_secret_...`)를 넣는 것이고, 하드코딩 대신 Vault의 `decrypted_secret`을 조회해서 넣는 방식이었다.
- 이 방식 자체는 공식 가이드와 일치한다고 확인했다. 다만 이것만으로는 부족하고 세 가지가 세트로 필요하다는 점을 짚었다.
  1. 웹훅이 보내는 헤더를 `Authorization`에서 `apikey`로 바꾼다.
  2. 알림 함수 6개의 `verify_jwt`를 `false`로 바꾼다. 그렇지 않으면 `Authorization` 헤더가 없는 요청을 플랫폼이 거부하거나, 새 Secret Key를 검증하지 못한다.
  3. `verify_jwt`를 끈 뒤에는 플랫폼이 호출자를 대신 검증해주지 않으므로, 함수 안에서 직접 호출자를 검증하는 코드가 있어야 한다. 기존 예약 함수(`auto-generate-nbread-records`)가 `x-cron-secret` 헤더를 직접 비교하는 방식으로 이미 이 문제를 풀어놓았다.
- 이 세 가지 중 하나라도 빠지면 알림이 안 가거나(헤더 누락으로 거부), 반대로 아무나 호출 가능한 엔드포인트가 된다(호출자 검증 없음).
- 현재 상태(레거시 `service_role` JWT를 웹훅이 계속 사용하는 상태)는 정상 동작하고 있으며, 급하게 바꿔야 할 장애 요인이 없다는 점도 함께 확인했다. 함수 내부 DB 접근은 이미 새 Secret Key로 이전이 끝난 상태이고, 웹훅 쪽 호출자 인증만 레거시로 남아있는 상태다.

## 최종 결정

- 웹훅 인증 이전은 pilot 작업과 마찬가지로 후속 이슈로 미루기로 했다.
- 수동으로 `x-cron-secret`류의 헤더 비교 코드를 알림 함수 6개에 새로 짜는 대신, `@supabase/server`의 `withSupabase({ auth: 'secret' })`를 도입해서 호출자 검증과 `ctx.supabaseAdmin` 제공을 한 번에 해결하는 옵션 2 방식으로 하기로 했다. 즉 pilot 작업(`@supabase/server` 도입)과 웹훅 인증 이전 작업이 사실상 하나의 SDK 도입 작업으로 합쳐졌다.
- 웹훅 전용 Secret Key를 별도로 만들지, 기존 `default` 키를 재사용할지 논의했다. 사용자는 재사용을 선택했다. 웹훅에서 키가 유출되지 않도록 관리하면 되고, 키를 분리해서 얻는 이득보다 하나 더 관리해야 하는 비용이 크지 않다고 판단했다.
- 레거시 `service_role`/`anon` 키는 모든 사용처(웹훅 포함) 이전과 실제 알림 검증이 끝난 뒤에만 비활성화한다는 기존 원칙을 재확인했다. 지금 당장 비활성화할 이유는 없다.

## 다음 작업

- 후속 GitHub 이슈 하나로 다음을 묶어서 진행한다.
  - 알림 함수 6개를 `withSupabase({ auth: 'secret' })` + `ctx.supabaseAdmin` 방식으로 전환.
  - 공용 유틸(`filterNotificationEnabledUsers`, `insertNotificationResult`)에 클라이언트 인자를 받도록 수정.
  - 해당 6개 함수의 `config.toml`에서 `verify_jwt = false` 설정.
  - Database Webhook 6개의 헤더를 `Authorization: Bearer <레거시 JWT>`에서 `apikey: <default Secret Key>`(Vault 조회)로 교체.
  - Secret Key는 기존 `default` 키를 재사용하고 별도 키를 새로 만들지 않는다.
  - dev 프로젝트에서 먼저 검증한 뒤 운영에 함수 단위로 순차 적용하고, 알림 6종을 실제로 발생시켜 확인한다.
  - 모든 사용처 이전과 검증이 끝난 뒤 레거시 `anon`, `service_role` 키를 비활성화한다.

## 확인 필요

- Vault에 웹훅용 시크릿 항목이 실제로 만들어져 있는지, 트리거 실행 role이 `vault.decrypted_secrets`를 조회할 권한이 있는지는 아직 확인하지 않았다.
- `@supabase/server`를 실제로 배포해본 적은 없다. dev 환경에도 아직 이 패키지를 쓰는 함수가 없다.
- 이 후속 이슈의 실제 작업 시점과 담당자는 아직 정해지지 않았다.
