# 비로그인 사용자가 초대 링크에서 막히는 이유

작성일 2026-09-08. 초대 E2E 케이스 `INVITE-ACCESS-001`(비로그인 사용자는 초대에 응답하기 전에 로그인 안내를 받는다)을 Playwright로 옮기다가 재현되지 않아 원인을 찾은 기록이다.

> 확인 필요: 이 문서는 2026-09-09에 재작성한 것이다. 원본은 `test-84-e2e-e2e` 워크트리에 커밋되지 않은 채로 있었는데 그 워크트리가 정리되면서 사라졌다. 디스크 전체와 모든 브랜치 이력을 찾아봤지만 남아 있지 않았다. 본문은 이슈 [#231](https://github.com/andbread/Andbread_Frontend/issues/231)에 옮겨 적혀 있던 조사 내용과, 재작성 시점에 소스와 마이그레이션을 다시 확인한 결과로 복원했다. 원본에만 있었을 수 있는 중간 시도의 흔적은 복원하지 못했다.

## 어디서 나온 이야기인가

`INVITE-ACCESS-001`은 세션을 주입하지 않은 브라우저로 `/invite/<token>`을 열고 로그인 안내가 뜨는지 확인하는 케이스다. 초대를 정상으로 seed 하고 접속했는데도 로그인 안내 대신 "초대 정보를 찾을 수 없어요." 화면이 떴다. seed 한 초대는 DB에 멀쩡히 있었다.

## 확인된 동작

원인이 하나가 아니라 둘이다. 하나만 고치면 증상이 그대로 남는다.

### 1. RLS가 오류가 아니라 0행을 돌려준다

`getInviteByToken`은 `nbread_invite`를 먼저 조회한다. 이 테이블의 SELECT 정책은 `authenticated` 역할에만 열려 있다.

```sql
-- supabase/migrations/20260814100000_baseline_schema.sql:1339
CREATE POLICY "Authenticated users can select" ON "public"."nbread_invite"
  FOR SELECT TO "authenticated" USING (true);
```

RLS가 켜진 테이블에서 요청자 역할에 맞는 정책이 하나도 없으면 권한 오류가 나는 것이 아니라 조건에 걸리는 행이 없는 것으로 처리되어 0행이 돌아온다. GRANT는 `anon`에게도 열려 있어서(`:1933`) 권한 오류조차 발생하지 않는다.

그래서 `maybeSingle()`이 `null`을 주고 `if (!invite) return null`로 조용히 빠져나간다. 화면에는 "초대가 없다"로 보이지만 실제로는 "읽을 권한이 없다"이다. 이 둘이 클라이언트에서 구분되지 않는 것이 조사에 시간을 쓴 이유다.

### 2. 로그인 모달이 렌더 순서 때문에 그려지지 않는다

`src/components/invite/InvitePageClient.tsx`는 세션이 없으면 모달 상태를 세운다.

```tsx
setIsLoginModalOpen(!hasSession)
```

그런데 같은 렌더에서 `invite`가 `null`이라 아래 분기를 먼저 타고 조기 반환한다.

```tsx
if (loadFailed || !invite) {
  return <main>…초대 정보를 찾을 수 없어요.…</main>
}
```

`LoginConfirmModal`은 그 아래 `pending` 분기의 JSX 안에만 있어서 끝내 그려지지 않는다. 상태는 세워졌지만 도달하지 못하는 구조다.

RLS를 열어 `invite`를 채웠어도 이 문제는 그대로 남고, 반대로 렌더 순서만 고쳐도 조회가 여전히 `null`이라 의미가 없다.

## 검토한 대안과 채택하지 않은 이유

### 조회 전용 `SECURITY DEFINER` 함수 — 채택하지 않음

토큰을 받아 화면에 필요한 값만 돌려주는 함수를 만들어 `anon`에 GRANT하는 방안이다. 저장소에 `respond_to_nbread_invite`(`supabase/migrations/20260814100000_baseline_schema.sql:491`)라는 같은 모양의 선례가 있다. 테이블 RLS를 그대로 두면서 노출 범위를 링크를 가진 사람 하나로 한정할 수 있어 기술적으로는 가장 정교한 길이었다.

채택하지 않은 이유는 기술적 결함이 아니라 전제가 바뀐 것이다. 이 방안은 로그인 전에 초대 내용(엔빵 제목, 방장 이름)을 보여준다는 전제 위에 있다. 2026-09-09에 보여주지 않기로 정하면서 함수도 스키마 변경도 필요 없어졌다. 나중에 "로그인 전에도 초대 내용을 보여주자"로 결정이 뒤집히면 이 방안을 다시 꺼내면 된다.

### RLS 정책만 `anon`에 여는 방안 — 채택하지 않음

동작하지 않는다. `nbread_invite`를 열어도 `getInviteByToken`이 이어서 읽는 `nbread`와 `user`에서 다시 막힌다. 세 테이블을 모두 `TO anon USING (true)`로 열면 anon 키가 브라우저 번들에 실려 나가므로 초대 링크를 받은 적 없는 누구나 전체 사용자와 전체 엔빵을 조회할 수 있게 된다.

### 중립 화면 위에 로그인 모달을 띄우는 방안 — 채택하지 않음

기존 `LoginConfirmModal`을 살리고 당시 테스트 어설션도 그대로 쓸 수 있는 방안이다. 다만 초대 내용을 보여주지 않기로 한 이상 모달 뒤에 그릴 것이 없어 빈 화면 위에 모달만 뜨는 형태가 되고, 사용자는 확인 버튼을 한 번 더 눌러야 로그인으로 간다. 단계가 적은 직접 이동을 택했다.

## 채택한 방향

비로그인 사용자에게는 초대 내용을 보여주지 않고 곧바로 로그인으로 보낸다. 세션 확인을 초대 조회보다 앞에 두고, 세션이 없으면 `getInviteByToken`을 아예 호출하지 않는다. 조회를 하지 않으므로 RLS 문제와 렌더 순서 문제를 둘 다 우회한다.

이 결정으로 스키마와 RLS 변경이 전부 불필요해졌다. `anon`이 `nbread_invite`를 읽을 일이 없으므로 지금의 RLS 상태가 곧 의도한 정책이다.

## 남아 있는 문제

- `nbread_invite`의 SELECT 정책이 `TO authenticated USING (true)`라 로그인만 하면 누구나 모든 초대 행을 읽을 수 있다. 초대 대상자로 범위를 좁히는 것은 별도 건이다. 이번 작업 범위 밖으로 두었다.
- `LoginRedirectGuard`(`src/components/auth/LoginRedirectGuard.tsx`)는 `hasPersistedUser()`로 localStorage의 `user-store`만 보고 `/home`으로 되돌린다. `redirect` 파라미터를 보지 않는다. 반면 초대 화면은 `hasAuthenticatedSession()`으로 Supabase 세션을 본다. 세션이 만료됐는데 localStorage가 남아 있는 사용자는 로그인 화면에 닿자마자 `/home`으로 밀려 초대 복귀가 끊긴다. 이번 작업에서는 초대 화면이 세션 없음을 판정할 때 `clearUser()`로 남은 사용자 정보를 함께 비우는 것으로 막았다. 다른 진입점에서 같은 어긋남이 생기는 것까지는 막지 못하므로, 가드가 저장소 대신 실제 세션을 보게 하는 근본 수정은 별도 건으로 남는다.
- RLS에 막힌 요청이 0행으로 돌아와 제품의 "데이터 없음" 분기로 흘러드는 구조는 이 저장소에서 반복해서 걸린 함정이다. `GROUP-CREATE-005`도 같은 이유로 검증하려던 조건이 아닌 이유로 통과했다. 테스트가 초록일 때 그 초록이 무엇 때문인지 확인하는 습관이 필요하다.

## 관련

- 이슈 [#231](https://github.com/andbread/Andbread_Frontend/issues/231)
- `src/components/invite/InvitePageClient.tsx`
- `e2e/invite.spec.ts`의 `INVITE-ACCESS-001`
- `supabase/migrations/20260814100000_baseline_schema.sql`
