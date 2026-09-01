# E2E 테스트

Notion `테스트 시나리오` DB의 케이스를 Playwright 코드로 옮긴 것이다.
spec 파일은 도메인 단위, `test.describe()`는 시나리오 단위, `test()`는 테스트 케이스 하나에 대응한다.
각 `test()` 위의 주석이 Notion `ID` 속성이다.

## 실행 준비

로그인 이후 흐름을 검증하는 케이스는 Supabase 접속 정보가 필요하다.
앱이 쓰는 값을 그대로 읽으므로 `.env.local`에 아래 값이 있으면 된다.
값이 하나라도 없으면 해당 케이스는 실행되지 않고 건너뛴다.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY
E2E_TEST_USER_PASSWORD
```

앞의 둘은 브라우저가 쓰는 값이고, service role key는 seed와 cleanup을 위해
Node.js helper에서만 쓴다. 브라우저 코드로 넘기지 않는다.
`E2E_TEST_USER_PASSWORD`는 테스트가 직접 만들고 지우는 계정에만 쓰는 비밀번호다.
실제 사용자 계정과 무관하지만 저장소에 값을 두지 않으려고 환경변수로 분리했다.

**이 설정이 가리키는 프로젝트에 테스트 사용자와 그룹이 생성되고 삭제된다.**
운영과 분리된 개발 프로젝트인지 확인하고 실행한다.
GitHub Actions에서는 GitHub Secrets로 같은 값을 주입한다.

## 실행

```bash
npm run test:e2e                       # 전체
npx playwright test e2e/settlement.spec.ts
npx playwright test --grep '납부 상태'
```

## 구조

| 파일 | 역할 |
| --- | --- |
| `fixtures/env.ts` | `.env` 로딩, 테스트 DB 접속 정보와 실행 조건 판정 |
| `fixtures/seed.ts` | 사용자·그룹·참여자·초대·정산 기록 생성과 cleanup |
| `fixtures/session.ts` | Supabase 세션 생성과 브라우저 주입 |
| `fixtures/ui.ts` | 라벨·참여자 카드·토스트 등 공용 선택자 |
| `fixtures/test.ts` | `seed` fixture를 붙인 `test` |

## 인증 방식

소셜 로그인 화면은 Google과 Kakao가 그리는 화면이라 자동화 대상이 아니다.
테스트는 Supabase에 만든 테스트 계정으로 세션을 발급받아 브라우저 `localStorage`에 넣고 시작한다.
세션 직렬화는 supabase 클라이언트가 직접 하도록 두고 테스트는 그 결과만 옮기므로,
라이브러리의 저장 형식이 바뀌어도 테스트가 따라 깨지지 않는다.

`ProtectRoute`는 `localStorage`의 `user-store`로 로그인 여부를 판단하므로 세션과 함께 주입한다.
앱이 이 값을 직접 채우는 흐름(로그인 콜백)을 검증할 때만 `withUserStore: false`로 둔다.

## 데이터 정리

`seed` fixture는 테스트가 실패해도 만든 데이터를 되돌린다.
화면 조작으로 생기는 그룹처럼 아이디를 미리 알 수 없는 데이터는
`seed.trackNbreadTitle(title)`로 제목을 예약해 두면 cleanup이 찾아서 지운다.
