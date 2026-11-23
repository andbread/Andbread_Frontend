# 정산 Route Handler 통합 테스트 케이스 초안

- 작성일: 2026-11-21
- 대상 엔드포인트: `PATCH /api/nbreads/[nbreadId]/records`
- 테스트 파일: `src/app/api/nbreads/[nbreadId]/records/route.integration.test.ts`
- 근거: ADR 0003, E2E `e2e/payment.spec.ts`의 SETTLE-TOGGLE-001~004, SETTLE-UPDATE-001~002
- 공통 속성: 도메인은 정산, 테스트 레벨은 `Route Handler 통합 (DB 옵션 없음)`, 데이터 준비 방식은 Seed, 클린업은 필요, Spec 경로는 위 테스트 파일이다.

공통 Given은 다음과 같다.

- 그룹장 1명과 일반 참여자 2명이 참여한 월 결제 엔빵이 있다.
- participant 삽입 트리거가 엔빵의 `start_date` 기준 미납 기록을 참여자마다 한 건씩 만든다.

공통 Cleanup 대상은 생성한 `nbread_records`, `participant`, `nbread`, `user` 행과 인증 사용자다. `afterAll`에서 `seed.cleanup()`이 지운다.

---

## SETTLE-RECORD-001: 그룹장이 참여자의 납부 상태를 완료로 바꾸면 그 참여자의 현재 기간 기록만 완료가 된다

| 항목 | 값 |
|---|---|
| 우선순위 | P0 |
| 계정 | 관리자/그룹장 |
| 시나리오 | 납부 상태 변경 |

### 목적

그룹장이 보낸 납부 완료 요청이 지정한 참여자의 현재 기간 기록 한 건에만 반영되는지 검증한다.

### 시나리오

그룹장이 일반 참여자의 납부 상태를 완료로 바꾼다.

### Given

- 공통 Given과 같다.
- 세 사용자의 현재 기간 기록은 모두 미납이다.

### When

- 그룹장의 access token으로 `userId`에 참여자 아이디, `isPaid`에 `true`, `startDate`에 엔빵의 `start_date`를 담아 PATCH를 호출한다.

### Then

- 응답 상태 코드는 204다.
- 해당 참여자의 `start_date` 기록은 `is_paid=true`가 된다.
- 그룹장과 다른 참여자의 기록은 `is_paid=false`로 남는다.

### 테스트 데이터

- 그룹장 1명, 일반 참여자 2명, 현재 기간 기록 3건

### Cleanup 대상

공통 Cleanup 대상과 같다.

---

## SETTLE-RECORD-002: 일반 참여자는 자기 납부 상태를 완료로 바꿀 수 있다

| 항목 | 값 |
|---|---|
| 우선순위 | P0 |
| 계정 | 로그인 1계정 |
| 시나리오 | 납부 상태 변경 |

### 목적

일반 참여자가 자기 납부 기록을 완료로 바꿀 수 있는지 검증한다.

### 시나리오

일반 참여자가 자기 납부 상태를 완료로 바꾼다.

### Given

- 공통 Given과 같다.

### When

- 일반 참여자의 access token으로 `userId`에 자기 아이디, `isPaid`에 `true`, `startDate`에 엔빵의 `start_date`를 담아 PATCH를 호출한다.

### Then

- 응답 상태 코드는 204다.
- 해당 참여자의 `start_date` 기록은 `is_paid=true`가 된다.

### 테스트 데이터

- 그룹장 1명, 일반 참여자 2명, 현재 기간 기록 3건

### Cleanup 대상

공통 Cleanup 대상과 같다.

---

## SETTLE-RECORD-003: 기준일이 없으면 400을 반환하고 기록을 바꾸지 않는다

| 항목 | 값 |
|---|---|
| 우선순위 | P0 |
| 계정 | 관리자/그룹장 |
| 시나리오 | 납부 상태 요청 검증 |

### 목적

기준일 없는 요청이 어떤 기록도 바꾸지 않고 거절되는지 검증한다.

### 시나리오

그룹장이 `startDate` 없이 납부 완료 요청을 보낸다.

### Given

- 공통 Given과 같다.

### When

