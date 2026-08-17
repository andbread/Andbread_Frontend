# 처리 이력

| 날짜 | 작업 | 결과 | 확인 필요 |
|---|---|---|---|
| 2026-08-13 | `llm-wiki` 폴더 구조 설계 및 생성 (`index.md`, `AGENTS.md`, `CLAUDE.md`, `raw/`, `wiki/`, `output/`) | 3층 구조(원본/지식/산출물) + 규칙 파일 확정 | `wiki/` 도메인 문서 아직 미작성 |
| 2026-08-13 | `wiki/template.md` 작성 | 한 문장 요약/근거/확인된 내용/확인 필요 형식 재사용 가능하게 정리 | - |
| 2026-08-13 | 세션 대화 내용을 `raw/2026-08-13-llm-wiki-setup-session-log.md`에 저장 | 구조 결정 근거 보존 | - |
| 2026-08-13 | GitHub 이슈 #193을 `raw/2026-08-13-github-issue-193-llm-wiki-setup.md`에 저장 | 작업 기획서 원본 보존 | - |
| 2026-08-13 | 첫 `wiki/` 문서 `llm-wiki-background-and-structure.md` 작성 | 배경, 해결 범위, 구조, 다음 질문 정리 | 이슈 #193 "후속 문서 작성 및 에이전트 연동 범위 정리" 작업 미완료 |
| 2026-08-13 | GitHub 이슈 #195을 `raw/2026-08-13-github-issue-195-naver-search-advisor.md`에 저장 | 네이버 서치어드바이저 등록 작업 기획서 원본 보존 | 아직 `wiki/` 정리 문서 미작성 |
| 2026-08-14 | Supabase 운영/개발 DB 분리 조사 세션 내용을 `raw/2026-08-14-supabase-db-separation-session-log.md`에 저장 | 운영 DB의 pg_cron job 실사 결과, edge function 목록, 마이그레이션 이관 작업 근거 보존 | Database Webhook 등 대시보드 전용 설정 전수 확인 미완료 |
| 2026-08-14 | Orca orchestration으로 Codex에 위임해 생성한 GitHub 이슈 #198을 `raw/2026-08-14-github-issue-198-supabase-environment.md`에 저장 | Supabase 운영/개발 환경 분리 작업 기획서 원본 보존 | 아직 `wiki/` 정리 문서 미작성, 이슈 프로젝트 보드 연결 여부 확인 필요 |
| 2026-08-14 | 마이그레이션 이력 조사 및 baseline 통합 작업 세션 내용을 `raw/2026-08-14-supabase-migration-baseline-consolidation-session-log.md`에 저장 | 운영 DB 이력 테이블의 orphan 24개 발견 경위, baseline 덤프/13개 파일 삭제 결정 근거, 로컬 재현 검증 결과 보존 | 아직 `wiki/` 정리 문서 미작성, baseline 커밋 전 상태 |
| 2026-08-14 | `wiki/supabase-schema-change-migration-strategy.md` 작성 | 대시보드 직접 변경 금지, 예약 작업/Webhook/Vault를 마이그레이션 파일로 남기는 원칙, 정기 드리프트 확인 필요성 정리 | CI 자동화 도입 여부, 대시보드 변경 중 마이그레이션에 안 잡히는 항목 전체 목록 |
| 2026-08-14 | Supabase 개발 환경 구성 및 API 키 이전 세션 내용을 `raw/2026-08-14-supabase-api-key-migration-session-log.md`에 저장 | 개발 프로젝트 생성, 마이그레이션 적용, Git 이력의 운영 키 제거, Edge Function의 새 Secret Key 이전과 헤더 교정 과정 보존 | Vercel 새 키 재배포, 웹훅 인증 이전, 실제 알림 검증, `@supabase/server` 시범 적용 필요 |
| 2026-08-14 | `@supabase/server` 시범 적용 검토와 Database Webhook 인증 이전 결정 세션 내용을 `raw/2026-08-14-supabase-server-webhook-auth-migration-decision-session-log.md`에 저장 | pilot 코드 작성 후 되돌린 경위, 웹훅 인증 이전에 필요한 세 가지 조건, `@supabase/server` 도입으로 두 후속 작업을 합치기로 한 결정, `default` 키 재사용 결정 보존 | Vault 웹훅 시크릿 실제 등록 여부, 후속 이슈 생성 여부 |
| 2026-08-14 | `wiki/supabase-legacy-key-removal-and-server-sdk-migration-strategy.md` 작성 | 레거시 키는 함수 내부 접근과 웹훅 호출자 인증 모두 이전 및 검증 후 비활성화한다는 원칙, 웹훅 인증 이전 시 헤더 교체·verify_jwt·호출자 검증이 세트로 필요하다는 점, `@supabase/server` 도입 결정 근거 정리 | 순차 전환 계획 미확정, dev 환경 시범 여부 미확정, 후속 이슈 미생성 |
| 2026-08-16 | 개발 환경 검증 세션 내용을 `raw/2026-08-16-supabase-dev-environment-verification-session-log.md`에 저장 | 로컬 env 전환 및 Playwright 검증 과정, auth.users → public.user 트리거 누락 발견과 수정, db push 스크립트 버그 수정, 웹훅 구성 방식을 Dashboard 방식으로 재전환한 경위 보존 | 운영 마이그레이션 이력 repair와 두 수정 마이그레이션의 운영 반영 미실행, dev Dashboard 웹훅 미생성 |
| 2026-08-16 | `wiki/supabase-schema-change-migration-strategy.md`에 "구조 변경과 환경별 설정을 구분하는 기준" 절 추가 | 테이블/함수/트리거/RLS/cron 같은 구조 변경은 마이그레이션 필수, OAuth Provider·Database Webhook 인증값·Vault 시크릿 같은 환경별 자격증명은 Dashboard가 맞다는 원칙을 실제 사례(트리거 누락, 웹훅 중복 위험) 근거로 정리 | 이 구분을 CI/리뷰 체크리스트에 반영할지 미논의 |
