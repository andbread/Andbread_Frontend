# Supabase 레거시 키 제거와 @supabase/server 도입 전략

## 한 문장 요약

레거시 `anon`/`service_role` 키는 Edge Function 내부 DB 접근과 Database Webhook 호출자 인증까지 모두 새 Secret Key 기반으로 옮기고 실제 알림 발송을 검증한 뒤에만 비활성화해야 하며, 남은 이전 작업(Database Webhook 인증)은 수동 헤더 비교 대신 `@supabase/server`의 `withSupabase`를 도입해 호출자 검증과 관리자 DB 클라이언트 구성을 함께 해결하는 방향으로 정리됐다.

## 근거

- 원천 자료: `raw/2026-08-14-supabase-api-key-migration-session-log.md`, `raw/2026-08-14-supabase-server-webhook-auth-migration-decision-session-log.md`
- 확인 날짜: 2026-08-14
- 자료 성격: 실제 이전 작업 세션 기록 (Codex 세션 1건 + Claude Code 세션 1건)
- 관련 문서: [Supabase 스키마 변경 시 마이그레이션 저장 전략](supabase-schema-change-migration-strategy.md)

## 확인된 내용

### 지금까지 끝난 부분

- 운영 Edge Function 7개(`_shared/createClient.ts`)는 이미 새 Secret Key(`SUPABASE_SECRET_KEYS` 환경변수, `default` 키) 기반으로 DB에 접근하도록 이전이 끝났다.
- `supabase-js`가 `createClient(url, key)`에 새 Secret Key를 그대로 넣으면 `apikey`뿐 아니라 `Authorization: Bearer`에도 같은 값을 넣어버려 `Invalid JWT`가 발생한다는 문제를 발견하고, 공용 `fetch` 래퍼에서 `Authorization` 헤더를 제거하는 방식으로 교정했다. 이 방식(옵션 1)은 함수 내부 DB 접근 문제만 해결한다.
- 아직 남은 레거시 사용처는 Database Webhook 6개다. 이 웹훅들은 지금도 `Authorization: Bearer <레거시 service_role JWT>`를 알림 함수 6개에 전달하고 있고, 알림 함수 6개는 `verify_jwt: true`로 이 JWT를 검사한다. 예약 함수(`auto-generate-nbread-records`)만 `x-cron-secret` 커스텀 헤더 + `verify_jwt: false`로 별도 인증한다.
- 이 상태는 정상적으로 동작하고 있다. 함수 내부 DB 접근은 새 키로, 웹훅 호출자 인증은 옛 키로 나뉘어 있을 뿐이며 장애 요인은 없다. 그래서 레거시 키를 지금 당장 비활성화할 필요는 없다.

### Database Webhook 인증 이전 시 필요한 세 가지

공식 마이그레이션 가이드는 pg_net/Database Webhook 호출에서 `Authorization: Bearer <service_role key>`를 `apikey: <secret key>`로 바꾸라고 안내한다(하드코딩 대신 Vault의 `decrypted_secret` 조회 권장). 이 헤더 교체 자체는 맞지만 그것만으로는 부족하고, 다음 세 가지가 세트로 함께 필요하다.

1. 웹훅이 보내는 헤더를 `Authorization`에서 `apikey`로 교체한다(Vault에서 값 조회).
2. 해당 알림 함수들의 `config.toml`에서 `verify_jwt`를 `false`로 바꾼다. 플랫폼 레벨 `verify_jwt`는 `Authorization` 헤더의 JWT만 검사하고 `apikey` 헤더는 보지 않기 때문에, 끄지 않으면 새 Secret Key를 검증하지 못하거나 요청 자체가 거부될 수 있다.
3. `verify_jwt`를 끈 뒤에는 플랫폼이 호출자를 대신 검증해주지 않으므로, 함수가 직접 호출자를 검증해야 한다.

세 가지 중 하나라도 빠지면 알림이 아예 안 가거나(헤더 누락으로 거부), 반대로 호출자 검증 없이 아무나 부를 수 있는 엔드포인트가 된다.

### 3번 문제를 푸는 두 가지 방법과 선택

