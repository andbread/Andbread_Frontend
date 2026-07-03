# AI Workflow

## 전체 흐름

구현 설계서 → GitHub Issue → Codex 구현 → Commit → Pull Request → Codex Review → Merge

## 역할 분리

- ChatGPT: 구현 설계서 작성, Task 분해, Issue 초안 작성
- Codex: Issue 구현, Commit, Pull Request 작성, Code Review 대응
- GitHub: Issue / PR / Review 관리
- Notion: 구현 설계서 관리

## 원칙

- 구현 설계서의 Task 1개는 GitHub Issue 1개로 변환한다.
- GitHub Issue 1개는 Pull Request 1개로 구현한다.
- Pull Request 제목은 연결된 Issue 제목과 동일하게 작성한다.
- PR은 변경사항 나열이 아니라 의사결정 문서로 작성한다.
- Codex Review는 P0/P1 수준의 위험 요소를 확인하는 용도로 사용한다.

## 작업 순서

1. Notion에서 구현 설계서를 작성한다.
2. 구현 설계서의 Task를 기준으로 GitHub Issue를 생성한다.
3. Codex가 Issue 단위로 구현한다.
4. 변경 사항을 논리적인 작업 단위로 Commit한다.
5. Issue 제목과 동일한 제목으로 PR을 생성한다.
6. `@codex review`로 리뷰를 요청한다.
7. 필요 시 `@codex fix`로 수정 작업을 요청한다.
8. 최종 확인 후 Merge한다.
