# Supabase 운영/개발 DB 분리 조사 세션 기록

출처: Claude Code 세션 대화
작성자: shinhm21
확인 날짜: 2026-08-14

## 세션 목적

현재 운영과 개발이 Supabase 프로젝트 하나를 함께 쓰는 상태에서, 테스트 도입과 API route Supabase 이관을 앞두고 운영 DB와 개발 DB를 분리할 수 있는지 조사하고 착수 작업(이슈 생성)까지 진행.

## 조사한 질문과 확인 결과

- 운영 DB를 유지하고 개발 DB를 추가로 만드는 것은 Supabase CLI로 가능하다. 신규 Supabase 프로젝트를 만들고 `supabase link`로 연결 대상을 전환하거나, 로컬 개발이면 `supabase start`로 완전히 분리된 로컬 스택을 쓸 수 있다.
- 테이블, cron, hook, edge function 복제 가능 여부는 항목별로 다르다.
  - 테이블/스키마/트리거/RLS는 `supabase/migrations/*.sql`로 관리되고 있어 `supabase db push`로 신규 프로젝트에 재현 가능하다.
  - pg_cron 예약 작업은 마이그레이션 파일에 없었고, 실제로 운영 DB에서 `select * from cron.job;`을 실행해 확인한 결과 `auto-generate-nbread-records` 작업 1개가 존재했다. 매일 협정 세계시 15시 실행, `vault.decrypted_secrets`에서 `project_url`, `nbread_auto_generate_cron_secret` 두 시크릿을 읽어 `net.http_post`로 동명의 Edge Function을 호출하는 구조였다.
  - Edge Function은 `supabase/functions/` 아래 코드로 저장소에 존재하며 Supabase 대시보드에 배포되어 있었다. 목록: `auto-generate-nbread-records`, `chat-notification`, `friend-request-notification`, `friend-response-notification`, `nbread-invite-accept-notification`, `nbread-invite-notification`, `payment-notification` (+ 공통 코드 `_shared/`, `utils/`, `types/`).
  - Database Webhook 등 대시보드 전용 설정은 이번 세션에서 전수 확인하지 않았다.
- git diff 발생 여부는 작업 방식에 따라 다르다. `supabase link`로 저장하는 project ref, `.env` 값 등은 보통 gitignore 대상이라 diff가 거의 없다. diff가 생기는 지점은 `supabase/config.toml` 수정, CI/CD workflow의 project ref 하드코딩, 그리고 `supabase/migrations`에 새 파일을 추가하는 경우다.

## 진행한 작업

- 실제 운영 cron job을 마이그레이션 파일로 옮겨서 커밋 전 상태로 작업트리에 추가했다: `supabase/migrations/20260814111507_schedule_auto_generate_nbread_records_cron.sql`. `cron.schedule(job_name, schedule, command)` 형태(같은 job_name이면 upsert)로 작성해 재실행해도 안전하도록 했다. Vault 시크릿 값 자체는 환경마다 달라야 하므로 마이그레이션에 넣지 않고 주석으로 사전 등록 안내만 남겼다.
- 마이그레이션 파일 추가로 변경 사항이 생겼으니, 이를 계기로 개발 DB 분리 작업을 GitHub 이슈로 만들기로 했다.
- Orca orchestration(run-create → task-create → worker-start --agent codex → check --wait)으로 Codex에게 이슈 생성을 위임했다. Codex가 `.claude/skills/feature-issue/SKILL.md`와 기존 이슈 사례(`llm-wiki/raw/2026-08-13-github-issue-195-naver-search-advisor.md`)를 참고해 동일한 형식으로 이슈 #198 `[feature-76/supabase-environment] Supabase 운영 및 개발 환경 분리`를 생성했다. 원본은 `llm-wiki/raw/2026-08-14-github-issue-198-supabase-environment.md`에 저장했다.
- worker_done 수신 후 delivery를 ack하고 worker 터미널을 release했다. 코디네이터(이 세션)가 직접 llm-wiki 기록을 이어서 처리했다.

## 확인 필요

- Database Webhook을 포함해 대시보드에서만 설정됐을 수 있는 항목이 더 있는지 전수 확인이 안 됐다. 이슈 #198 Tasks에 확인 항목으로 남겨뒀다.
- 개발 환경에서 `auto-generate-nbread-records` 예약 작업을 활성 상태로 둘지 여부는 아직 결정하지 않았다. 데이터 오염 가능성 때문에 비활성을 권장안으로만 남겨뒀다.
- 로컬/CI 환경변수를 개발용/운영용으로 실제로 어떻게 분리할지(파일 구조, 이름 규칙)는 조사하지 않았다.
