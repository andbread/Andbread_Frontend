# 클라이언트 Supabase 호출을 app/api로 이관하는 구현 설계서

## 한 문장 요약

브라우저에서 직접 호출하던 Supabase 데이터 접근 39개 함수를 Next.js Route Handler 뒤로 옮기되, RLS와 기존 동작을 그대로 유지하는 순수 이동으로 진행하여 이후 SSR 및 쿠키 세션 전환의 기반을 만든다.

## 근거

- 원천 자료: 저장소 코드 직접 조사 (`src/lib/**`, `src/app/api/**`, `src/hooks/**`, `supabase/migrations/**`)
- 확인 날짜: 2026-08-14
- 자료 성격: 코드
- 관련 이슈: [GitHub Issue #170](https://github.com/andbread/Andbread_Frontend/issues/170) / 브랜치 `refactor-63/api`
- 관련 문서: [llm-wiki 배경과 구조](../wiki/llm-wiki-background-and-structure.md)

---

## 1. 배경과 목표

### 1.1 현재 상태

데이터 접근 계층은 `src/lib/<도메인>/<동작><엔티티>.ts` 형태로 이미 분리되어 있고, 이 파일들이 모두 `src/lib/supabaseClient.ts`를 직접 가져다 쓴다. 이 클라이언트는 `'use client'` 지시자가 붙은 브라우저 전용 클라이언트이며 anon key를 사용한다. 컴포넌트와 훅은 이 lib 함수를 48곳에서 가져다 쓴다.

세션은 `localStorage`에 저장한다. `@supabase/ssr`을 사용하지 않으며 `middleware.ts`도 없다. 따라서 서버 코드가 쿠키에서 세션을 읽을 수 있는 경로가 존재하지 않는다.

### 1.2 이번 작업의 목표

이번 작업의 목표는 SSR 전환과 쿠키 세션 전환을 위한 사전 기반 작업이다. 보안 강화나 성능 개선은 이번 범위가 아니다. 데이터 접근 경로만 서버로 옮기고, 나머지는 전부 그대로 둔다.

### 1.3 이번 작업의 비목표

- RLS를 우회하는 service role 전환은 하지 않는다. RLS는 그대로 유지한다.
- 쿠키 세션 전환과 `@supabase/ssr` 도입은 하지 않는다. 인증은 Bearer 토큰 헤더로 처리한다.
- 성능 개선(N+1 제거, 쿼리 통합)은 하지 않는다.
- 에러 처리 규약 변경, 타입 정리, 페이지의 서버 컴포넌트 전환은 하지 않는다.

---

## 2. 설계 원칙

### 2.1 교체 지점을 두 곳으로 고정한다

다음 이슈에서 쿠키 세션으로 전환할 때 바꿔야 할 곳이 두 곳뿐이도록 설계한다.

```
[클라이언트]                          [서버]
src/lib/apiClient.ts                  src/app/api/_lib/supabaseRouteClient.ts
  └ Authorization 헤더를 붙인다          └ 사용자 JWT를 바인딩한 클라이언트를 만든다
        │                                     │
        ▼                                     ▼
src/lib/<도메인>/*.ts                 src/lib/server/<도메인>/*.ts
  (시그니처를 그대로 유지한다)            (클라이언트를 인자로 주입받는다)
```

쿠키 전환 시점에는 `apiClient`에서 헤더 부착 코드를 제거하고 `createRouteClient`를 `createServerClient`로 바꾸면 된다. 서버 쿼리 코드는 한 줄도 바꾸지 않는다.

### 2.2 서버 쿼리 함수는 클라이언트를 주입받는다

`src/lib/server/**`의 함수는 절대 Supabase 클라이언트를 직접 만들거나 가져오지 않는다. 항상 첫 번째 인자로 받는다.

```ts
// src/lib/server/nbread/getUserNbreads.ts
export const getUserNbreads = async (
  client: SupabaseClient,
  userId: string,
) => { /* ... */ }
```

이 규칙을 지켜야 다음 이슈에서 서버 컴포넌트가 같은 함수를 그대로 호출할 수 있다.

### 2.3 클라이언트 lib의 시그니처를 바꾸지 않는다

`src/lib/<도메인>/*.ts`의 함수 이름, 인자, 반환 타입을 그대로 두고 내부 구현만 `supabase` 호출에서 `apiClient` 호출로 바꾼다. 이렇게 하면 컴포넌트와 훅 48곳을 전혀 수정하지 않는다. 이것이 회귀를 최소화하는 핵심 장치다.

### 2.4 RLS를 유지하기 위해 사용자 JWT를 바인딩한다

Route Handler에서 anon key로 클라이언트를 만들되 전역 헤더에 사용자 토큰을 실어야 RLS가 현재와 동일하게 적용된다.

```ts
// src/app/api/_lib/supabaseRouteClient.ts
export function createRouteClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
```

**이 클라이언트는 반드시 요청마다 새로 만들어야 한다.** 모듈 최상위에서 만들어 재사용하면 서버리스 인스턴스가 재사용될 때 다른 사용자의 토큰으로 쿼리가 나갈 수 있다. 기존 `src/app/api/auth/delete-account/route.ts`는 모듈 최상위에서 클라이언트를 만들지만, 그곳은 토큰을 `getUser(token)`에 명시적으로 넘기는 방식이라 문제가 없다. 이 차이를 코드 리뷰에서 반드시 확인한다.

---

## 3. lib 폴더 변경 범위

### 3.1 집계

| 항목 | 수 |
|---|---|
| 이관 대상 파일 | 28 |
| 이관 대상 함수 | 39 |
| 외부 노출 엔드포인트 | 36 ~ 37 |
| 신규 Route Handler 파일 | 22 |
| 수정이 필요한 호출부 | 0 |

### 3.2 도메인별 대상

| 도메인 | 파일 | 함수 | 비고 |
|---|---|---|---|
| `lib/nbread` | 8 | 8 | `createLinkInvite`는 부분 이관한다 |
| `lib/nbreadRecord` | 2 | 2 | |
| `lib/notification` | 5 | 6 | `deleteNotifications.ts`에 함수가 2개 있다 |
| `lib/fcmToken` | 1 | 1 | |
| `lib/participant` | 3 | 5 | 함수 2개는 내부 헬퍼라 노출하지 않는다 |
| `lib/invite` | 5 | 5 | 1개는 RPC이고 1개는 공개 엔드포인트다 |
| `lib/friend` | 3 | 6 | |
| `lib/post` | 4 | 4 | `any` 타입을 여러 곳에서 쓴다 |
| `lib/chatMessage` | 2 | 2 | |

### 3.3 변경하지 않는 파일

다음 파일은 Supabase를 호출하지 않거나 클라이언트에 남아야 하므로 손대지 않는다.

- 순수 함수: `notification/getNotificationDestination.ts`, `notification/sortNotifications.ts`, `authRedirect.ts`, `authStorage.ts`, `jsonLd.ts`, `seo.ts`
- 부가 기능: `lib/analytics/**`, `lib/sentry/**`
- 재수출: 각 도메인의 `index.ts`
- 인증과 실시간 통신에 계속 필요한 클라이언트: `lib/supabaseClient.ts`

### 3.4 범위에서 제외하는 파일과 그 이유

#### `lib/auth.ts` — 전체 제외

`login`, `logout`, `deleteAccount`, `hasAuthenticatedSession`은 Supabase Auth SDK를 쓰므로 이관 대상이 아니다. DB를 조회하는 함수는 `getUserName`(`auth.ts:110`)과 `getUser`(`auth.ts:118`) 둘뿐인데, **저장소 전체에서 이 두 함수를 호출하는 곳이 없다.** `@/lib/auth`를 가져오는 곳은 세 군데이며 각각 `login`, `logout`과 `deleteAccount`, `hasAuthenticatedSession`만 사용한다.

따라서 `auth.ts`는 이번 범위에서 완전히 빠진다. 미사용 함수 2개의 제거는 후속 이슈로 분리한다.

#### `lib/termsAgreement.ts` — 전체 제외

이 파일은 SSR 및 쿠키 세션 전환 이슈에서 함께 다루는 편이 낫다. 이유는 네 가지다.

첫째, `getCurrentUserRow`가 로그인 흐름에서 가장 불안정한 구간에 있다. `src/hooks/useAuthCallbackFlow.ts:35`에서 OAuth 콜백 직후 `supabase.auth.getUser()` 성공 바로 다음에 호출한다. 이 함수에 재시도 3회와 300ms 대기가 붙어 있는 것 자체가, 데이터베이스 트리거로 사용자 행이 생성되기를 기다리는 경합 구간이라는 뜻이다. Bearer 방식으로 바꾸면 `getSession()` 호출이 하나 더 끼어드는데, 그 시점은 access token이 URL에서 감지되어 저장된 직후다. 여기서 회귀가 나면 증상이 로그인 실패다.

둘째, `src/app/protectRoute.tsx:65`가 경로가 바뀔 때마다 `getCurrentUserRow`를 호출한다. API를 거치면 `getSession`, fetch, 서버 `getUser`, DB 조회로 왕복이 늘어난다. 전체 이관 범위에서 체감 성능이 나빠질 가능성이 가장 큰 지점이다.

셋째, `toUserStoreValue`(`termsAgreement.ts:20`)는 `authUser.app_metadata.provider`와 `user_metadata`를 사용하므로 서버로 옮길 수 없다. `getCurrentUserRow`만 서버로 보내면 호출부에서 두 값을 다시 합쳐야 하고, 그러면 API의 성격이 사용자 행 조회가 아니라 현재 사용자 컨텍스트 조립으로 바뀐다.

넷째, 쿠키로 전환하면 `protectRoute`의 판정은 middleware로, `useAuthCallbackFlow`는 `/auth/callback`의 code exchange Route Handler로 옮겨간다. 지금 Bearer로 만들어 둔 코드가 재사용되지 않고 폐기된다. 다른 도메인은 `createRouteClient`만 교체하면 되지만 이 영역만 예외다.

`agreeRequiredTerms` 하나는 위험이 낮아 포함할 수도 있었으나, 도메인이 절반만 이관된 상태로 남으면 다음 이슈에서 파악 비용이 생기므로 통째로 미룬다.

### 3.5 이관 시 개별 처리가 필요한 항목

#### ① `getInviteUser`가 lib 안에서 스토어를 직접 읽는다

`src/lib/invite/getInviteUser.ts:3`이 `useUserStore.getState()`로 현재 사용자를 꺼낸다. 서버에서는 스토어에 접근할 수 없으므로, 서버가 토큰에서 얻은 `user.id`를 사용하도록 바꾼다. 클라이언트 lib의 시그니처는 그대로 두므로 호출부 수정은 없다.

#### ② `createLinkInvite`는 절반만 이관한다

`src/lib/nbread/insertLink.ts:26`이 `window.location.origin`으로 초대 URL을 조립한다. 서버는 `invite_token`만 반환하고, URL 조립은 클라이언트 lib에 그대로 남긴다.

#### ③ `insertParticipant`는 순수 이동만 한다

`src/lib/participant/insertParticipant.ts`는 `getNbread`, `participantUsers`, `isGetParticipantsUser`, `insert` 순으로 네 번 왕복하며 정원 초과를 검사한다. 검사와 삽입 사이에 경쟁 조건이 존재한다.

이번 작업에서는 이 로직을 그대로 하나의 Route Handler 안으로 옮긴다. 결과적으로 브라우저와 서버 사이의 왕복은 1회로 줄지만, 경쟁 조건 자체는 그대로 남는다. **정원 검사와 참여 삽입을 원자적으로 처리하는 작업은 후속 이슈로 분리한다.**

#### ④ 내부 헬퍼는 엔드포인트로 노출하지 않는다

`isGetParticipantsUser`와 `participantUsers`(`src/lib/participant/getParticipants.ts`)는 `insertParticipant` 전용 헬퍼다. `src/lib/server/participant/` 내부 함수로 흡수하고 API로 노출하지 않는다.

`getInviteFriendList`(`src/lib/friend/getSearchFriend.ts`)는 호출부를 확인한 뒤 노출 여부를 판단한다. `확인 필요`.

#### ⑤ `getInviteByToken`만 비로그인 접근을 허용한다

`src/app/invite/[token]/page.tsx`는 로그인 전에도 열린다. `src/app/protectRoute.tsx`의 공개 경로 판정에도 `/invite/`가 들어 있다. 따라서 `GET /api/invites/[token]`은 39개 중 유일하게 인증이 선택적인 엔드포인트다. `requireAuth`를 거치지 않고 anon 클라이언트로 처리한다.

#### ⑥ 에러를 삼키는 동작을 그대로 유지한다

`lib/post/*`, `lib/friend/updateFriend.ts`, `lib/invite/sendInviteRequest.ts` 등이 `catch` 블록에서 아무 처리 없이 `undefined`를 반환한다. `lib/nbread/getUserNbread.ts`와 `lib/nbread/fetchNbreadData.ts`는 실패 시 빈 배열이나 `null`을 반환한다.

순수 이동 원칙에 따라 이 동작을 그대로 유지한다. 클라이언트 lib이 HTTP 오류를 받으면 기존과 동일한 값으로 되돌려 준다. 그래야 UI 분기에 회귀가 생기지 않는다. 에러 처리 개선은 후속 이슈로 분리한다.

#### ⑦ 직렬화가 불가능한 변환은 클라이언트에 남긴다

JSON 왕복이 끼어들면서 새로 생기는 제약이다.

- `fetchNbreadData`(`src/lib/nbread/fetchNbreadData.ts:20`)의 `payment_date` → `Date` 변환
- `getChatMessages`(`src/lib/chatMessage/getChatMessages.tsx:27`)와 `insertChatMessage`의 `formattedTime` 생성

서버는 원시 문자열 값을 내려보내고, 위 변환은 클라이언트 lib에서 수행한다. 반환 타입은 기존과 동일하게 유지한다.

#### ⑧ `.or()` 문자열 보간을 그대로 옮긴다

`src/lib/friend/getSearchFriend.ts:32`와 `src/lib/friend/sendFriendRequest.ts:11`이 필터 조건을 문자열로 조립한다. 값이 UUID라 위험은 낮으므로 이번에는 그대로 옮기고 기록만 남긴다.

---

## 4. app/api 디렉토리 구조

```
src/app/api/
├── _lib/                                  route.ts가 아니므로 라우팅되지 않는다
│   ├── supabaseRouteClient.ts             createRouteClient(accessToken)
│   ├── requireAuth.ts                     Bearer 파싱 + getUser 검증 → { user, client }
│   └── response.ts                        ok() / fail() 응답 헬퍼
│
├── auth/delete-account/route.ts           (기존)
├── sentry-webhook/route.ts                (기존)
│
├── users/
│   └── search/route.ts                    GET
│
├── nbreads/
│   ├── route.ts                           GET / POST
│   ├── summary/route.ts                   GET
│   ├── records/route.ts                   GET
│   └── [nbreadId]/
│       ├── route.ts                       GET / PATCH / DELETE
│       ├── records/route.ts               GET / PATCH
│       ├── participants/route.ts          GET / POST / DELETE
│       ├── posts/route.ts                 GET / POST
│       ├── posts/[postId]/route.ts        PATCH / DELETE
│       ├── messages/route.ts              GET / POST
│       └── invites/
│           ├── route.ts                   POST
│           ├── link/route.ts              POST
│           └── candidates/route.ts        GET
│
├── invites/
│   ├── pending/route.ts                   GET
│   └── [token]/
│       ├── route.ts                       GET   ← 인증 선택
│       └── response/route.ts              POST
│
├── friends/
│   ├── route.ts                           GET
│   └── requests/route.ts                  POST / PATCH
│
├── notifications/
│   ├── route.ts                           GET / DELETE
│   ├── [notificationId]/route.ts          PATCH / DELETE
│   └── settings/route.ts                  GET / PATCH
│
└── fcm-tokens/route.ts                    PUT
```

신규 Route Handler 파일은 22개이고 기존 파일 2개는 그대로 둔다. 경로와 메서드 조합이 lib 함수와 1대1로 대응한다.

서버 쿼리 코드는 다음 위치에 둔다.

```
src/lib/server/
├── nbread/          nbreadRecord/     notification/
├── fcmToken/        participant/      invite/
├── friend/          post/             chatMessage/
```

---

## 5. API 명세

### 5.1 공통 규약

| 항목 | 규약 |
|---|---|
| 인증 | `Authorization: Bearer <access_token>`을 보낸다. `GET /api/invites/[token]`만 예외다 |
| 성공 응답 | `200 { "data": ... }`, 생성은 `201`, 본문이 없으면 `204`를 쓴다 |
| 실패 응답 | `{ "message": string, "code"?: string }` 형태를 쓴다 |
| 상태 코드 | `400` 입력 검증 실패, `401` 토큰 없음 또는 만료, `403` 권한 없음, `404` 대상 없음, `409` 중복 또는 정원 초과, `500` 그 외 |
| 런타임 | 모든 Route Handler에 `export const runtime = 'nodejs'`를 선언한다 |
| 캐시 | `export const dynamic = 'force-dynamic'`을 선언하고 클라이언트 fetch에 `cache: 'no-store'`를 붙인다 |
| 네이밍 | 요청과 응답 본문은 camelCase를 쓴다. snake_case 변환은 서버가 담당한다 |
| 사용자 식별 | 서버는 항상 토큰의 `user.id`를 기준으로 동작한다. 클라이언트 lib의 `userId` 인자는 시그니처에 남기되 서버는 무시한다. 다른 사용자의 id를 다루는 경우에만 본문으로 받는다 |
| 401 처리 | 클라이언트 `apiClient`가 401을 받으면 `getSession()`으로 세션을 갱신하고 1회 재시도한다. 그래도 실패하면 로그아웃 처리한다 |

### 5.2 매핑표

#### nbread

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getUserNbreads` | `GET /api/nbreads` | — | `{ monthlyNbreads, myNbreads }` |
| `insertNbread` | `POST /api/nbreads` | `Nbread` | `201 { id }` |
| `getNbread` | `GET /api/nbreads/[nbreadId]` | — | `Nbread` |
| `updateNbread` | `PATCH /api/nbreads/[nbreadId]` | `Nbread` | `204` |
| `deleteNbread` | `DELETE /api/nbreads/[nbreadId]` | — | `204` |
| `getUserTotalNbreadAmount` | `GET /api/nbreads/summary` | — | `{ totalAmount }` |
| `fetchNbreadData` | `GET /api/nbreads/records` | — | `{ nbreadId, paymentDate }[]` |
| `createLinkInvite` | `POST /api/nbreads/[nbreadId]/invites/link` | — | `201 { inviteToken }` |

#### nbreadRecord

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getNbreadRecords` | `GET /api/nbreads/[nbreadId]/records?startDate=` | — | `NbreadRecord[]` |
| `updateNbreadRecord` | `PATCH /api/nbreads/[nbreadId]/records` | `{ userId, isPaid, startDate }` | `204` |

`userId`를 본문으로 받는 이유는 다른 참여자의 납부 상태를 변경하는 기능이기 때문이다.

#### participant

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getParticipants` | `GET /api/nbreads/[nbreadId]/participants` | — | `Participant[]` |
| `insertParticipant` | `POST /api/nbreads/[nbreadId]/participants` | `{ isLeader }` | `{ isInsert, title, subTitle, buttonTitle }` |
| `deleteParticipants` | `DELETE /api/nbreads/[nbreadId]/participants?userId=` | — | `204` |
| `isGetParticipantsUser` | 노출하지 않는다 | | 서버 내부 헬퍼다 |
| `participantUsers` | 노출하지 않는다 | | 서버 내부 헬퍼다 |

#### post

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getPost` | `GET /api/nbreads/[nbreadId]/posts` | — | `PostRow[]` |
| `InsertPost` | `POST /api/nbreads/[nbreadId]/posts` | `PostInsert` | `201` |
| `UpdatePost` | `PATCH /api/nbreads/[nbreadId]/posts/[postId]` | `{ content }` | `204` |
| `deletePost` | `DELETE /api/nbreads/[nbreadId]/posts/[postId]` | — | `204` |

#### chatMessage

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getChatMessages` | `GET /api/nbreads/[nbreadId]/messages` | — | `ChatMessageRow[]` |
| `insertChatMessage` | `POST /api/nbreads/[nbreadId]/messages` | `{ content }` | `201 ChatMessageRow` |

`formattedTime`은 클라이언트 lib에서 생성한다. 실시간 구독(`src/components/chat/ChatRoom.tsx:140`)은 그대로 클라이언트에 남긴다.

#### invite

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getInviteByToken` | `GET /api/invites/[token]` | — | `InviteDetails \| null` (**인증 선택**) |
| `getPendingInvites` | `GET /api/invites/pending` | — | `PendingInvite[]` |
| `respondToInvite` | `POST /api/invites/[token]/response` | `{ response }` | `InviteResponseResult` |
| `sendInviteRequest` | `POST /api/nbreads/[nbreadId]/invites` | `{ targetUserId }` | `{ status, inviteToken }[]` |
| `getInviteUser` | `GET /api/nbreads/[nbreadId]/invites/candidates?tag=` | — | `{ id, profile_image, name, status }[]` |

`respondToInvite`는 `respond_to_nbread_invite` RPC를 호출한다. Route Handler에서도 동일하게 RPC로 호출하며 함수의 보안 속성은 건드리지 않는다.

#### friend

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getSearchFriend` | `GET /api/users/search?tag=` | — | `{ name, profileImage, senderId, receiverId, status }[]` |
| `getFriendList` | `GET /api/friends?nbreadId=` | — | `FriendListItem[]` |
| `sendFriendRequest` | `POST /api/friends/requests` | `{ receiverId, status }` | `{ status }[]` |
| `updateAcceptFriend` | `PATCH /api/friends/requests` | `{ senderId, status: 'accepted' }` | `204` |
| `updateRejectedFriend` | `PATCH /api/friends/requests` | `{ senderId, status: 'rejected' }` | `204` |
| `getInviteFriendList` | 호출부 확인 후 결정한다 | | `확인 필요` |

#### notification

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `getNotification` | `GET /api/notifications` | — | `Notification[]` |
| `deleteAllNotifications` | `DELETE /api/notifications` | — | `204` |
| `markNotificationAsRead` | `PATCH /api/notifications/[notificationId]` | `{ isRead: true }` | `204` / `404` |
| `deleteNotification` | `DELETE /api/notifications/[notificationId]` | — | `204` / `404` |
| `getNotificationState` | `GET /api/notifications/settings` | — | `NotificationSettings` |
| `updateNotificationState` | `PATCH /api/notifications/settings` | `NotificationSettingsUpdate` | `NotificationSettings` |

`getNotification`의 정렬(`sortNotifications`)은 순수 함수이므로 클라이언트에 남긴다. `getNotificationState`는 설정 행이 없으면 기본값을 생성해 반환하는 현재 동작을 그대로 유지한다. `markNotificationAsRead`와 `deleteNotification`은 영향받은 행이 1개가 아니면 오류를 내는 현재 동작을 `404`로 매핑한다.

#### fcmToken

| lib 함수 | 메서드 · 경로 | 요청 | 응답 |
|---|---|---|---|
| `upsertFcmToken` | `PUT /api/fcm-tokens` | `{ fcmToken }` | `204` |

---

## 6. 리스크

| 항목 | 내용 | 대응 |
|---|---|---|
| 왕복 지연 증가 | 브라우저에서 Supabase로 직행하던 요청이 브라우저 → 배포 서버 → Supabase로 늘어난다. 배포 리전과 Supabase 리전이 멀면 체감 지연이 생긴다 | 파일럿 단계에서 실측하고, 문제가 되면 리전 배치를 검토한다 |
| RLS 정책 원본 부재 | 정책이 대시보드에서 관리되고 있어 마이그레이션에 SQL이 남아 있지 않다. `supabase/migrations/`에 `create policy` 구문이 하나도 없다 | 이번 작업은 RLS를 그대로 유지하므로 영향이 없다. 다만 후속 이슈에서 service role로 전환할 때는 서버에서 재구현할 권한 규칙의 원본이 필요하므로 그 시점에 정책을 다시 확인한다 |
| Sentry 이슈 분류 변경 | `captureAppError` 호출이 클라이언트에서 서버로 이동하면서 이슈가 서버 이슈로 분류된다 | 태그로 구분할 수 있도록 `action` 값을 유지한다 |
| 토큰 만료 처리 | Bearer 방식은 매 요청마다 유효한 토큰이 필요하다 | `apiClient`에서 401을 받으면 `getSession()`으로 갱신 후 1회 재시도한다 |
| 요청당 검증 왕복 | `requireAuth`가 매 요청 `getUser(token)`을 호출하므로 Supabase 왕복이 1회 추가된다 | 명확한 401 응답과 Sentry 사용자 식별을 위해 감수한다 |
| 클라이언트 재사용 사고 | JWT를 바인딩한 클라이언트를 모듈 최상위에 두면 다른 사용자의 토큰으로 쿼리가 나간다 | `createRouteClient`는 요청마다 호출하도록 강제하고 코드 리뷰 항목으로 지정한다 |

---

## 7. 후속 이슈 목록

이번 작업 범위에서 의도적으로 제외했으며 별도 이슈가 필요한 항목이다.

1. **SSR 및 쿠키 세션 전환** — `@supabase/ssr` 도입, `middleware.ts` 추가, `createRouteClient`를 `createServerClient`로 교체, `lib/termsAgreement.ts`와 `protectRoute.tsx`, `useAuthCallbackFlow.ts` 정리
2. **`insertParticipant` 정원 검사 원자화** — 정원 확인과 참여 삽입 사이의 경쟁 조건을 RPC 또는 트랜잭션으로 제거한다
3. **service role 전환과 서버 측 권한 검증** — RLS 우회 대상 엔드포인트를 선별하고 권한 규칙을 서버에 구현한다
4. **`getUserNbreads` N+1 제거** — `src/lib/nbread/getUserNbread.ts:60`이 엔빵 개수만큼 count 쿼리를 반복한다
5. **미사용 코드 제거** — `lib/auth.ts`의 `getUserName`, `getUser`
6. **에러 처리 규약 통일** — `catch` 블록에서 값을 삼키는 함수들을 정리한다
7. **`lib/post` 타입 정리** — `any` 사용을 제거한다
8. **클라이언트 lib의 `userId` 인자 제거** — 서버가 토큰 기준으로 동작하므로 인자가 불필요해진다

---

## 8. PR 분리 계획

`AGENTS.md`의 "하나의 Issue는 가능한 하나의 PR로 구현한다" 원칙에 따라 아래와 같이 나눈다.

| 단계 | 범위 | 산출물 |
|---|---|---|
| 0 | 공통 기반 + 파일럿 | `src/lib/apiClient.ts`, `src/app/api/_lib/*`, `notification` 6함수, `fcmToken` 1함수 |
| 1 | `nbread`, `nbreadRecord` | 10함수 |
| 2 | `participant`, `invite` | 10함수 |
| 3 | `friend`, `users/search` | 6함수 |
| 4 | `post`, `chatMessage` | 6함수 |

0단계에서 응답 형식, 401 처리, `requireAuth`, `createRouteClient`를 모두 검증한 뒤 나머지 단계는 같은 규약을 기계적으로 따른다. 파일럿으로 `notification`과 `fcmToken`을 고른 이유는 단순 CRUD이고 다른 도메인과의 결합이 없어 회귀 위험이 가장 낮기 때문이다.

각 단계마다 `npm run lint`와 `npm run build`를 확인하고, 해당 기능에 Playwright 테스트가 있으면 함께 검증한다.

---

## 확인 필요

- `getInviteFriendList`(`src/lib/friend/getSearchFriend.ts`)의 실제 호출부가 있는지 확인하고 엔드포인트 노출 여부를 결정한다.
- 배포 리전과 Supabase 리전의 물리적 거리에 따른 지연 증가폭을 파일럿 단계에서 실측한다.
- `lib/post`의 `PostRow` 대응 타입이 `src/types/post.ts`에 정의되어 있는지 확인한다.

## 다시 물어볼 질문

- 파일럿 단계 실측 결과 지연 증가가 허용 범위를 넘으면 어떤 대안을 택할 것인가?
- SSR 전환 이슈에서 `protectRoute.tsx`의 역할을 middleware로 어디까지 옮길 것인가?
