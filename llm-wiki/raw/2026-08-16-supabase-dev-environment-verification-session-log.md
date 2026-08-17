# 개발 환경 검증과 auth.users 트리거 누락 발견 세션 기록

출처: Claude Code 세션 대화
확인 날짜: 2026-08-16

## 세션 목적

이슈 #198의 남은 작업으로, 로컬 `.env`를 운영 대신 개발 Supabase 프로젝트(`ugujkypcxlpalihcrvjt`)를 보도록 바꾸고 실제로 로그인과 데이터 조회가 되는지 검증했다. 그 과정에서 baseline 통합 때 놓친 실제 버그를 발견해 고쳤고, 개발 환경의 Database Webhook을 어떤 방식으로 구성할지도 다시 정리했다.

## 로컬 환경 전환

- 코드에서 실제로 쓰는 Supabase 관련 환경변수는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 세 개뿐임을 `src/lib/supabaseClient.ts`, `src/lib/supabaseAdminClient.ts`로 확인했다. `.env`에 있던 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 코드 어디서도 참조되지 않는 죽은 변수였다.
- 사용자가 `.env.local`을 새로 만들어 이 세 값을 개발 프로젝트 값으로 채웠다.

## Playwright를 이용한 실제 검증

- Next.js dev 서버를 띄우고 Playwright로 브라우저를 직접 조작해 확인했다.
- 랜딩 페이지는 콘솔 에러 없이 정상 렌더링됐다.
- 카카오 로그인 버튼을 눌렀을 때 최초 시도는 `https://ugujkypcxlpalihcrvjt.supabase.co/auth/v1/authorize?provider=kakao...`로 정상적으로 개발 프로젝트를 향해 요청이 나가는 것을 확인해, env 연결 자체는 문제없음을 검증했다.
- 다만 `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` 오류가 발생했다. 이는 연결 문제가 아니라 개발 프로젝트의 Auth 설정에 카카오/구글 OAuth Provider가 아직 등록되지 않은, 신규 프로젝트라 당연히 예상되는 결함이었다.
- 사용자가 카카오/구글 개발자 콘솔에 새 앱을 만들 필요는 없는지 질문했다. 기존 앱을 그대로 쓰고 Redirect URI만 개발 프로젝트의 콜백 주소(`https://ugujkypcxlpalihcrvjt.supabase.co/auth/v1/callback`)를 추가로 등록하면 되며, Supabase Dashboard의 개발 프로젝트 Auth Provider 설정에도 운영과 동일한 Client ID/Secret을 그대로 입력하면 된다고 안내했다.
- 사용자가 콘솔 설정을 마친 뒤 재시도하자 Playwright로 카카오 실제 로그인 화면(`accounts.kakao.com`)까지 정상 도달하는 것을 확인했다.

## auth.users → public.user 트리거 누락 발견

- 사용자가 직접 카카오 계정으로 로그인을 시도했다가 `useAuthCallbackFlow.ts`에서 "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요." 오류를 만났다.
- 원인을 조사한 결과, `public.user`에 새 행을 만드는 함수 `insert_into_public_users()`는 baseline 마이그레이션에 있었지만, 이 함수를 `auth.users` 테이블의 INSERT에 실제로 연결하는 트리거 자체는 어떤 마이그레이션 파일에도 없었다.
- `supabase db dump`가 `auth` 스키마를 기본적으로 제외하기 때문에, 운영에는 예전부터(누가 언제 만들었는지 알 수 없는) 이 트리거가 있어서 계속 정상 동작했지만, baseline 통합 과정에서 이 트리거의 존재 자체가 캡처되지 못했다. 개발 프로젝트는 baseline만 적용했으므로 트리거가 아예 없어 로그인 후 사용자 행 생성이 되지 않았다.
- 운영에 실제 장애가 있었던 것은 아니다. 개발 환경에서만 baseline 재현이 불완전했던 것이 문제였다.

## 수정 내용

- `supabase/migrations/20260816000000_bind_insert_into_public_users_trigger.sql`: `auth.users`에 `insert_into_public_users()`를 호출하는 트리거가 하나도 없을 때만 새로 만들도록 방어적으로 작성했다. 운영에 이미 이름을 알 수 없는 트리거가 있으므로, 운영에 적용해도 이 가드 때문에 아무 일도 일어나지 않을 것으로 판단했다(아직 운영에는 적용하지 않았다).
- `supabase/migrations/20260816000100_backfill_orphaned_auth_users.sql`: 트리거가 없던 동안 로그인을 시도해 `auth.users`엔 있지만 `public.user`엔 없는 계정을 백필한다. `public.user`에 이미 있는 id는 건드리지 않아 반복 적용해도 안전하다.
- 두 파일 모두 아직 로컬에만 있고 운영에는 적용하지 않았다. 개발 프로젝트에는 적용해 실제로 로그인이 정상화된 것을 확인했다.

## `scripts/supabase-db-push.js` 버그 수정

- 이전 세션에서 만든 운영 오적용 방지 스크립트를 이번에 처음 실제로 pending 파일이 있는 상태로 돌려봤는데, 매번 "적용할 마이그레이션이 없습니다"로 잘못 종료되는 버그를 발견했다.
- 원인은 Supabase CLI가 진행 메시지 대부분(`Would push these migrations:` 목록 포함)을 stdout이 아니라 stderr로 출력하는데, 스크립트가 `execSync`로 stdout만 캡처하고 있었던 것이었다. `2>&1`로 합쳐 받도록 고쳤다.
- 부수적으로 불릿 문자(`•`) 매칭 방식도 Windows `execSync` 셸 인코딩에 영향받지 않도록 `.sql`로 끝나는 파일명 여부로 판별하는 방식으로 바꿨다.

