# 초대 Route Handler 통합 테스트 케이스 초안

- 작성일: 2026-11-21
- 대상 Notion data source: `collection://392e7e8f-dd12-808e-9812-000b1eee3356` (도메인: 초대)
- 테스트 레벨: Route Handler 통합 (DB 옵션 없음)
- 공통 사항
  - 모든 케이스는 `new Seeder()`로 데이터를 만들고 Route Handler 함수를 `routeRequest`, `routeContext`로 직접 호출한다.
  - 판정은 HTTP 상태 코드, 화면이 분기에 쓰는 `code` 값, `seed.admin`으로 조회한 DB 상태로 한다.
  - Cleanup은 `afterAll`의 `seed.cleanup()`이 맡는다. 이 함수는 엔빵에 딸린 기록, 참여자, 초대, 엔빵, 사용자를 순서대로 지운다.
- ID 메모
  - `INVITE-SEND-001`과 `INVITE-RESPOND-004`는 ADR 0003에서 E2E 삭제로 빠졌다고 적은 검증을 다시 덮으므로 같은 ID를 쓴다.
  - Notion DB의 `테스트 레벨`에 `API Integration` 옵션이 있다. 이 옵션을 Route Handler 통합으로 쓸지는 등록할 때 정한다.

---

## INVITE-SEND-001. 같은 대상에게 같은 엔빵 초대를 두 번 보내도 대기 중 초대가 중복되지 않는다

- Spec 경로: `src/app/api/nbreads/[nbreadId]/invites/route.integration.test.ts`
- 우선순위: P1 / 계정: 관리자/그룹장 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

방장이 초대를 여러 번 눌러도 대상자에게 대기 중 초대가 하나만 남는지 검증한다.

### 시나리오

방장이 같은 대상에게 같은 엔빵 초대를 연속으로 두 번 보낸다.

### Given

- 방장만 참여한 엔빵이 있다.
- 대상 사용자에게 보낸 초대는 아직 없다.

### When

- 방장 토큰으로 `POST /api/nbreads/{nbreadId}/invites`를 같은 `targetUserId`로 두 번 호출한다.

### Then

- 두 응답 모두 200이다.
- 그 엔빵과 대상 사용자의 `nbread_invite` 행은 `pending` 1건뿐이다.

### 테스트 데이터

- 방장 1명, 대상 사용자 1명, 정원 3명인 엔빵 1개

### Cleanup 대상

- 생성된 초대, 참여자, 엔빵, 사용자를 삭제한다.

---

## INVITE-SEND-002. 방장이 초대를 보내면 대상에게 대기 중 초대가 1건 생긴다

- Spec 경로: `src/app/api/nbreads/[nbreadId]/invites/route.integration.test.ts`
- 우선순위: P1 / 계정: 관리자/그룹장 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

친구 초대가 대상 사용자를 연결한 대기 중 초대를 만드는지 검증한다.

### 시나리오

방장이 아직 초대하지 않은 사용자에게 초대를 보낸다.

### Given

- 방장만 참여한 엔빵이 있다.

### When

- 방장 토큰으로 `POST /api/nbreads/{nbreadId}/invites`를 호출한다.

### Then

- 응답은 200이다.
- 그 엔빵과 대상 사용자의 `nbread_invite` 행은 `pending` 1건이다.

### 테스트 데이터

- 방장 1명, 대상 사용자 1명, 정원 3명인 엔빵 1개

### Cleanup 대상

- 생성된 초대, 참여자, 엔빵, 사용자를 삭제한다.

---

## INVITE-SEND-003. 엔빵 참여자가 아닌 사용자는 그 엔빵의 초대를 보낼 수 없다

- Spec 경로: `src/app/api/nbreads/[nbreadId]/invites/route.integration.test.ts`
- 우선순위: P0 / 계정: 권한 없음 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

엔빵과 관계없는 사용자가 다른 사람의 엔빵에 초대를 만들 수 없는지 검증한다.

### 시나리오

엔빵에 참여하지 않은 사용자가 그 엔빵의 초대를 보낸다.

### Given

- 방장만 참여한 엔빵이 있다.
- 외부 사용자는 그 엔빵의 참여자가 아니다.

### When

- 외부 사용자 토큰으로 `POST /api/nbreads/{nbreadId}/invites`를 호출한다.

### Then

- 응답은 성공 상태가 아니다.
- 그 엔빵과 대상 사용자의 `nbread_invite` 행은 생기지 않는다.

### 테스트 데이터

- 방장 1명, 외부 사용자 1명, 대상 사용자 1명, 엔빵 1개

### Cleanup 대상

- 생성된 참여자, 엔빵, 사용자를 삭제한다.

### 예외/주의사항

