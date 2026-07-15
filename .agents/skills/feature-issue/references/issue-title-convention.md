## Issue 제목 규칙

Issue 제목은 아래 컨벤션을 따릅니다.

```text
[{라벨}-{작업번호}/{도메인}] 이슈명
```

예시

```text
[feature-66/react-query] React Query Provider 추가
[refactor-67/chat] ChatRoom 책임 분리
[performance-68/chat] 채팅 렌더링 성능 개선
[test-69/invite] 링크 초대 E2E 테스트 추가
```

제목 생성 규칙은 다음과 같습니다.

- `{라벨}`은 현재 레포지토리에 등록된 GitHub Label의 영문 이름을 그대로 사용합니다.
- `{작업번호}`는 **GitHub Issue 번호가 아닌 프로젝트 작업번호**입니다.
- 기존 Issue 제목의 컨벤션을 참고하여 가장 최근 작업번호를 찾고, 다음 번호를 사용합니다.
- `{도메인}`은 작업 대상이 되는 기능 또는 영역을 대표하는 영문 키워드를 사용합니다. (예: `chat`, `invite`, `auth`, `react-query`)
- `이슈명`은 작업 내용을 이해하기 쉬운 한국어로 작성합니다.

작업번호는 GitHub Issue 번호와 별도로 관리되는 프로젝트 번호이며, 반드시 기존 Issue 제목을 참고하여 연속성을 유지합니다.

---
