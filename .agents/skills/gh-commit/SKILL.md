---
name: gh-commit
description: Git diff를 분석해 논리 단위로 커밋을 만듭니다. 커밋 제목은 type 다음에 한국어 요약을 쓰고 명사로 끝냅니다. 커밋을 만들거나 커밋 메시지를 작성할 때 사용합니다. 트리거 - "/gh-commit", "커밋해줘", "커밋해", "커밋 만들어줘", "커밋 나눠줘", "작업 커밋해줘", "commit". `git commit`을 호출하는 모든 작업에 함께 적용합니다.
---

<!-- @format -->

# Commit

Analyze the Git diff and organize changes into logical, atomic commits.

## When to use

Use this skill when:

- Implementation is complete.
- Changes are ready to be committed.

Do not use this skill for:

- GitHub Issues
- Pull Requests

---

## Principles

- One commit should have one purpose.
- Split unrelated changes into separate commits.
- Keep refactoring separate from feature changes whenever possible.
- Commit only files related to the current change.
- Exclude temporary or unrelated files.

---

## 커밋 메시지

메시지를 만들기 전에 `references/commit-message-convention.md`를 읽습니다. 기억에 의존하지 않습니다.

제목 형식은 아래와 같습니다.

```
type: 요약
```

- type은 규약 파일의 아홉 개 중에서 고릅니다.
- 요약은 한국어로 씁니다.
- **요약은 명사로 끝냅니다.** `추가`, `수정`, `복원`, `제거`, `분리`, `이관`, `통합`, `적용`, `도입`처럼 한자어 명사를 먼저 찾습니다. 맞는 명사가 없으면 `되돌림`, `올림`처럼 `~ㅁ` 형태로 씁니다.
- 마침표를 붙이지 않습니다.

**제목이 `다`로 끝나면 규칙 위반입니다.** `~한다`, `~했다`, `~된다`, `~합니다`, `~했습니다`가 모두 여기에 해당합니다.

- 나쁜 예: `test: E2E 재시도를 측정 결과에 따라 CI 1회로 정한다`
- 좋은 예: `test: E2E 재시도를 CI에서 1회로 조정`

요약에 쓰는 단어는 `gh-tone` 스킬의 금지 표현 표를 따릅니다. `게이트`, `안전망` 같은 영어 직역을 쓰지 않습니다.

---

## 커밋 직전 점검

`git commit`을 호출하기 직전에 제목을 소리 내어 다시 읽고 아래를 확인합니다. 여러 커밋을 나눌 때는 커밋마다 확인합니다.

- [ ] type이 규약 파일의 아홉 개 안에 있는가
- [ ] 제목이 `다`로 끝나지 않는가
- [ ] 제목이 명사로 끝나는가
- [ ] 마침표가 없는가
- [ ] 영어 직역 표현이 없는가

한 항목이라도 걸리면 `git commit`을 호출하지 않고 제목을 먼저 고칩니다.

---

## Quality Checklist

Before committing, verify that:

- The commit represents a single logical change.
- The commit message accurately describes the change.
- No unrelated files are included.
- Do not combine multiple logical changes into a single commit.
