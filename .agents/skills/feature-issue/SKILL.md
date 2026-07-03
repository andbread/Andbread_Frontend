---
name: feature-issue
description: 구현 설계서의 Task를 바탕으로 GitHub Feature Issue를 작성합니다.
---

# GitHub Feature Issue

구현 설계서의 Task를 GitHub Feature Issue로 변환합니다.

구현 설계서를 먼저 읽고 작업의 목적과 배경을 이해한 뒤 Issue를 작성합니다.

## 사용 시점

다음 상황에서 사용합니다.

- 구현 설계서에서 GitHub Issue를 생성할 때
- 새로운 기능 구현을 시작할 때
- 리팩토링 작업을 시작할 때

다음 상황에서는 사용하지 않습니다.

- Bug Issue 작성
- Pull Request 작성
- Commit Message 작성

---

## 작업 원칙

- 구현 설계서의 Task 하나를 하나의 GitHub Issue로 작성합니다.
- 하나의 GitHub Issue는 하나의 Pull Request로 구현 가능한 크기를 유지합니다.
- 구현 설계서의 목적과 배경을 충분히 이해한 후 Issue를 작성합니다.
- 구현 설계서에 없는 내용을 추측하여 작성하지 않습니다.
- 필요한 정보가 부족한 경우 `확인 필요`로 표시합니다.

---

## GitHub 설정

Issue를 생성할 때 아래 설정을 함께 적용합니다.

- Assignee는 `hm1n`으로 고정합니다.
- Label은 Issue 제목의 라벨과 동일한 GitHub Label을 추가합니다.
  - 예: Issue 제목이 `[setting-66/ai-agent] Agent 주도 개발 환경 도입`이면 `Setting` 라벨을 추가합니다.
  - Issue 제목의 라벨이 GitHub Label과 정확히 일치하지 않으면, 기존 Label 목록에서 의미가 같은 라벨을 확인해 사용합니다.
- Project는 `KANBAN`으로 지정합니다.
- Project Status는 `TO-DO`로 지정합니다.

---

## 출력 형식

이슈를 생성할 때는 `.github/ISSUE_TEMPLATE`에 있는 `feature_request.md`를 우선 사용합니다.
별도의 템플릿을 새로 만들거나 Skill의 assets에 중복 저장하지 않습니다.

---

## 품질 기준

Issue를 작성하기 전에 아래 내용을 확인합니다.

- 구현 설계서의 목적을 충분히 이해했는가?
- 현재 Task가 하나의 Issue로 적절한 크기인가?
- 하나의 PR로 구현 가능한가?
- 구현 설계서에 없는 내용을 추측하지 않았는가?