## 운영 마이그레이션 이력 불일치 재확인

- 이번 세션에서 두 안전한 마이그레이션(트리거 바인딩, 백필)을 운영에도 반영하려 했으나, 이전에 발견하고 미뤄뒀던 운영 마이그레이션 이력 불일치(로컬에 없는 옛날 버전 27개) 문제가 여전히 남아있어 `db push`가 pending 목록 계산도 못 하고 막히는 것을 재확인했다.
- `migration repair --status reverted <27개 버전>`이 스키마나 데이터는 건드리지 않고 이력 테이블(장부)만 정리하는 작업이라는 점, 이 repair가 "baseline이 그 27개가 만든 걸 100% 담고 있다"는 전제에 기대는데 이번에 정확히 그 전제가 깨진 사례(auth.users 트리거)를 하나 찾았다는 점, 그리고 dev-only 웹훅 마이그레이션 파일 때문에 27개 옛날 버전뿐 아니라 그 파일도 함께 `--status applied`로 건너뛰게 처리해야 한다는 점을 논의했다.
- 이 repair와 두 안전한 마이그레이션의 운영 반영은 이번 세션에서 실행하지 않고 다음 작업으로 남겨뒀다.

## Database Webhook 구성 방식 재검토

- 개발 환경의 웹훅을 이전 세션에서 `net.http_post` 기반 SQL 트리거로 마이그레이션 파일에 구현했었는데, 이 방식이 운영에 실수로 적용될 경우 운영에 이미 있는 Dashboard 웹훅과 같은 테이블·이벤트에 중복 트리거가 걸리는 위험이 있다는 점을 다시 짚었다(즉시 사고는 아니지만, 나중에 운영 Vault에 같은 이름의 시크릿이 등록되는 순간 잠재적으로 알림이 중복 발송될 수 있는 잠복 위험이었다).
- 사용자가 "개발 프로젝트도 그냥 Dashboard에서 웹훅을 설정하면 되지 않냐"고 제안했다. 처음 이 방식을 SQL 트리거로 우회했던 이유(신규 개발 프로젝트에는 `supabase_functions` 스키마가 없어 실패했었다는 8/14 세션의 기록)가 지금은 Edge Function이 이미 배포된 상태라 더 이상 유효하지 않을 가능성이 높다고 판단해, Dashboard 방식으로 되돌리기로 했다.
- 사용자가 추가로 "대시보드도 직접 만질 수 있는데 모든 대시보드 변경을 로그(마이그레이션 파일)로 남기라는 원칙 자체가 무리한 것 아니냐"는 문제 제기를 했다. 이 논의를 계기로 `wiki/supabase-schema-change-migration-strategy.md`에 있던 "모든 대시보드 변경은 마이그레이션 파일로" 원칙을 구조적 변경과 환경별 자격증명·연동 설정으로 나눠 다듬었다.

## 정리 작업

- 개발 DB에서 `net.http_post` 기반 웹훅 트리거 6개와 `notify_edge_function()` 함수를 새 마이그레이션(`20260816010000_drop_dev_webhook_triggers.sql`)으로 제거했다.
- 이 삭제 마이그레이션과 원래의 생성 마이그레이션(`20260814140000_dev_webhook_triggers_for_notification_functions.sql`) 두 버전을 `migration repair --status reverted`로 개발 프로젝트 자체의 이력 테이블에서 지우고, 로컬 파일도 둘 다 삭제했다. `db push --dry-run`으로 개발 프로젝트가 다시 깨끗한 상태(up to date)인 것을 확인했다.
- Database Webhook 6개(테이블·이벤트·대상 함수 매핑은 8/14 세션에서 코드로 추론한 것과 동일)는 개발 프로젝트 Dashboard에서 운영과 동일한 방식(HTTP Request, `Authorization: Bearer <개발용 service_role JWT>`)으로 직접 만들도록 안내했다. 이 세션 종료 시점에는 사용자가 아직 실제로 만들지는 않은 상태였다.

## 다음 작업

- 운영 마이그레이션 이력 27개 버전 repair, dev-only 웹훅 마이그레이션 버전을 운영 이력에서 `applied`로 처리, 그다음 트리거 바인딩/백필 마이그레이션 두 개를 운영에 반영 — 아직 실행 전.
- 개발 프로젝트 Dashboard에서 Database Webhook 6개 실제 생성 — 아직 실행 전.
- 로컬/CI 환경변수를 개발용으로 완전히 전환하는 작업 중 CI(GitHub Actions 등) 쪽은 아직 확인하지 않았다.
- 개발 환경 예약 작업(`auto-generate-nbread-records`) 활성화 여부 최종 결정은 아직 안 내렸다.

## 확인 필요

- 개발 프로젝트에서 Dashboard로 웹훅을 만들 때 `supabase_functions` 스키마 관련 오류가 실제로 재발하지 않는지는 아직 확인되지 않았다.
- 운영에 트리거 바인딩/백필 마이그레이션을 반영한 뒤 실제로 no-op였는지 확인이 필요하다.
- `wiki/supabase-schema-change-migration-strategy.md`에 추가한 구분 원칙을 CI나 리뷰 체크리스트에 어떻게 반영할지는 논의되지 않았다.
