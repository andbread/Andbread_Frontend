# ADR 0002. 서버 상태 관리에 React Query를 도입한다

- 상태: 채택 (구현 전)
- 결정일: 2026-11-18
- 관련 이슈: [#173](https://github.com/andbread/Andbread_Frontend/issues/173), [#240](https://github.com/andbread/Andbread_Frontend/issues/240), [#241](https://github.com/andbread/Andbread_Frontend/issues/241)
- 관련 ADR: [ADR 0001. 클라이언트의 Supabase 데이터 접근을 Route Handler 뒤로 옮긴다](0001-supabase-data-access-via-route-handlers.md)

## 한 문장 요약

서버에서 가져오는 데이터는 TanStack Query(React Query) v5로 관리하고, 화면 상태는 기존처럼 Zustand와 `useState`로 관리한다. 정산 기록 조회부터 시작해 도메인 단위로 옮긴다.

## 근거

- 원천 자료: `raw/2026-11-18-route-api-react-query-effects-and-test-policy-session-log.md`
- 이슈 본문: #240 (도입 범위, 대안 비교), #241 (낙관적 업데이트와 요청 순차 처리)
- 확인 날짜: 2026-11-18
- 자료 성격: 세션 기록, GitHub 이슈, 코드

## 맥락

- 정산 상세 화면이 같은 정산 기록을 두 번 조회한다. `src/app/nbread/[nbreadId]/page.tsx`와 `src/components/nbread/NbreadDetail.tsx`가 각각 `useEffect`에서 `getNbreadRecords`를 호출한다.
- 서버 데이터를 화면마다 `useState`로 복사한다. `NbreadParticipantCard`는 부모에게 받은 납부 여부를 다시 복사해, 부모가 다시 조회해도 카드에 반영되지 않는다.
- 로딩과 오류 처리를 화면마다 `isLoading` state, `useEffect` 연쇄, try/catch로 직접 작성한다.
- `useNbreadStore`, `useNbreadPaymentState` 같은 Zustand 스토어에 서버 데이터와 화면 상태가 섞여 있다.
- 납부 체크박스를 빠르게 여러 번 누르면 요청이 클릭 수만큼 나가고, 성공 토스트와 GA `COMPLETE_PAYMENT` 이벤트도 그만큼 발생한다 (#241).

## 결정

1. `@tanstack/react-query` v5를 도입하고 `QueryClientProvider`를 클라이언트 컴포넌트로 만들어 `src/app/layout.tsx`에 추가한다.
2. 서버 데이터는 React Query, 화면 상태(모달 열림, 편집 모드 등)는 Zustand와 `useState`가 맡는다.
3. 도메인 단위로 옮기고, 한 화면 안에서 두 방식을 섞지 않는다. 첫 대상은 정산 기록 조회다 (#240).
4. query 함수는 기존 `src/lib/<도메인>` 함수를 감싼다. Route API 이관 후에도 lib 시그니처가 유지되므로 훅은 바뀌지 않는다.
5. 기본 옵션(`retry`, `refetchOnWindowFocus`, `staleTime`)은 처음부터 명시한다. 라이브러리 기본값(실패 시 3회 재시도, 창 포커스 시 재조회)을 그대로 쓰면 E2E의 요청 횟수와 실패 시나리오가 달라진다.
6. 납부 상태 저장은 후속 작업(#241)에서 낙관적 업데이트, 참여자별 mutation `scope`, 디바운스를 조합해 옮긴다.
7. SSR hydration은 Route API 이관과 쿠키 세션 전환 이후에 적용한다.

## 검토한 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| SWR | 낙관적 업데이트는 지원하지만 #241에 필요한 mutation 순차 처리(`scope`)를 직접 구현해야 한다. |
| 직접 구현 유지 (`useEffect` + `useState`) | 중복 조회 제거, 캐시 동기화, 롤백을 화면마다 직접 작성해야 한다. |
| Zustand에 서버 데이터 저장 | 캐시 만료, 재조회, 중복 요청 제거를 직접 구현해야 한다. |

## 결과

### 좋아지는 것

- 서버 상태와 화면 상태의 역할이 나뉘어 Zustand 스토어가 가벼워진다.
- 로딩, 오류, 빈 상태 처리가 query 상태로 표준화되고 `useEffect` 기반 재조회 코드가 사라진다.
- 같은 데이터를 여러 컴포넌트가 요청해도 한 번만 보낸다. 정산 상세의 이중 조회가 사라진다.
- 탭 이동과 뒤로 가기에서 캐시를 재사용한다.
- 납부 체크가 응답을 기다리지 않고 바로 반영되고, 실패하면 서버 값으로 되돌아간다 (#241).
- 연속 클릭이 최종 상태 하나의 저장으로 합쳐져 요청 수, 성공 토스트, GA 이벤트가 실제 저장 횟수와 맞아진다 (#241).
- mutation 뒤 `invalidateQueries`로 다른 화면(예: 홈 합계)이 새로고침 없이 갱신된다.
- 캐시된 화면을 먼저 보여주고 뒤에서 새 데이터를 받는다 (stale-while-revalidate).
- 홈 그룹 카드 시점에 상세 데이터를 미리 불러올 수 있다.
- Route API 이관 후에는 엔드포인트와 query 함수가 1:1로 대응하고, query key가 도메인 구조를 따른다.

### 비용과 위험

- 캐시 무효화를 빠뜨리면 화면에 오래된 데이터가 남는 회귀가 생긴다. 기존 E2E가 이 경우를 검증하는지는 확인하지 못했다.
- 전환 기간에는 도메인마다 상태 관리 방식이 다르다.
- 창 포커스 재조회를 켜면 다른 참여자가 바꾼 납부 상태가 반영되지만, 요청 수가 늘고 E2E 요청 횟수 검증에 영향을 준다.
- 실패 재시도 문제(#237)는 React Query 없이 #238에서 이미 고쳤다. React Query 도입의 근거로 #237을 들지 않는다.

## 검증 방법

- 도메인마다 해당 P0/P1 E2E를 먼저 통과시킨 테스트 PR을 merge하고, 리팩토링 PR에서는 assertion을 고치지 않는다.
- 해당 도메인의 테스트 PR에 "데이터를 바꾼 뒤 다른 화면에서 새로고침 없이 바뀐 값이 보이는가"를 검증하는 케이스가 있는지 확인하고, 없으면 추가한다.
- 정산 도메인은 SETTLE-UPDATE-001(중복 요청 합치기)과 SETTLE-UPDATE-002(실패 시 상태 유지와 오류 안내)를 기준으로 삼는다.

## 확인 필요

- `retry`, `refetchOnWindowFocus`, `staleTime`의 값 (#240에서 미결)
- #241의 디바운스 시간과, 디바운스 대기 중 화면을 떠날 때의 처리
- query key 명명 규칙
- `useNbreadPaymentState` 등 Zustand에 남은 서버 데이터를 옮기는 시점
