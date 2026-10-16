# Supabase 마이그레이션 baseline 통합 세션 기록

출처: Claude Code 세션 대화
작성자: shinhm21
확인 날짜: 2026-08-14

## 세션 목적

운영/개발 DB 분리 작업(이슈 #198)에 앞서, 백엔드 개발자가 로컬에서 DB 상태를 파악할 수 없다는 문제를 해결하기 위해 로컬 재현 가능한 마이그레이션 구조를 만듦.

## 발견한 문제

- `supabase db diff --linked`로 로컬 마이그레이션을 처음부터(shadow DB) 재생해보니 첫 번째 마이그레이션(`20260517101517_auto_generate_nbread_records.sql`)부터 `relation "public.nbread" does not exist` 에러로 실패했다. 리포에 있는 13개 증분 마이그레이션 파일은 전부 `nbread`, `participant`, `user` 등 기본 테이블이 이미 존재한다고 가정하고 작성된 것이었고, 그 기본 테이블을 만드는 마이그레이션 자체가 리포에 없었다.
- `npx supabase db pull --linked`을 실행해 원인을 추적한 결과, 운영 DB의 마이그레이션 이력 테이블(`supabase_migrations.schema_migrations`)에 로컬 파일과 대응되지 않는 버전이 24개 있었다.
  - 이 중 16개는 커밋된 파일과 같은 날 비슷한 시각(몇 분 차이)의 "짝"이 있어, 커밋 전 초안을 한 번 운영에 직접 push했다가 파일을 재작성해 커밋한 것으로 추정된다.
  - 나머지 8개는 짝이 없었고, 그중 `2026-05-15` ~ `2026-05-16` 사이 4개는 리포에서 가장 오래된 커밋 마이그레이션(`2026-05-17`)보다도 앞서는 시점이라 기본 테이블을 생성한 마이그레이션이었을 가능성이 컸다.
  - `git log --all --diff-filter=A`로 전체 이력을 뒤져봐도 이 24개 타임스탬프는 한 번도 커밋된 적이 없었다. 즉 삭제된 게 아니라 애초에 파일로 커밋되지 않았던 것이다.
- 사용자 확인: 이 24개는 사용자 본인이 "로그 남는 게 싫어서" 과거에 직접 지운 파일이었다. 개별 SQL 내용은 복구 불가능한 상태였다.

## 결정 사항

- 개별 마이그레이션 복구는 포기하고, 운영 DB의 현재 스키마 전체를 하나의 baseline 마이그레이션으로 통합하기로 했다.
- `npx supabase db dump --linked -f supabase/migrations/20260814100000_baseline_schema.sql`로 운영 스키마를 schema-only로 덤프했다. 이 명령은 기본적으로 `auth`, `storage`, `cron`, `vault` 등 플랫폼이 관리하는 내부 스키마는 제외하고 `public` 스키마 등만 덤프하며, `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE` 형태로 멱등하게 생성되도록 후처리된다.
- 기존 13개 증분 마이그레이션 파일(`20260517101517_...` ~ `20260702083718_...`)은 삭제하기로 했다. 이 파일들의 누적 효과가 이미 baseline 덤프에 전부 반영돼 있어서, 남겨두면 baseline 다음에 재생할 때 "이미 존재하는 오브젝트" 에러가 난다.
  - 이 13개는 (사라진 24개와 달리) 전부 과거에 git에 정상 커밋된 파일이라, 삭제해도 `git log`로 언제든 원본 내용을 복구할 수 있어 안전하다고 판단했다.
- baseline 파일의 타임스탬프(`20260814100000`)는 같은 세션에서 먼저 추가한 cron 마이그레이션(`20260814111507_schedule_auto_generate_nbread_records_cron.sql`)보다 앞서도록 정했다. cron 마이그레이션은 `vault`/`cron` 스키마를 다루는 별개 관심사라 baseline과 합치지 않고 그대로 뒀다.

## 검증

- `supabase/migrations/`에 baseline과 cron 마이그레이션 2개만 남긴 상태로 `npx supabase db diff --linked -f verify_clean` 실행 → shadow DB가 두 마이그레이션만으로 에러 없이 만들어졌고, 운영과의 diff에서는 `nbread_invite_status_check` 제약 하나만 나왔다. 내용을 보니 실제 드리프트가 아니라 같은 CHECK 제약을 인라인으로 선언한 것과 `NOT VALID` + `VALIDATE` 2단계로 선언한 것의 표현 차이였다 (동일 제약, pg_dump 렌더링 차이). 이 diff가 만든 임시 마이그레이션 파일(`20260814031101_verify_clean.sql`)은 삭제했다.
- `npx supabase start`로 로컬 스택을 처음부터 올려 baseline + cron 마이그레이션만으로 전체 스키마가 에러 없이 재구성되는 것을 확인하고 `npx supabase stop`으로 종료했다.

## 확인 필요

- 커밋 전 상태이며, 커밋은 이 기록 저장 이후 진행하기로 했다.
- `nbread_invite_status_check` 제약의 표현 차이(인라인 vs `NOT VALID`+`VALIDATE`)가 baseline을 계속 유지보수하는 동안 다른 diff 오탐을 유발하지 않는지는 다음에 `db diff` 돌릴 때 다시 확인이 필요하다.
- `db dump --dry-run` 실행 중 CLI가 세션용 임시 Postgres 접속 자격증명(PGPASSWORD)을 대화 중에 출력한 적이 있다. Supabase CLI가 매 세션 임시로 만드는 role로 보이나, 실제 만료/회전 여부는 확인하지 않았다.
