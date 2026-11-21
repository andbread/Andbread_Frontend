# 엔빵 llm-wiki

## 핵심 질문

엔빵을 개발할 때 참고해야 할 도메인 지식과 과거 결정은 무엇인가?

## 주요 위치

- `raw/` : 원본 자료
- `wiki/` : 정리한 지식
- `output/` : 보고서와 실행 계획

## 먼저 읽을 문서

- [llm-wiki 배경과 구조](wiki/llm-wiki-background-and-structure.md)
- [E2E 테스트 케이스 DB의 분류 축 결정](wiki/e2e-test-case-db-classification-axis.md)

## 결정 기록 (ADR)

- [ADR 0001. 클라이언트의 Supabase 데이터 접근을 Route Handler 뒤로 옮긴다](wiki/adr/0001-supabase-data-access-via-route-handlers.md)
- [ADR 0002. 서버 상태 관리에 React Query를 도입한다](wiki/adr/0002-server-state-management-with-react-query.md)
- [ADR 0003. 리팩토링 기간의 테스트는 불변식만 엄격하게 고정한다](wiki/adr/0003-flexible-test-policy-for-refactoring.md)

## 최근 산출물

- [E2E 테스트 케이스 우선순위 배정과 선정 근거](output/2026-08-28-e2e-tc-priority-assignment.md)
- [FAQ 랜딩페이지 추가 구현 설계서](output/2026-08-18-faq-landing-page-implementation-plan.md)
- [클라이언트 Supabase 호출을 app/api로 이관하는 구현 설계서](output/2026-08-14-github-issue-170-supabase-client-to-app-api-migration-plan.md)