- 방법 A: 예약 함수가 이미 쓰고 있는 방식대로, 함수 코드 안에서 헤더 값을 직접 비교하는 로직을 알림 함수 6개에 각각 추가한다.
- 방법 B: `@supabase/server`의 `withSupabase({ auth: 'secret' })`로 함수를 감싼다. 이 래퍼가 `apikey` 헤더를 `SUPABASE_SECRET_KEYS`의 `default` 키와 자동으로 대조해주고, 검증에 성공하면 핸들러에 RLS를 우회하는 `ctx.supabaseAdmin`도 함께 넘겨준다.
- 방법 B를 선택했다. 이유는 원래 별도 후속 작업으로 예정돼 있던 "함수 내부를 `ctx.supabaseAdmin` 방식으로 옮기는 작업"(`@supabase/server` 시범 적용)과 "웹훅 호출자 인증 이전" 작업이 사실상 같은 SDK 도입 하나로 동시에 풀리기 때문이다. 방법 A로 먼저 가면 나중에 `@supabase/server`로 다시 옮길 때 헤더 비교 코드를 다시 걷어내야 한다.
- Secret Key를 웹훅 전용으로 새로 만들지, 기존 `default` 키를 재사용할지도 논의했다. 키를 분리하면 웹훅 키만 별도로 회전/폐기할 수 있지만 관리해야 할 키가 하나 늘어난다. 웹훅에서 키가 유출되지 않도록 관리하는 쪽이 낫다고 판단해 `default` 키를 재사용하기로 했다(`auth: 'secret'`, `auth: 'secret:default'`와 동일).

### `@supabase/server` 핵심 사실

- Deno Edge Function에서는 설치 없이 `import { withSupabase } from "npm:@supabase/server"`로 바로 쓸 수 있다.
- `auth: 'secret'`은 `SUPABASE_SECRET_KEYS`의 `default` 키를, `auth: 'secret:이름'`은 그 JSON의 특정 이름의 키를, `auth: 'secret:*'`은 그 안의 아무 키나 검증한다. 이 환경변수는 이미 운영 함수 7개에 배포돼 있으므로 이 부분은 새로 만들 게 없다.
- 핸들러는 `(req, ctx)`를 받고, `ctx.supabaseAdmin`(RLS 우회), `ctx.supabase`(RLS 적용), `ctx.userClaims`, `ctx.jwtClaims`, `ctx.authMode`, `ctx.authKeyName`을 쓸 수 있다.
- `auth: 'secret'`, `'publishable'`, `'none'`을 쓰는 함수는 `config.toml`에서 그 함수의 `verify_jwt`를 반드시 `false`로 꺼야 한다.
- `filterNotificationEnabledUsers`, `insertNotificationResult` 같은 공용 유틸이 전역 `supabaseClient`를 직접 import해서 쓰고 있으므로, `ctx.supabaseAdmin`을 넘겨 쓰려면 이 유틸들의 인자 구조를 함께 바꿔야 한다(세 번째 인자로 클라이언트를 받되 기존 `supabaseClient`를 기본값으로 둬서 하위 호환을 유지하는 방식을 한 번 시범 작성해봤다).

## 확인 필요

- `@supabase/server`를 실제로 배포하고 요청을 받아본 적은 아직 없다. dev 프로젝트에도 이 패키지를 쓰는 함수가 없다.
- Vault에 웹훅용 시크릿 항목이 실제로 등록돼 있는지, 웹훅 트리거 실행 role이 `vault.decrypted_secrets`를 조회할 권한을 갖고 있는지 확인하지 않았다.
- 알림 함수 6개를 한 번에 옮길지, 하나씩 순차로 옮기면서 실제 알림(채팅/친구 요청/친구 응답/엔빵 초대/초대 수락/결제)을 검증할지는 아직 정하지 않았다. 순차 전환 쪽이 안전하다는 논의는 있었지만 확정된 계획은 아니다.
- 이 작업을 다룰 후속 GitHub 이슈는 아직 만들어지지 않았다.

## 다시 물어볼 질문

- 후속 이슈를 언제 만들 것인가? 만들 때 이 문서와 `raw/2026-08-14-supabase-server-webhook-auth-migration-decision-session-log.md`를 근거로 붙일 것인가?
- 예약 함수(`auto-generate-nbread-records`)의 `x-cron-secret` 수동 검증 방식도 같은 김에 `withSupabase({ auth: 'secret:cron' })` 같은 형태로 통일할 것인가, 아니면 지금 방식을 그대로 둘 것인가?
- dev 프로젝트에 Edge Function과 웹훅을 아직 구성하지 않았는데, `@supabase/server` 도입 검증을 dev에서 먼저 할 것인가 아니면 운영에서 함수 하나씩 조심스럽게 적용할 것인가?
