# 처리 이력

| 날짜 | 작업 | 결과 | 확인 필요 |
|---|---|---|---|
| 2026-08-13 | `llm-wiki` 폴더 구조 설계 및 생성 (`index.md`, `AGENTS.md`, `CLAUDE.md`, `raw/`, `wiki/`, `output/`) | 3층 구조(원본/지식/산출물) + 규칙 파일 확정 | `wiki/` 도메인 문서 아직 미작성 |
| 2026-08-13 | `wiki/template.md` 작성 | 한 문장 요약/근거/확인된 내용/확인 필요 형식 재사용 가능하게 정리 | - |
| 2026-08-13 | 세션 대화 내용을 `raw/2026-08-13-llm-wiki-setup-session-log.md`에 저장 | 구조 결정 근거 보존 | - |
| 2026-08-13 | GitHub 이슈 #193을 `raw/2026-08-13-github-issue-193-llm-wiki-setup.md`에 저장 | 작업 기획서 원본 보존 | - |
| 2026-08-13 | 첫 `wiki/` 문서 `llm-wiki-background-and-structure.md` 작성 | 배경, 해결 범위, 구조, 다음 질문 정리 | 이슈 #193 "후속 문서 작성 및 에이전트 연동 범위 정리" 작업 미완료 |
| 2026-08-13 | GitHub 이슈 #195을 `raw/2026-08-13-github-issue-195-naver-search-advisor.md`에 저장 | 네이버 서치어드바이저 등록 작업 기획서 원본 보존 | 아직 `wiki/` 정리 문서 미작성 |
| 2026-08-14 | `src/lib/**` 전수 조사 후 `output/2026-08-14-github-issue-170-supabase-client-to-app-api-migration-plan.md` 작성 | 이관 대상 28파일 39함수 확정, Route Handler 22개 구조와 API 명세 정리, 후속 이슈 8건 도출 | `getInviteFriendList` 호출부 확인, 왕복 지연 실측 |
