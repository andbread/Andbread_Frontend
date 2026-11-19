# ADR 0001. 클라이언트의 Supabase 데이터 접근을 Route Handler 뒤로 옮긴다

- 상태: 채택 (구현 전)
- 결정일: 2026-11-18
- 관련 이슈: [#170](https://github.com/andbread/Andbread_Frontend/issues/170)
- 관련 ADR: [ADR 0002. 서버 상태 관리에 React Query를 도입한다](0002-server-state-management-with-react-query.md)

## 한 문장 요약

브라우저에서 Supabase를 직접 호출하는 데이터 접근 함수를 Next.js Route Handler(`app/api`) 뒤로 옮긴다. 1차 이관에서는 RLS와 기존 동작을 그대로 두는 순수 이동만 하고, 쿠키 세션과 SSR 전환은 그 위에서 진행한다.

## 근거

- 원천 자료: `raw/2026-11-18-route-api-react-query-effects-and-test-policy-session-log.md`
- 설계서: `output/2026-08-14-github-issue-170-supabase-client-to-app-api-migration-plan.md`
- 확인 날짜: 2026-11-18
- 자료 성격: 세션 기록, 구현 설계서, 코드

## 맥락

- `src/lib/<도메인>/*.ts`의 데이터 접근 함수 39개가 `'use client'` 브라우저 클라이언트(`src/lib/supabaseClient.ts`)로 Supabase를 직접 호출한다.
- 세션은 localStorage에만 있고 `@supabase/ssr`과 `middleware.ts`가 없다. 그래서 서버 코드가 사용자 세션을 읽을 방법이 없고, SSR과 서버 쪽 접근 제어를 시작할 수 없다.
- `protectRoute`는 경로가 바뀔 때마다 브라우저에서 사용자 행을 조회해 접근 여부를 판정한다.
- `insertParticipant`는 브라우저와 DB 사이를 4번 왕복하며 정원을 검사하고, 검사와 삽입 사이에 경쟁 조건이 있다.
- 여러 lib 함수가 `catch`에서 에러를 삼키고 `undefined`나 빈 배열을 반환한다. 에러 처리 규약이 없다.

## 결정

1. 데이터 접근 함수를 Route Handler로 옮기되, 클라이언트 lib의 이름, 인자, 반환 타입은 바꾸지 않는다. 호출하는 컴포넌트와 훅은 수정하지 않는다.
2. 서버 쿼리 함수(`src/lib/server/<도메인>`)는 Supabase 클라이언트를 첫 번째 인자로 주입받는다. 이후 서버 컴포넌트가 같은 함수를 그대로 호출할 수 있게 하기 위해서다.
3. RLS를 유지한다. Route Handler는 요청마다 사용자 JWT를 바인딩한 클라이언트를 새로 만든다. service role로 RLS를 우회하지 않는다.
4. 1차 이관에서 인증은 Bearer 토큰 헤더로 처리한다. 쿠키 세션 전환 시 교체할 곳은 `apiClient`와 `createRouteClient` 두 곳으로 고정한다.
5. 1차 이관은 순수 이동으로 제한한다. 에러를 삼키는 동작, N+1 쿼리, 정원 검사 경쟁 조건은 그대로 옮기고 후속 이슈에서 다룬다.
6. `lib/auth.ts`, `lib/termsAgreement.ts`, Realtime 구독은 범위에서 제외한다. 약관과 로그인 콜백은 쿠키 세션 전환 때 middleware와 함께 다룬다.
7. 도메인 단위로 나눠 진행한다. 순서는 정산, 그룹, 초대, 나머지 부가 도메인이며 인증은 마지막이다.

## 검토한 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| 현재 구조 유지 (브라우저에서 직접 호출) | 서버가 세션을 읽을 수 없어 SSR, middleware 접근 제어, 서버 쪽 검증으로 나아갈 수 없다. |
| 이관과 동시에 쿠키 세션으로 전환 | 로그인 콜백과 `protectRoute`가 함께 바뀌어 회귀 범위가 로그인 전체로 커진다. 1인 개발에서 한 PR로 감당하기 어렵다. |
| 이관하면서 service role로 전환 | RLS를 우회하면 권한 검사를 API 코드가 전부 떠맡아야 한다. 권한 경계가 금전과 직결되는 서비스라 위험이 크다. |
| Server Actions 사용 | 서버 컴포넌트와 폼 중심 구조를 전제로 한다. 지금은 클라이언트 컴포넌트가 lib 함수를 호출하는 구조라 HTTP 엔드포인트가 기존 시그니처를 유지하기 쉽다. 이후 React Query의 query 함수로 쓰기에도 명시적인 엔드포인트가 낫다. |
| 이관하면서 쿼리 최적화와 에러 규약도 함께 정리 | 동작 변경과 경로 변경이 섞이면 E2E가 깨졌을 때 원인을 구분할 수 없다. |

## 결과

### 이관만으로 좋아지는 것

- 브라우저의 데이터 접근 창구가 `/api/*` 하나로 모인다.
- `insertParticipant`의 브라우저와 서버 사이 왕복이 4번에서 1번으로 줄어든다.
- Sentry 추적과 E2E 네트워크 mock의 대상이 `/api/*`로 정리된다.
- service role이나 외부 API 키가 필요한 로직을 둘 자리가 생긴다.

### 이관 위에서 가능해지는 것

- `@supabase/ssr`과 middleware를 사용한 쿠키 세션 전환
- SSR과 서버 컴포넌트로 첫 화면 데이터 제공과 LCP 개선
- `protectRoute`의 판정을 middleware로 이동
- 정원 검사와 참여 삽입의 원자적 처리
- HTTP 상태 코드를 기준으로 한 에러 처리 규약 통일
- 서버 쪽 입력 검증과, RLS에 더한 API 단 권한 확인
- 화면 단위 엔드포인트에서 N+1 제거와 쿼리 통합
- React Query의 query 함수와 엔드포인트의 1:1 대응 ([ADR 0002](0002-server-state-management-with-react-query.md))

### 비용과 위험

- 요청이 브라우저 → Vercel → Supabase로 한 단계 더 거쳐 지연 시간이 늘어날 수 있다. 실측은 아직 하지 않았다.
- Vercel 함수 호출 비용이 늘어난다.
- Route Handler 클라이언트를 모듈 최상위에서 재사용하면 서버리스 인스턴스 재사용 시 다른 사용자 토큰으로 쿼리가 나갈 수 있다. 코드 리뷰와 통합 테스트로 막아야 한다.
- 1차 이관 직후에는 사용자가 체감하는 개선이 거의 없다. 대부분의 효과는 후속 작업에서 나온다.
- E2E 9곳이 `/rest/v1/...` 경로를 가로채고 있어 이관 후 mock이 동작하지 않는다. 요청 횟수를 세는 테스트는 잘못된 통과가 날 수 있다.

## 검증 방법

- 도메인마다 해당 P0/P1 E2E를 먼저 통과시킨 테스트 PR을 merge하고, 리팩토링 PR에서는 assertion을 고치지 않는다. 고칠 수 있는 범위는 네트워크 mock 경로뿐이다.
- 이관한 엔드포인트마다 Route Handler 통합 테스트로 비로그인 401, 본인 데이터 정상, 타인 데이터 거부나 빈 결과를 검증한다.
- 이관 PR마다 E2E mock이 새 `/api/*` 경로에서 실제로 요청을 잡는지 확인한다.

## 확인 필요

- `protectRoute` 경로의 왕복 지연 실측 값
- `getInviteFriendList`를 엔드포인트로 노출할지 여부 (설계서에서 미결)
- Route Handler 통합 테스트를 Vitest의 별도 project로 둘지, 실행 환경(테스트 DB 접속 정보)을 E2E와 공유할지
- 쿠키 세션 전환을 별도 ADR로 남길지