- 현재 구현은 RLS의 INSERT 거부를 500으로 돌려준다. 테스트는 상태 코드를 성공이 아닌지까지만 고정해 이후 403으로 바꿔도 깨지지 않게 한다.

---

## INVITE-LINK-001. 방장이 링크 초대를 만들면 대상 없는 대기 중 초대가 생기고 그 토큰을 돌려준다

- Spec 경로: `src/app/api/nbreads/[nbreadId]/invites/link/route.integration.test.ts`
- 우선순위: P1 / 계정: 관리자/그룹장 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

공유용 링크 초대가 대상 없이 대기 중으로 만들어지고, 응답 토큰이 실제 초대 행과 일치하는지 검증한다.

### 시나리오

방장이 링크 초대를 만든다.

### Given

- 방장만 참여한 엔빵이 있고 초대는 없다.

### When

- 방장 토큰으로 `POST /api/nbreads/{nbreadId}/invites/link`를 호출한다.

### Then

- 응답은 201이다.
- 그 엔빵의 `nbread_invite` 행은 1건이고, `invite_token`은 응답의 `inviteToken`과 같다.
- 그 행의 `target_user_id`는 null이고 `status`는 `pending`이다.

### 테스트 데이터

- 방장 1명, 정원 3명인 엔빵 1개

### Cleanup 대상

- 생성된 초대, 참여자, 엔빵, 사용자를 삭제한다.

---

## INVITE-LINK-002. 엔빵 참여자가 아닌 사용자는 그 엔빵의 링크 초대를 만들 수 없다

- Spec 경로: `src/app/api/nbreads/[nbreadId]/invites/link/route.integration.test.ts`
- 우선순위: P0 / 계정: 권한 없음 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

외부 사용자가 다른 사람의 엔빵에 들어갈 수 있는 링크를 만들 수 없는지 검증한다.

### 시나리오

엔빵에 참여하지 않은 사용자가 그 엔빵의 링크 초대를 만든다.

### Given

- 방장만 참여한 엔빵이 있고 초대는 없다.

### When

- 외부 사용자 토큰으로 `POST /api/nbreads/{nbreadId}/invites/link`를 호출한다.

### Then

- 응답은 성공 상태가 아니다.
- 그 엔빵의 `nbread_invite` 행은 생기지 않는다.

### 테스트 데이터

- 방장 1명, 외부 사용자 1명, 엔빵 1개

### Cleanup 대상

- 생성된 참여자, 엔빵, 사용자를 삭제한다.

### 예외/주의사항

- 현재 구현은 RLS의 INSERT 거부를 500으로 돌려준다.

---

## INVITE-RESPOND-004. 거절한 초대를 다시 수락하면 409 INVITE_ALREADY_REJECTED이고 참여자가 생기지 않는다

- Spec 경로: `src/app/api/invites/[token]/response/route.integration.test.ts`
- 우선순위: P1 / 계정: 로그인 1계정 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

한 번 거절한 초대로 나중에 엔빵에 들어갈 수 없는지 검증한다.

### 시나리오

초대 대상자가 초대를 거절한 뒤 같은 초대를 수락한다.

### Given

- 방장만 참여한 엔빵과 대상 사용자의 `pending` 초대가 있다.

### When

- 대상 사용자 토큰으로 `POST /api/invites/{token}/response`를 `rejected`로 호출한다.
- 같은 토큰으로 `accepted`를 호출한다.

### Then

- 거절 응답은 200이고 초대 상태는 `rejected`가 된다.
- 수락 응답은 409이고 `code`는 `INVITE_ALREADY_REJECTED`이며, `message`에도 이 코드가 들어 있다.
- 초대 상태는 `rejected`로 남고 대상 사용자의 참여자 행은 생기지 않는다.

### 테스트 데이터

- 방장 1명, 대상 사용자 1명, 엔빵 1개, `pending` 초대 1개

### Cleanup 대상

- 생성된 초대, 참여자, 엔빵, 사용자를 삭제한다.

### 예외/주의사항

- 초대 화면은 `message`에 코드가 들어 있는지로 안내를 고르므로 `message`가 코드를 담는지도 계약으로 본다.

---

## INVITE-RESPOND-005. 초대 대상자가 수락하면 초대가 accepted가 되고 참여자가 1행 생긴다

- Spec 경로: `src/app/api/invites/[token]/response/route.integration.test.ts`
- 우선순위: P0 / 계정: 로그인 1계정 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

초대 수락이 Route Handler를 거쳐도 참여자 등록까지 끝나는지 검증한다.

### 시나리오

초대 대상자가 정원이 남은 엔빵의 대기 초대를 수락한다.

### Given

- 방장만 참여한 정원 2명인 엔빵과 대상 사용자의 `pending` 초대가 있다.

### When