- 그룹장의 access token으로 `userId`와 `isPaid=true`만 담아 PATCH를 호출한다.

### Then

- 응답 상태 코드는 400이다.
- 해당 참여자의 `start_date` 기록은 `is_paid=false`로 남는다.

### 테스트 데이터

- 그룹장 1명, 일반 참여자 2명, 현재 기간 기록 3건

### Cleanup 대상

공통 Cleanup 대상과 같다.

---

## SETTLE-RECORD-004: 기준일이 날짜가 아니면 400을 반환하고 기록을 바꾸지 않는다

| 항목 | 값 |
|---|---|
| 우선순위 | P0 |
| 계정 | 관리자/그룹장 |
| 시나리오 | 납부 상태 요청 검증 |

### 목적

날짜로 해석할 수 없는 기준일이 서버 오류로 번지지 않고 400으로 거절되는지 검증한다.

### 시나리오

그룹장이 `startDate`에 날짜가 아닌 문자열을 담아 납부 완료 요청을 보낸다.

### Given

- 공통 Given과 같다.

### When

- 그룹장의 access token으로 `startDate`에 `not-a-date`를 담아 PATCH를 호출한다.

### Then

- 응답 상태 코드는 400이다.
- 해당 참여자의 `start_date` 기록은 `is_paid=false`로 남는다.

### 테스트 데이터

- 그룹장 1명, 일반 참여자 2명, 현재 기간 기록 3건

### Cleanup 대상

공통 Cleanup 대상과 같다.

---

## SETTLE-RECORD-005: 시각이 붙은 기준일로 갱신해도 같은 날짜 키로 조회한 기록에 반영되고 이전 기간 기록은 그대로다

| 항목 | 값 |
|---|---|
| 우선순위 | P0 |
| 계정 | 로그인 1계정 |
| 시나리오 | 납부일 키 일치 |

### 목적

갱신과 조회가 `toPaymentDateKey` 규칙으로 같은 납부 기록을 가리키는지, 갱신이 다른 기간의 기록을 건드리지 않는지 검증한다. 키가 어긋나면 갱신이 0행으로 끝나고 오류가 나지 않으므로 DB 상태로만 확인할 수 있다.

### 시나리오

일반 참여자가 UTC 시각이 붙은 기준일로 자기 납부 상태를 완료로 바꾸고, 날짜만 있는 기준일로 납부 현황을 조회한다.

### Given

- 공통 Given과 같다.
- 같은 참여자의 이전 달(`start_date`에서 한 달 전) 기록이 미납으로 있다.

### When

- 일반 참여자의 access token으로 `startDate`에 `{start_date}T12:00:00.000Z`를 담아 PATCH를 호출한다.
- 같은 token으로 `GET /api/nbreads/{nbreadId}/records?startDate={start_date}`를 호출한다.

### Then

- PATCH 응답 상태 코드는 204다.
- GET 응답 상태 코드는 200이고, 해당 참여자의 기록은 `isPaid=true`다.
- 이전 달 기록은 `is_paid=false`로 남는다.

### 테스트 데이터

- 그룹장 1명, 일반 참여자 2명, 현재 기간 기록 3건, 이전 달 기록 1건

### Cleanup 대상

공통 Cleanup 대상과 같다.

---

## 보류한 케이스

아래 두 케이스는 현재 코드에서 실패해 테스트 파일에 넣지 않았다. 권한 경계가 정해지면 같은 형태로 추가한다.

- 일반 참여자는 다른 참여자의 납부 상태를 바꿀 수 없다. 현재는 204를 반환하고 다른 참여자의 기록이 `is_paid=true`로 바뀐다.
- 엔빵에 참여하지 않은 사용자는 납부 상태를 바꿀 수 없다. 현재는 204를 반환하고 참여자의 기록이 `is_paid=true`로 바뀐다.

원인은 route가 요청자와 `userId`의 관계를 확인하지 않고, `nbread_records`의 UPDATE 정책이 `authenticated` 역할에 `USING (true)`로 열려 있기 때문이다. E2E의 SETTLE-TOGGLE-004는 화면의 체크박스 비활성화만 검증하므로 이 경로를 잡지 못한다.
