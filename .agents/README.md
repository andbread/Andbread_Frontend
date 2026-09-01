# Agent 주도 개발 환경

## 도입 배경

AI를 개발에 활용하면서 단순히 구현을 요청하는 것만으로는 일관된 결과를 얻기 어렵다는 걸 느꼈습니다. 작업마다 프로젝트 맥락을 다시 전달해야 했고, 범위가 큰 작업은 AI가 임의로 판단하거나 사람이 결과를 검토하기 어려워지는 문제가 있었습니다.

이를 해결하기 위해 **프로젝트 맥락과 개발 원칙을 명시하고, 작업을 검토 가능한 단위로 분리하며, 반복되는 작업 방식을 재사용할 수 있는 구조**를 만들었습니다.

현재는 다음 세 가지를 중심으로 AI 개발 환경을 운영하고 있습니다.

- 프로젝트 맥락과 개발 원칙을 유지하는 **Agent 개발 환경**
- 설계부터 구현과 리뷰까지 연결하는 **AI 개발 워크플로우**
- 반복 업무를 표준화한 **재사용 가능한 Skill**

---

## 디렉토리 구조

프로젝트의 AI 관련 설정은 특정 Agent에 종속되지 않도록 공통 설정과 도구별 설정을 분리했습니다.

```
.
├── AGENTS.md
├── CLAUDE.md
│
├── .agents/
│   ├── README.md
│   └── skills/
│       ├── feature-issue/
│       ├── gh-commit/
│       ├── pull-request/
│       └── production-release/
│
└── .claude/
    └── skills/
        ├── feature-issue → .agents/skills/feature-issue
        ├── gh-commit → .agents/skills/gh-commit
        ├── pull-request → .agents/skills/pull-request
        └── production-release → .agents/skills/production-release
```

### `.agents`

AI Agent가 공통으로 사용하는 설정의 **Source of Truth**입니다.

루트의 [`AGENTS.md`](http://AGENTS.md)에는 프로젝트 맥락과 전체 개발 원칙을 정의하고, `.agents/skills`에는 Issue 작성, Pull Request 작성, Production Release처럼 특정 작업을 수행하기 위한 절차와 품질 기준을 관리합니다.

Agent 종류와 관계없이 동일한 개발 원칙과 작업 방식을 사용할 수 있도록 공통 규칙은 이곳에서 관리합니다.

### `.claude`

Claude Code가 `.agents`에 정의된 공통 Skill을 사용할 수 있도록 연결하는 역할만 담당합니다.

동일한 Skill을 `.claude/skills`에 별도로 복사하지 않고 `.agents/skills`를 가리키는 심볼릭 링크를 두어, 실제 Skill은 한 곳에서만 관리합니다.

[`CLAUDE.md`](http://CLAUDE.md) 역시 별도의 프로젝트 규칙을 중복해서 정의하지 않고 루트의 [`AGENTS.md`](http://AGENTS.md)를 참조합니다.

이를 통해 Agent별 설정이 서로 달라지는 것을 방지하고, Skill을 수정했을 때 Codex와 Claude Code가 동일한 최신 규칙을 사용할 수 있도록 구성했습니다.

---

## 1. Agent 개발 환경 구축

프로젝트의 기술 스택, 개발 원칙, 테스트 기준 등을 [`AGENTS.md`](http://AGENTS.md)에 정의하여 AI가 작업할 때 동일한 맥락을 유지하도록 합니다.

관련 파일

- `../[AGENTS.md](http://AGENTS.md)`

## 2. AI 개발 워크플로우 설계


| 단계             | 설명                                                           | 주체                  | 저장 위치                             |
| -------------- | ------------------------------------------------------------ | ------------------- | --------------------------------- |
| 구현 설계서         | 구현 전에 작업의 목적, 범위, 기술적 방향, 제약사항과 Task를 정리합니다.                 | 사람 + AI             | Notion `구현 설계서`                   |
| GitHub Issue   | 구현 설계서의 Task를 하나의 PR로 구현 가능한 작업 단위로 변환합니다.                   | AI Agent, 사람이 최종 확인 | GitHub Repository `Issues`        |
| AI 구현          | Issue에 정의된 목적과 요구사항을 기준으로 기존 프로젝트 구조와 개발 원칙을 유지하며 코드를 구현합니다. | AI Agent, 사람이 방향 결정 | GitHub Repository 작업 브랜치          |
| Pull Request   | Issue와 실제 변경사항을 바탕으로 구현 방식, 영향 범위, 리스크와 검증 내용을 정리합니다.        | AI Agent, 사람이 최종 확인 | GitHub Repository `Pull Requests` |
| AI Code Review | PR의 변경사항을 검토해 기존 기능에 영향을 줄 수 있는 위험 요소와 주요 문제를 확인합니다.         | AI Reviewer + 사람    | GitHub Pull Request Review        |
| Merge          | 구현 결과와 리뷰 내용을 최종 확인한 뒤 변경사항을 기준 브랜치에 반영합니다.                  | 사람                  | GitHub Repository                 |


큰 작업을 한 번에 AI에게 맡기지 않고 검토 가능한 단위로 나누며, 각 단계에서 사람과 AI의 역할을 구분합니다.

## 3. 반복 업무 Skill화

반복적으로 수행하는 개발 업무의 작업 절차와 품질 기준을 Skill로 정의합니다.

- Feature Issue 생성
- Commit 생성
- Pull Request 작성
- Production Release 준비

각 Skill에는 단순한 작업 절차뿐 아니라 입력 정보, 제약사항, 품질 기준과 예외 처리 방식까지 함께 정의합니다.

관련 파일

- `skills/feature-issue/`
- `skills/gh-commit/`
- `skills/pull-request/`
- `skills/production-release/`
