# 채팅 렌더링 성능 개선 검증 계획서

- 검증 대상: PR [#144](https://github.com/andbread/Andbread_Frontend/pull/144) `[refactor-52/chatroom-render] 채팅방 렌더링 성능 최적화` (merge commit `a1c2050`, 2026-05-31 머지)
- 관련 이슈: #52
- 기존 기록: https://hm1n.github.io/chat-rendering-performance/
- 문서 상태: 확정 (미결정 사항 해소 완료, 14절 참고)

---

## 1. 왜 다시 측정하는가

기존 개선 과정의 결론(commit당 40~60ms → 1~2ms, MessageList 53.2ms → 21.6ms)은 방향은 맞지만 근거로 쓰기에는 약하다. 한계 세 가지와 이번 계획의 대응은 다음과 같다.

| 기존 한계 | 실제 원인 | 이번 대응 |
|---|---|---|
| 운영 환경에서의 검증이 어려웠다 | React DevTools Profiler는 개발 빌드에서만 쉽게 붙는다. 개발 빌드는 번들이 다르고 StrictMode 이중 렌더가 섞여 절대값이 부풀려진다 | `next build --profile` + 운영 Supabase 연결. 번들과 데이터, 네트워크를 운영과 일치시킨 상태에서 Profiler 수집 (4절) |
| 성능 측정 환경이 명확하게 정의되지 않았다 | 기기, CPU 스로틀링, 메시지 개수, 브라우저 상태가 기록되지 않아 재현 불가 | 측정 환경을 명세로 고정하고, 실행 스크립트와 원시 데이터를 함께 남긴다 (4, 5, 9절) |
| 측정 횟수가 적어 신뢰도가 낮다 | 스크린샷 1~2장이 곧 결론이었다. 분산과 이상치를 알 수 없다 | 조건당 20회 반복 + 순서 교차 + 중앙값/IQR/p95/통계 검정 (8절) |

추가로 **가설과 판정 기준을 측정 전에 확정**한다(12절). 결과를 본 뒤 유리한 지표만 고르는 것을 막기 위함이다.

---

## 2. 검증 대상 변경 사항

PR #144은 7개 파일, +269/-140이다. **초판은 PR 설명을 기준으로 4축(A~D)만 세웠으나, diff를 전수 조사한 결과 7축이었다**(2026-09-22 갱신). 빠뜨린 축 중 E는 실측에서 단일 기여가 가장 컸다.

### 2.1 성능 측정 대상

| 축 | 변경 내용 | 파일 | 노리는 효과 | 지표 |
|---|---|---|---|---|
| **A. 렌더 차단** | 인라인 `map`을 `MessageList`/`MessageItem`으로 분리, 양쪽 `memo`, `key={index}` → `key={message.id}` | `MessageList.tsx`, `MessageItem.tsx` (신규), `ChatRoom.tsx` | 입력·수신 시 기존 메시지 리렌더 차단 | 렌더 비용 |
| **B. 낙관적 업데이트** | `temp-` 메시지 즉시 삽입, `status`, 실패 시 롤백, `mergeIncomingMessage`로 에코 중복 병합 | `ChatRoom.tsx`, `chatMessage.ts` | 서버 왕복을 화면에서 제거 | 체감 지연 |
| **C. 시간 포맷 사전 계산** | `formatChatMessageTime` 신설, `ChatMessage.formattedTime` 추가, 조회·삽입·수신 시점에 1회 계산 | `formatChatMessageTime.ts` (신규), `getChatMessages.tsx`, `insertChatMessage.tsx` | 렌더마다 메시지당 2회 돌던 `toLocaleString()` 제거 | 렌더 비용 |
| **E. Realtime 구독 정상화** | `nbreadId`를 `useState`에서 `useMemo`로, `if (!nbreadId) return` 가드, async 제거로 cleanup 정상 반환 | `ChatRoom.tsx` | 빈 채널 접속과 재시도 제거, 채널 누수 차단 | 체감 지연 |
| **F. 스크롤 처리 교체** | `scrollState` 상태와 `setTimeout(100)` 제거, `requestAnimationFrame` + cleanup, 의존성을 `chatMessages.length`로 | `ChatRoom.tsx` | 상태 1개분 리렌더와 고정 100ms 지연 제거 | 체감 지연 |

### 2.2 성능 측정 대상이 아닌 것

| 축 | 변경 내용 | 성격 |
|---|---|---|
| **D. IME 가드** | `onKeyPress` → `onKeyDown` + `isComposing` + `preventDefault` | 한글 마지막 글자 중복 전송 **버그 수정**. 회귀 확인만 (11절) |
| **G. 타입 정리** | `userProfileImage: string \| null`, `userId ?? ''`, `insertChatMessage` 반환을 `id`에서 `ChatMessage` 전체로 | B축의 전제. 낙관적 메시지를 실제 메시지로 치환하려면 전체 객체가 필요 |

### 2.3 축을 더 쪼갤 수 없는 이유

A와 B는 내부 변경을 분리하면 기능이 깨져 측정 자체가 성립하지 않는다.

- **A**: `memo`는 컴포넌트가 분리돼야 걸 수 있고, `key={index}`면 목록 중간에 삽입이 일어날 때 `memo`가 무력화된다. 셋이 하나의 기능이다.
- **B**: 병합 없이 낙관적 삽입만 하면 에코가 도착할 때 메시지가 중복된다.

`key` 교체와 병합 로직은 **개선 전 코드에 단독으로 넣어도 수치가 변하지 않는다.** Before는 `memo`가 없어 key가 무엇이든 전부 다시 그리고, 낙관적 메시지가 없어 병합할 대상이 없다. 단독 효과가 0인 것이 아니라 단독으로는 측정이 성립하지 않는다.

### 2.4 초판 대비 변경 이력

| | 초판 (2026-08-28) | 갱신 (2026-09-22) |
|---|---|---|
| A | 분리 + memo | key 교체를 편입 |
| B | 낙관적 업데이트 | 병합 로직을 편입 |
| C | 변경 없음 | |
| D | 성능 아님 | 변경 없음 |
| **E** | **없었음** | 신설. 실측 단일 기여 최대 |
| **F** | **없었음** | 신설. 효과 100ms 내외 |
| **G** | **없었음** | 신설. 성능 아님, 기록용 |

> 기존 블로그는 A와 C 위주로 서술했고, 체감 지연에 크게 기여한 B와 E는 수치로 다루지 않았다. 또한 A의 효과가 가장 크게 드러나는 **입력창 타이핑(S4)** 이 측정되지 않았다.

## 3. Before / After 빌드 구성

### 3.1 방식: 과거 커밋 체크아웃이 아니라 PR diff 역적용

- **After** = `develop` HEAD
  - 근거: `src/components/chat/`, `src/lib/chatMessage/` 커밋 이력 확인 결과 PR #144 이후 채팅 관련 파일에 변경 없음. 즉 현재 develop의 채팅 코드 = PR #144 직후 상태.
- **Before** = `develop` HEAD + PR #144 diff 역적용

```bash
git diff 1760083 a1c2050 -- \
  src/components/chat src/lib/chatMessage \
  src/types/chatMessage.ts src/utils/formatChatMessageTime.ts > pr144.patch

git apply -R pr144.patch   # 사전 확인 완료: 충돌 없이 적용됨
```

**왜 이 방식인가**: PR 머지 시점(2026-05-31)의 커밋을 그대로 체크아웃하면 Next.js/React/Sentry 버전, 라우팅 구조, 공통 컴포넌트 등 채팅과 무관한 3개월치 변경이 전부 섞여 들어와 **무엇이 성능 차이를 만들었는지 귀속시킬 수 없다**. 역적용은 채팅 변경만 격리한다.

**주의**: 이 방식의 결론은 "현재 코드베이스 위에서 PR #144의 변경이 갖는 효과"다. "2026년 5월 당시 앱 전체의 성능 차이"가 아니다. 보고서에 이 범위를 명시한다.

### 3.2 사전 점검 결과 (2026-08-28 완료)

| 항목 | 결과 |
|---|---|
| PR diff 역적용 | **통과.** 충돌 없음. 패치 파일 `docs/performance/pr144-reverse.patch`로 보존 |
| `chat_messages` 스키마 호환 | **통과.** 베이스라인 이후 마이그레이션 6건 중 `chat_messages` 컬럼 변경 없음. Before가 쓰는 `id / content / nbread_id / user_id / user_name / user_profile_image / created_at` 전부 존재 |
| RLS 호환 | **통과.** INSERT 정책이 `user_id = auth.uid()` + 참여자 여부만 요구. Before/After 동일 조건 |
| `useAuthStore` / `Avatar` / `Toast` 시그니처 | **통과.** 빌드 타입 체크 통과 |
| After 빌드 (`next build --profile`) | **성공.** `/nbread/[nbreadId]` 12.2 kB / First Load 322 kB |
| Before 빌드 (`next build --profile`) | **성공.** `/nbread/[nbreadId]` 11.7 kB / First Load 321 kB |

`npx tsc --noEmit`은 SVG 모듈 선언 부재로 다수 오류를 내지만 `next-env.d.ts` 미생성 때문이며 Before/After 공통이다. 판정 기준은 `next build`로 한다.

### 3.3 사전 점검에서 확인한 Before 코드 특성

측정 해석에 영향을 주므로 기록해 둔다.

- **C축 비용 위치**: Before는 `ChatRoom` 렌더 본문의 `isLastInMinuteGroup()`에서 메시지마다 `toLocaleString()`을 **2회**(현재/다음 메시지) 호출한다. 100건이면 렌더당 약 200회.
- **B축 비교 대상**: Before의 전송 경로는 `insertChatMessage` await → Realtime echo 수신 → `setTimeout(100)` 후 스크롤이다. 화면 반영이 서버 왕복에 완전히 종속된다.
- **Realtime 구독**: Before의 `useEffect(() => { subscribeChatRoom() }, [nbreadId])`는 async 함수를 호출해 cleanup 반환값이 React에 전달되지 않는다(채널 정리 누락). 또 `nbreadId` 초기값이 `''`이라 구독이 두 번 시도된다. S3 측정 시 중복 수신 여부를 assert로 확인한다.
- **타입 차이**: Before의 `ChatMessage`에는 `formattedTime`, `status`가 없다. 계측 코드는 이 차이에 의존하지 않도록 작성한다.

### 3.4 측정 대상 URL

채팅은 독립 라우트가 아니라 엔빵 상세의 탭이다(`src/app/nbread/[nbreadId]/page.tsx:100`). `?tab=chat` 쿼리로 진입하면 초기 탭이 채팅으로 잡히므로, **`/nbread/<test-nbread-id>?tab=chat`** 로 바로 진입한다. 탭 클릭 조작이 불필요해 S1 측정이 깔끔해진다.

### 3.5 환경 변수 주의 (중요)

현재 저장소의 `.env.local`은 **개발 Supabase**(`ugujkypcxlpalihcrvjt`)를, `.env`는 **운영 Supabase**(`yyisakaqnaoomehqlyjz`)를 가리킨다. Next.js 우선순위상 `.env.local`이 `.env`를 덮으므로, 그대로 두면 **운영이 아니라 개발 프로젝트에 붙은 채 측정하게 된다.**

대응: 측정용으로 `.env.production.local`에 운영 값을 넣는다(우선순위 `.env.production.local` > `.env.local`). 측정 시작 시 앱이 실제로 붙은 프로젝트 ref를 로그로 남겨 검증한다.

### 3.6 계측 코드 (양쪽 동일 적용)

`<Profiler id="...">` 래퍼 + `onRender` 콜백에서 `{ id, phase, actualDuration, baseDuration, startTime, commitTime }`을 `window.__perfLog`에 push. Before/After **동일한 위치, 동일한 코드**로 삽입하고, 계측 자체를 별도 커밋으로 분리해 diff로 동일함을 증명한다.

Before에는 `MessageList` / `MessageItem`이 없으므로 `Profiler` id는 양쪽 공통인 `ChatRoom`을 기준으로 잡고, 하위 컴포넌트 지표는 After에서만 추가 수집한다. **Before 대 After 비교는 `ChatRoom` 서브트리 전체 지표로만** 한다.

### 3.7 서버 기동

Before(포트 3000)와 After(포트 3001) 두 서버를 **측정 내내 동시에 띄워 둔다**. 조건을 번갈아 측정(8절)하려면 매번 재빌드할 수 없고, idle 서버 부하가 양쪽에 대칭으로 실린다.

한 워크트리는 한 시점의 코드만 가질 수 있으므로, Before 전용 워크트리를 하나 더 만들어 각자 빌드한다. (세션은 하나지만 **코드 디렉터리는 둘** 필요하다.) `.env.production.local`은 양쪽에 동일하게 둔다.

---

## 4. 측정 환경 명세

### 4.1 고정 항목

측정 전 아래 표를 실제 값으로 채워 보고서에 그대로 싣는다. 빈칸이 남으면 측정하지 않는다.

| 항목 | 고정 값 |
|---|---|
| 기기 / CPU / RAM | 개발 PC 1대 (사양 기록) |
| OS 버전 | Windows 11 Pro 26200 |
| 전원 설정 | AC 연결, 고성능 모드 고정 (배터리 절전 금지) |
| 브라우저 / 버전 | Chrome (버전 기록, 측정 기간 중 자동 업데이트 차단) |
| 브라우저 프로필 | 측정 전용 신규 프로필, 확장 프로그램은 React Developer Tools **하나만** |
| 창 크기 | 1280x800 고정 |
| CPU 스로틀링 | **4x 고정** (모바일 근사). CDP `Emulation.setCPUThrottlingRate` |
| 앱 빌드 | `next build --profile` → `next start` (`NODE_ENV=production`) |
| 백엔드 | **운영 Supabase** (프로젝트 ID `yyisakaqnaoomehqlyjz`) |
| Sentry | 측정 중 비활성화 (양쪽 동일) |
| React StrictMode | 사용 여부 확인 후 양쪽 동일하게 고정 |
| 백그라운드 | 측정 중 다른 앱/탭/동기화 클라이언트 종료 |

### 4.2 네트워크 조건 (2수준)

CDP `Network.emulateNetworkConditions`로 적용한다.

| ID | 이름 | 설정 | 목적 |
|---|---|---|---|
| **N1** | 원활 | 스로틀링 없음 (유선 또는 고정 Wi-Fi) | 렌더 비용 자체를 네트워크 잡음 없이 관측 |
| **N2** | 지연 | **RTT +400ms**, 대역폭 제한 없음 (down/up 무제한) | 낙관적 업데이트(B축)가 실제로 숨기는 것은 **왕복 지연**이지 대역폭이 아니다. 지연만 키워 B축 효과를 분리 관측 |

> N2를 "Slow 3G 프리셋"으로 잡지 않는 이유: 대역폭까지 함께 줄이면 초기 번들 다운로드 시간이 지배해 렌더/전송 지표가 묻힌다. 대역폭 영향은 이번 검증 대상이 아니다.

### 4.3 절대값 비교에 대한 경고

이번 절대값은 블로그의 41.9~77.5ms와 **직접 비교하지 않는다**. 블로그 수치는 개발 빌드로 추정되고 이번은 프로덕션 빌드다. 비교는 "같은 환경에서의 Before 대 After 비율"로만 한다.

---

## 5. 측정 시나리오와 실행 매트릭스

메시지 규모: **100건**(블로그 재현) / **300건**(확장성).

| ID | 시나리오 | 검증 축 |
|---|---|---|
| **S1** | 채팅방 진입 후 초기 목록 렌더 완료 | C |
| **S2** | 내 메시지 1건 전송 (Enter) | A, B, C |
| **S3** | 상대 메시지 1건 수신 (Realtime INSERT) | A |
| **S4** | 입력창에 10자 타이핑 (키 입력당 리렌더) | A |
| **S5** | 연속 5건 전송 | A, B |

S4를 넣는 이유: Before 구현은 `inputText` 상태가 메시지 목록과 같은 컴포넌트에 있어 **한 글자 입력마다 전체 메시지가 리렌더**된다. A축 효과가 가장 선명하게 드러나는 지점인데 기존 측정에 빠져 있었다.

### 실행 매트릭스 (세션 1개 기준)

| 시나리오 | (규모, 네트워크) 조합 | 셀 수 |
|---|---|---|
| S1 | (100,N1) (100,N2) (300,N1) | 3 |
| S2 | (100,N1) (100,N2) (300,N1) | 3 |
| S3 | (100,N1) (100,N2) | 2 |
| S4 | (100,N1) (300,N1) — 네트워크 무관 | 2 |
| S5 | (100,N1) (100,N2) | 2 |
| **합계** | | **12셀** |

12셀 x 2조건(Before/After) x 20회 = **480 측정런**. 여기에 셀당 워밍업 3회(x2조건)가 붙어 실제 페이지 로드는 **552회**, 실측 처리량 기준 약 3시간이다.

- 300건 규모는 N2와 조합하지 않는다. 네트워크 지연과 메시지 규모는 상호작용이 거의 없고, 조합을 늘리면 실행 시간만 배가된다.
- S4는 네트워크를 타지 않으므로 N1만.

---

## 6. 측정 지표

### 6.1 렌더 비용 (1차 지표)

- 시나리오당 **commit 발생 횟수**
- **commit duration 합계 / 최대값 / 중앙값**
- `MessageList` **actualDuration**
- `MessageItem` **렌더 호출 횟수** (memo 효과의 직접 증거)

수집: React `<Profiler>` `onRender` → `window.__perfLog` → Playwright가 회수해 JSON 저장.

### 6.2 체감 지연 (2차 지표)

- **Enter keydown → 메시지 DOM 페인트**까지 (User Timing `performance.mark` / `measure`)
- **INP** (Event Timing API)
- **Long Task 합계 / TBT** (`PerformanceObserver({type:'longtask'})`)
- (참고) Supabase insert 왕복 시간. 렌더 비용과 **분리해서** 기록한다. B축 효과가 네트워크 개선으로 오독되지 않게 하기 위함.

### 6.3 왜 DevTools 이미지가 1차 지표가 아닌가

스크린샷은 20회 반복의 분포를 담지 못한다. 따라서 **통계는 Profiler API 로그로 내고, DevTools Profiler는 시각 증거로 병행**한다. 다만 DevTools는 이미지보다 **프로파일 export(.json)** 가 더 강한 증거이므로 둘 다 남긴다(9절).

---

## 7. 운영 DB 사용 안전 절차

운영 Supabase에 직접 쓰기로 결정했으므로, 아래 절차를 **측정 시작 전에 완료**한다.

### 7.1 확인된 위험: 채팅 INSERT가 알림을 발사한다

`supabase/migrations/20260818000000_dev_only_webhook_triggers_for_notification_functions.sql:79`

```sql
create or replace trigger trg_chat_notification
after insert on public.chat_messages
for each row execute function public.notify_edge_function('chat-notification')
```

이 트리거 자체는 andbread-dev 전용이지만, 운영은 Dashboard Database Webhook으로 **동일한 `chat-notification` edge function을 호출**한다(커밋 `9a42e56` 참고). 즉 운영에 메시지를 300건 시딩하면 **edge function 300회 호출 + 그룹 참여자에게 푸시 알림 + `notification` 테이블 행 누적**이 발생한다.

트리거를 우회하는 시딩은 불가능하다(`session_replication_role` 변경은 superuser 권한 필요, Supabase에서 미제공). 따라서 **발사는 허용하되 수신자를 없앤다**.

### 7.2 무해화 절차 (2026-08-28 완료)

`supabase/functions/chat-notification/index.ts`를 확인한 결과, 알림 대상은 **① 해당 엔빵 참여자 중 ② 발신자를 제외하고 ③ 알림 설정이 켜진 사용자**다. 따라서 참여자를 테스트 계정으로만 채우고 알림 설정을 끄면 실사용자에게 도달할 경로가 없다.

| 조치 | 상태 |
|---|---|
| 전용 테스트 계정 2개 생성 (S3 상대 발신자 필요) | 완료. `scripts/perf/setup-test-accounts.mjs` |
| 두 계정 `user_notification_settings` 전 항목 off | 완료 (`all/chat/invite/friend/payment` 전부 false) |
| 두 계정 `fcm_token` 0건 | 완료 |
| 전용 엔빵 그룹 생성, 참여자를 테스트 계정 2개로 한정 | 완료 |
| 측정 중 두 계정으로 실제 기기 로그인 금지 (토큰 재등록 방지) | 측정 시 준수 |
| `chat-notification` edge function 호출량 급증 사전 공유 | 필요 |

**계정 생성 방식**: 서비스는 소셜 로그인만 제공하므로 UI로는 테스트 계정을 만들 수 없다. Supabase **Auth Admin API로 email/password 계정을 생성**했다. 단, `auth.users` INSERT 트리거 `insert_into_public_users()`는 provider가 `kakao`/`google`일 때만 `public.user` 행을 만들므로, email provider 계정은 `public.user` 행을 스크립트에서 직접 넣었다(약관 동의 필드 포함, 그래야 `/terms-agreement`로 튕기지 않는다).

**생성된 자원** (운영 `yyisakaqnaoomehqlyjz`)

| 항목 | 값 |
|---|---|
| 테스트 엔빵 ID | `37489672-47fe-498e-8218-2b96287c03f3` |
| 계정 A (리더, 발신자) | `nbread-perf-test-a@example.com` / `9dc71674-2eb2-4133-9daa-867d83c02c6b` |
| 계정 B (S3 상대 발신자) | `nbread-perf-test-b@example.com` / `a5dbb632-07dd-4ba4-a142-15abc0fb5c58` |
| 측정 URL | `/nbread/37489672-47fe-498e-8218-2b96287c03f3?tab=chat` |

비밀번호는 저장소에 남기지 않는다(스크립트가 출력한 JSON을 로컬 임시 경로에 보관).

**동작 검증 완료**: 계정 A로 `signInWithPassword` 로그인 성공 → `chat_messages` INSERT 성공(RLS 참여자 정책 통과) → SELECT → DELETE까지 확인. 운영에서 email provider 로그인이 열려 있음을 확인했다.

**로그인 주입 방식**: 앱 UI에는 email/password 입력이 없으므로, 측정 스크립트는 `signInWithPassword`로 받은 세션과 zustand 사용자 정보를 **localStorage에 직접 주입**한다(`sb-<ref>-auth-token`, `user-store`). 소셜 로그인 UI 흐름을 타지 않으므로 측정 시작 지점이 매 회차 동일해진다.

### 7.3 시딩 정책 (쓰기량 최소화)

- 시딩은 **셀 단위 1회**. 20회 반복마다 다시 넣지 않는다.
- 각 런에서 새로 생성되는 메시지(S2 1건, S5 5건)만 런 종료 후 삭제.
- 규모 전환(100 → 300) 시 전량 삭제 후 재시딩.
- 총 쓰기 추정: 시딩 수천 건 + 전송 약 2,000건 수준.

### 7.4 정리 및 검증

측정 종료 후 `scripts/perf/cleanup-test-accounts.mjs`를 실행한다. 역순으로 제거하고 잔존 0건을 검증한 뒤 JSON으로 출력하며, 하나라도 남으면 비정상 종료한다.

```bash
node scripts/perf/cleanup-test-accounts.mjs <setup 결과 JSON 경로>
```

제거 순서: `chat_messages` → `notification` → `participant` → `nbread` → `user_notification_settings` / `fcm_token` → `auth.users`. 마지막 단계에서 `delete_user_from_public` 트리거가 `public.user` 행을 함께 지운다.

- [ ] 정리 스크립트 출력(전 항목 0건)을 보고서에 첨부
- [ ] 테스트 계정과 엔빵 그룹 삭제 여부 결정 (남겨두면 재측정 시 재사용 가능)

---

## 8. 반복 횟수와 통계 처리

- 워밍업 3회 수행 후 **폐기** (JIT, 캐시 안정화)
- 본 측정 **셀당 20회**
- **순서 교차**: Before 20회 후 After 20회가 아니라 `B, A, B, A, ...` 로 번갈아 실행. 기기 발열이나 백그라운드 드리프트가 한쪽에만 실리는 것을 막는다.
- 각 회차는 **새 페이지 로드**로 시작해 상태 누적 방지

보고 방식:

- **중앙값 + IQR + p95** 를 주 지표로 사용 (평균과 표준편차 단독 보고 금지, 이상치에 취약)
- **Mann-Whitney U 검정** (정규성 가정 없음, 소표본 적합)으로 p-value 산출
- **효과 크기**(rank-biserial correlation) 병기. "통계적으로 유의하지만 실무적으로 무의미"한 결론 방지
- 이상치는 제거하지 않고 전량 공개, 원인만 주석으로 남긴다

---

## 9. 산출 증거물

1. **원시 데이터 전량** - 조건 x 시나리오 x 회차별 JSON/CSV
2. **React DevTools Profiler 화면 캡처** - 조건별로 *중앙값에 가장 가까운 회차* 1건씩 (가장 좋은 회차 아님)
3. **DevTools Profiler export `.json`** - 재검증 가능
4. **실행 스크립트 + 계측 patch** - 저장소에 커밋
5. **환경 명세표**(4절) 실측 값
6. **운영 DB 정리 검증 결과**(7.4절)
7. 최종 보고서 (Before/After 비교표, 결론, 한계)

저장 위치: `docs/performance/results/<날짜>/`

### 9.1 구현된 스크립트

| 스크립트 | 역할 |
|---|---|
| `scripts/perf/setup-test-accounts.mjs` | 테스트 계정 2개 + 엔빵 그룹 생성, 알림 무해화 |
| `scripts/perf/seed-messages.mjs` | 채팅방을 정확히 N건으로 맞춤 (두 계정 번갈아, 1분 간격) |
| `scripts/perf/run-measurement.mjs` | Before/After 교차 측정 러너 (Playwright + CDP) |
| `scripts/perf/analyze.mjs` | 중앙값/IQR/p95 + Mann-Whitney U + rank-biserial |
| `scripts/perf/cleanup-test-accounts.mjs` | 역순 삭제 + 잔존 0건 검증 |

러너는 회차마다 새 브라우저 컨텍스트를 열고, CDP로 CPU 4x 스로틀링과 네트워크 조건을 걸고, `signInWithPassword`로 받은 세션과 `user-store`를 localStorage에 주입한 뒤 `/nbread/<id>?tab=chat`으로 바로 진입한다. 회차가 끝나면 그 회차가 만든 `run-%` 메시지를 지워 방 상태를 원래 규모로 되돌린다.

DevTools Profiler 캡처만 수동이다(자동화 불가). 자동 측정 완료 후 대표 회차를 수동 재현해 캡처한다.

### 9.2 구현상의 결정과 편차

- **브라우저**: 자동 측정은 Playwright 번들 Chromium(headless shell), DevTools 캡처는 실제 Chrome(headed). 절대값은 두 경로가 다르지만 **Before/After가 동일 브라우저를 쓰므로 비교는 유효**하다. 보고서에 병기한다.
- **계측 삽입 위치**: `PerfProfiler`는 PR #144 diff에 포함되지 않은 `src/app/nbread/[nbreadId]/page.tsx`의 `<ChatRoom />` 호출부만 감싼다. 두 디렉터리의 계측 파일이 바이트 단위로 동일함을 `cmp`로 확인했다.
- **INP 자동 수집 제외**: Event Timing 기반 INP는 회차당 상호작용이 1~5회뿐이라 안정적으로 잡히지 않는다. **Enter keydown → 페인트 직후(double rAF)** 시간과 **Long Task 합계**로 대체한다.
- **`actualDuration / baseDuration` 비율**: Before에는 `MessageItem`이 없어 하위 컴포넌트 렌더 횟수를 양쪽 동일하게 셀 수 없다. 대신 이 비율을 memo 차단 효과의 자동 수집 대리 지표로 쓴다(하위 트리를 건너뛸수록 비율이 떨어진다). 렌더 횟수 0회 증거는 DevTools 캡처로 남긴다.
- **Before 디렉터리**: `git worktree`로 임시 경로에 만들고 `node_modules`는 정션으로 공유한다(의존성 동일 보장 + 설치 시간 절약).
- **서버 기동**: `next start`가 셸 래퍼에 가로채여 `-p` 옵션이 먹히지 않으므로 `PORT` 환경 변수와 `node node_modules/next/dist/bin/next start`로 직접 띄운다.

---

## 10. 실행 방식: 단일 세션

측정 기기가 1대이므로 **여러 세션을 병렬로 돌리면 CPU를 경합해 양쪽 측정이 모두 오염된다.** 순차로 돌린다면 병렬화 이득도 없다. 따라서 전 과정을 **한 세션에서 진행**한다.

측정 신뢰도는 세션 수가 아니라 8절(셀당 20회, 조건 교차, 중앙값/IQR/검정)로 확보한다. 어차피 조건 교차 실행 자체가 "같은 조건을 시간상 흩어서 20번 반복"이므로, 기기 상태 드리프트는 이미 양쪽 조건에 균등하게 실린다.

선택 사항: 결과가 예상과 크게 어긋날 경우, 동일 프로토콜을 **다른 시각에 1회 더** 돌려 재현성을 확인한다. 이때도 기존 데이터를 덮지 않고 `results/<날짜>/run2/`로 분리 저장하고, 개선율의 부호가 뒤집히면 평균내지 않고 원인을 규명한다.

---

## 11. 리스크 및 교란 요인

| 리스크 | 영향 | 완화 |
|---|---|---|
| **운영 알림 발사** | 실사용자에게 테스트 푸시 발송 | 7.2절 무해화 절차 (전용 그룹, `fcm_token` 제거, 알림 설정 off) |
| **운영 데이터 잔존** | `chat_messages` / `notification` 오염 | 7.4절 정리 + 0건 검증 캡처 |
| Supabase 네트워크 지터 | S2 체감 지연 수치가 렌더 개선이 아닌 네트워크 변동을 반영 | 왕복 시간을 별도 지표로 분리 기록, N1/N2 대조로 지연 민감도 분리 |
| Realtime 수신 타이밍 비결정성 | S3 회차 간 분산 확대 | 회차 수 유지 + 중앙값 사용, 수신 시각 함께 기록 |
| 측정 중 다른 작업 실행 | CPU 경합으로 측정 오염 | 측정 시간대에는 빌드, 테스트, 다른 에이전트 실행 금지 (10절) |
| Profiler 계측 오버헤드 | 절대값 상승 | Before/After 동일 계측이므로 비교에는 영향 없음. 보고서에 명시 |
| Before 코드가 현재 스키마와 불일치 | 빌드나 런타임 실패 | 3.2절 사전 점검에서 선확인 |
| 브라우저 자동 업데이트 | 측정 도중 조건 변경 | 측정 기간 중 업데이트 차단, 버전 기록 |
| D축(IME) 회귀 | Before에서 중복 전송 발생 시 메시지 수가 달라져 측정 오염 | S2/S5에서 전송 후 메시지 수 assert |
| 운영 edge function 호출량 급증 | 비용 및 로그 노이즈 | 7.2절 5번, 사전 공유 |

---

## 11.1 파일럿에서 드러난 측정상 이슈

| 증상 | 원인 | 대응 |
|---|---|---|
| `PGRST303 JWT issued at future` 401 | 갓 발급된 토큰을 운영 PostgREST가 간헐적으로 거절 | 회차 단위 최대 3회 재시도. 조건과 무관하게 무작위로 발생하므로 비교가 한쪽으로 치우치지 않는다. 재시도 횟수를 데이터에 기록 |
| Before에서 보낸 메시지가 그려지지 않음 | Before는 realtime 수신에만 의존하는데 구독 완료 전에 보내면 이벤트를 놓친다. 게다가 빈 토픽(`realtime:`)으로 먼저 join해 `TopicNameRequired` 에러가 난 뒤 실제 채널이 붙는다 | 초기 렌더 후 **5초 안정화 대기**를 양쪽 동일하게 적용. 이 대기는 측정 구간 밖이다 |
| 페인트 무한 대기 | realtime 미수신 | 30초 타임아웃 후 실패 처리 → 재시도 |

세 번째와 두 번째는 Before 코드의 실제 결함이기도 하다(구독 누수, 빈 토픽 구독). 성능 지표는 아니지만 보고서에 함께 남긴다.

---

## 12. 가설 및 판정 기준 (측정 전 확정)

| 가설 | 판정 기준 | 기각 시 의미 |
|---|---|---|
| **H1** (A축) S4 타이핑 시 After는 메시지 개수와 무관하게 렌더 비용이 일정하다 | After: `MessageItem` 렌더 횟수 0, `ChatRoom` 서브트리 비용이 100건과 300건에서 동일 수준. Before: 메시지 수에 비례 증가 | memo가 실제로 동작하지 않음 (props 참조 불안정 등) |
| **H2** (B축) S2 Enter → 화면 표시 중앙값이 **50% 이상 감소** | 중앙값 감소율 50% 이상, p < 0.05 | 체감 지연의 주범이 낙관적 업데이트가 아니었음 |
| **H3** (A축) S2 commit duration 합계 중앙값이 **유의하게 감소** | p < 0.05 이고 효과 크기 중간 이상 | 분리와 memo의 렌더 이득이 실측 수준에서 미미 |
| **H4** (C축) S1 초기 렌더 시간이 300건에서 감소 | 중앙값 감소, p < 0.05 | 시간 포맷 사전 계산의 기여가 무시할 수준 |
| **H5** (확장성) 300건에서 After의 개선 폭이 100건보다 크다 | 감소율 비교 | 가상화 도입 시급성 판단 근거로 사용 |
| **H6** (네트워크) N2(지연)에서 H2의 개선 폭이 N1보다 크다 | N2 감소율 > N1 감소율 | 낙관적 업데이트의 가치가 네트워크 품질과 무관 |

**H2~H6 중 일부가 기각되어도 그대로 보고한다.** "개선 폭이 생각보다 작았다"는 결과 역시 유효한 결론이며, 가상화 도입 우선순위 판단에 쓰인다.

---

## 13. 진행 순서

1. ~~사전 점검(3.2절)~~ **완료 (2026-08-28)**
2. ~~운영 DB 무해화(7.2절)~~ **완료 (2026-08-28)**. 계정 2개, 엔빵 그룹, 알림 off, 로그인/RLS 검증까지 확인
3. `.env.production.local`에 운영 값 설정(3.5절), 접속 프로젝트 ref 검증
4. 측정 스크립트 + 시딩/정리 스크립트 작성 → **고정 커밋**으로 확정
5. Before 워크트리 생성 + 패치 적용 → 양쪽 빌드(`--profile`) → 서버 2개 기동(3000/3001)
6. 환경 명세표 실측 값 기록
7. ~~파일럿 실행, 지표 수집 정상 여부 확인~~ **완료 (2026-08-28)**. S2/S4 통과, 실패 0건, 재시도 0건
8. 본 측정 552런 (조건 교차, 약 3시간) — **대기 중**. 실행 절차는 [RUNBOOK.md](./RUNBOOK.md)
9. DevTools Profiler 대표 회차 캡처 및 export
10. 운영 DB 정리 및 0건 검증
11. 통계 처리 및 보고서 작성 → `docs/performance/`
12. 블로그 글 수정 (수치 갱신, 측정 환경과 한계 명시)

---

## 14. 확정된 결정 사항

| 항목 | 결정 |
|---|---|
| 운영 환경 정의 | 로컬 `next build --profile` + **운영 Supabase 연결**. 서버와 CDN만 운영과 다름 |
| 운영 DB 쓰기 | **허용**. 측정 후 데이터 삭제 및 0건 검증 (7절) |
| 측정 기기 | 개발 PC 1대. 네트워크는 원활(N1) / 지연(N2) 2조건 (4.2절) |
| 실행 방식 | **단일 세션**. 기기가 1대라 다중 세션은 CPU 경합으로 오염되거나(병렬) 이득이 없다(순차) (10절) |
| 결과 문서 위치 | 저장소 문서 `docs/performance/` |

---

## 15. 항목별 기여도 측정 (2026-09-22 신설)

### 15.1 왜 추가로 측정하는가

본 측정(480런)은 **개선 전과 개선 후 두 점만** 만들었다. 그 사이에서 7개 축이 한꺼번에 바뀌므로 무엇이 얼마를 줄였는지 알 수 없다. 2절이 "축별로 분리해 검증한다"고 선언했으나 실제로는 간접 논증에 그쳤다.

A/B/C 실험(2026-09-02)에서 E축 하나만 분리해 확정했고, 같은 방식을 나머지 축에 적용한다.

### 15.2 조건

개선 전 코드(PR #144 역적용)에 축을 하나씩만 얹는다. 정의는 `scripts/perf/conditions.mjs`에 있고, 치환 대상을 하나라도 못 찾으면 즉시 실패시킨다. **빗나간 조건으로 조용히 측정하는 것이 측정을 못 하는 것보다 나쁘기 때문이다.**

| 조건 | 코드 | 포트 |
|---|---|---|
| `P0_before` | 개선 전 원본 | 3000 |
| `P1_C` | + 시간 포맷 사전 계산 | 3003 |
| `P2_A` | + 분리/memo/key | 3004 |
| `P3_AC` | + 위 둘 다 | 3005 |
| `P4_E` | + 구독 가드 | 3002 |
| `P5_B` | + 낙관적 업데이트/병합 | 3006 |
| `P6_F` | + 스크롤 처리 교체 | 3007 |
| `P7_after` | 개선 후 (전부) | 3001 |

`P3_AC`가 필요한 이유는 **A와 C가 같은 비용을 서로 다른 경로로 줄이기 때문이다.** `memo`가 리렌더를 막으면 시간 포맷을 미리 계산해 둔 이득이 사라진다. 따라서 단독 효과의 합이 동시 적용 효과보다 크게 나오는 것이 정상이고, 그 차이를 **중첩분**으로 따로 보고한다. 이 값을 재지 않으면 항목별 기여도를 더해 전체와 맞추려다 틀린 표를 만들게 된다.

계측(`PerfProfiler`)은 8개 조건에 바이트 단위로 동일하게 복사하고, `cmp`로 확인한다.

### 15.3 시나리오와 지표

**전송 시나리오 하나**로 두 지표를 함께 기록한다. 타이핑 시나리오를 따로 돌리지 않는 이유는, 전송 시나리오도 렌더 비용을 같이 기록하고 그 지표는 네트워크 잡음을 타지 않기 때문이다.

| 지표 | 네트워크 | 가려낼 축 |
|---|---|---|
| `keydownToPaint` 체감 지연 | 포함 | B, E, F |
| `actualDurationSum` 렌더 비용 | 무관 | A, C |

메시지 100건, CPU 4배 제한, 초기 렌더 후 5초 안정화 대기, 조건당 워밍업 2회 + 본 측정 20회, 회차마다 조건 순서 회전. **8조건 x 22회 = 176런, 약 1시간.**

### 15.4 가설 및 판정 기준 (측정 전 확정)

개선 전 기준값은 본 측정 S2(100건, N1)의 체감 지연 **3961.0ms**, 렌더 비용 **927.9ms**다.

| 가설 | 예측 | 기각 시 의미 |
|---|---|---|
| **H7** (A / 렌더 비용) | 700ms 이상 감소, p < 0.05 | 분리와 `memo`가 실제로는 리렌더를 막지 못하고 있다 |
| **H8** (C / 렌더 비용) | 200~500ms 감소, p < 0.05 | `toLocaleString()` 반복 비용이 무시할 수준이었다 |
| **H9** (A·C 중첩) | 중첩분 > 0. 단독 합이 동시 적용보다 크다 | 두 축이 서로 다른 비용을 줄였다는 뜻이므로 합산 보고가 가능해진다 |
| **H10** (E / 체감 지연) | 1500ms 이상 감소. A/B/C 실험 재현 | 이전 실험이나 이번 측정 중 하나가 오염됐다 |
| **H11** (B / 체감 지연) | 단일 축 중 최대 감소 | 낙관적 업데이트의 기여가 예상보다 작다 |
| **H12** (F / 체감 지연) | **검출 한계 미만.** 유의하지 않을 것 | 100ms급 변화가 잡혔다면 잡음이 예상보다 작았다는 뜻 |

**음성 대조군**을 함께 둔다.

- 렌더 비용 지표에서 **E는 개선 전과 같은 수준**이어야 한다. 구독 가드는 렌더 구조를 바꾸지 않는다. 여기서 유의한 차이가 나오면 그 회차 데이터를 믿을 수 없다.
- **B는 렌더 비용이 오히려 늘어날 수 있다.** 낙관적 메시지 삽입으로 커밋이 한 번 더 발생하기 때문이다.

#### 파일럿에서 예측을 고친 것 (2026-09-22, 본 측정 전)

초안에는 "렌더 비용 지표에서 E와 F가 모두 개선 전과 같아야 한다"고 적었다. **파일럿(조건당 2회)에서 F의 커밋 수가 5회에서 3회로 줄어드는 것을 보고 이 예측이 틀렸음을 확인했다.** F는 `scrollState` 상태를 제거하므로 상태 갱신 한 번분의 리렌더가 사라진다. "렌더 구조를 바꾸지 않는다"는 서술이 잘못이었다.

따라서 F에 대한 예측을 다음으로 고친다. **본 측정 데이터를 보기 전에 고쳤다는 점을 기록해 둔다.**

| 지표 | 수정된 예측 |
|---|---|
| 체감 지연 | 검출 한계 미만 (H12 유지) |
| 커밋 수 | 개선 전 5회에서 3회로 감소 |
| 렌더 비용 | 커밋이 줄어든 만큼 감소. 방향만 예측하고 크기는 예측하지 않는다 |

같은 파일럿에서 **B의 커밋 수는 5회에서 2회로 줄었다.** 예측과 방향이 반대다. 서버 응답을 기다리지 않으므로 에코 수신 시의 커밋이 측정 구간 밖으로 밀려난 것으로 보이나 확인하지 않았다. 본 측정에서 같은 방향이 재현되면 원인을 따로 규명해야 한다.

파일럿 데이터는 `results/20260922/pilot/`에 남겼다. 조건당 2회이므로 수치 자체는 근거로 쓸 수 없고, 계측이 도는지와 예측이 맞는 방향인지만 확인하는 용도다.

H12를 미리 적어두는 이유는, 효과 100ms 대 개선 전 사분위 범위 400ms라는 조건에서 **n=20으로는 검출되지 않는 것이 정상**이기 때문이다. 결과를 보고 나서 "F는 효과가 없었다"고 쓰면 검출력 부족을 효과 부재로 잘못 옮기게 된다.

### 15.5 실행

```bash
node scripts/perf/run-tonight.mjs
```

서버 기동, 계정 생성, 시딩, 측정, 분석, 운영 데이터 정리, 서버 종료를 한 번에 처리한다. 중간에 실패해도 정리와 서버 종료는 반드시 수행한다.

**측정 중에는 노트북을 유휴 상태로 둔다.** 본 측정은 4초 대 49밀리초라 잡음을 견뎠지만, 이번에 가려낼 C축은 예상 효과가 200~500ms이고 F축은 100ms다. 분산이 커지면 이 크기는 묻힌다.