- 대상 사용자 토큰으로 `POST /api/invites/{token}/response`를 `accepted`로 호출한다.

### Then

- 응답은 200이고 `data.nbread_id`는 그 엔빵이며 `data.outcome`은 `joined`다.
- 초대 상태는 `accepted`다.
- 대상 사용자의 참여자 행은 정확히 1건이다.

### 테스트 데이터

- 방장 1명, 대상 사용자 1명, 엔빵 1개, `pending` 초대 1개

### Cleanup 대상

- 생성된 초대, 참여자, 납부 기록, 엔빵, 사용자를 삭제한다.

---

## INVITE-RESPOND-006. 초대 대상이 아닌 계정이 수락하면 403 INVITE_TARGET_MISMATCH이고 DB가 바뀌지 않는다

- Spec 경로: `src/app/api/invites/[token]/response/route.integration.test.ts`
- 우선순위: P0 / 계정: 권한 없음 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

지정 사용자 초대의 토큰을 얻은 다른 계정이 엔빵에 들어갈 수 없는지 검증한다.

### 시나리오

초대 대상이 아닌 사용자가 지정 사용자 초대를 수락한다.

### Given

- 방장만 참여한 엔빵과 대상 사용자의 `pending` 초대가 있다.
- 다른 사용자는 그 엔빵의 참여자가 아니다.

### When

- 다른 사용자 토큰으로 `POST /api/invites/{token}/response`를 `accepted`로 호출한다.

### Then

- 응답은 403이고 `code`는 `INVITE_TARGET_MISMATCH`이며, `message`에도 이 코드가 들어 있다.
- 초대 상태는 `pending`이고 `target_user_id`는 원래 대상 사용자다.
- 다른 사용자와 대상 사용자 모두 참여자 행이 생기지 않는다.

### 테스트 데이터

- 방장 1명, 대상 사용자 1명, 다른 사용자 1명, 엔빵 1개, `pending` 초대 1개

### Cleanup 대상

- 생성된 초대, 참여자, 엔빵, 사용자를 삭제한다.

---

## INVITE-RESPOND-007. 정원이 찬 엔빵의 초대를 수락하면 409 INVITE_EXPIRED이고 참여자가 늘지 않는다

- Spec 경로: `src/app/api/invites/[token]/response/route.integration.test.ts`
- 우선순위: P1 / 계정: 로그인 1계정 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

정원을 넘는 참여자가 생기지 않고, 화면이 만료 안내를 고를 수 있는 코드가 오는지 검증한다.

### 시나리오

초대 대상자가 정원이 찬 엔빵의 대기 초대를 수락한다.

### Given

- 정원 2명인 엔빵에 방장과 기존 참여자 2명이 있다.
- 아직 참여자가 아닌 대상 사용자의 `pending` 초대가 있다.

### When

- 대상 사용자 토큰으로 `POST /api/invites/{token}/response`를 `accepted`로 호출한다.

### Then

- 응답은 409이고 `code`는 `INVITE_EXPIRED`이며, `message`에도 이 코드가 들어 있다.
- 엔빵의 참여자 행은 2건 그대로이고 대상 사용자의 참여자 행은 없다.

### 테스트 데이터

- 방장 1명, 기존 참여자 1명, 대상 사용자 1명, 정원 2명인 엔빵 1개, `pending` 초대 1개

### Cleanup 대상

- 생성된 초대, 참여자, 납부 기록, 엔빵, 사용자를 삭제한다.

---

## INVITE-RESPOND-008. 이미 참여 중인 사용자가 다른 초대를 수락해도 참여자가 중복되지 않는다

- Spec 경로: `src/app/api/invites/[token]/response/route.integration.test.ts`
- 우선순위: P1 / 계정: 로그인 1계정 / 데이터 준비 방식: Seed / 클린업: 필요

### 목적

이미 참여한 사용자가 남은 초대를 수락해도 참여자 행이 하나로 유지되고, 화면이 안내를 고를 수 있는 결과가 오는지 검증한다.

### 시나리오

엔빵 참여자가 자신에게 온 대기 초대를 수락한다.

### Given

- 방장과 기존 참여자가 있는 엔빵이 있다.
- 기존 참여자에게 `pending` 초대가 있다.

### When

- 기존 참여자 토큰으로 `POST /api/invites/{token}/response`를 `accepted`로 호출한다.

### Then

- 응답은 200이고 `data.outcome`은 `already_participant`다.
- 기존 참여자의 참여자 행은 1건이다.
- 초대 상태는 `accepted`다.

### 테스트 데이터

- 방장 1명, 기존 참여자 1명, 엔빵 1개, `pending` 초대 1개

### Cleanup 대상

- 생성된 초대, 참여자, 납부 기록, 엔빵, 사용자를 삭제한다.
