# 그룹 도메인 Route Handler 통합 테스트 케이스 초안

## 조사한 코드
- `src/app/api/nbreads/route.ts`
- `src/app/api/nbreads/[nbreadId]/route.ts`
- `src/app/api/nbreads/[nbreadId]/participants/route.ts`
- `src/lib/server/nbread/insertNbread.ts`
- `src/lib/server/nbread/updateNbread.ts`
- `src/lib/server/nbread/deleteNbread.ts`
- `src/lib/server/participant/insertParticipant.ts`
- `src/lib/server/participant/deleteParticipant.ts`
- `src/components/nbread/NbreadDetail.tsx`
- `src/components/nbread/nbreadParticipantsList.tsx`
- `src/app/nbread/preview/page.tsx`
- `supabase/migrations/20260814100000_baseline_schema.sql`
- `e2e/group.spec.ts`

## 확인 필요 사항
- 그룹장이 아닌 사용자의 엔빵 수정, 엔빵 삭제, 다른 참여자 내보내기가 현재 모두 성공한다. 세 경로 모두 Route Handler에 그룹장 확인이 없고, `nbread`와 `participant`의 UPDATE, DELETE RLS 정책이 `USING (true)`다. 이 동작을 막는 케이스(GROUP-UPDATE-002, GROUP-DELETE-002, GROUP-MEMBER-009)는 현재 실패하므로 코드에 넣지 않았다. 권한 검사를 추가하는 작업이 끝나면 테스트로 옮긴다.
- 테스트 레벨 select에 `API Integration` 옵션이 있다. 이 초안은 지시에 따라 `Route Handler 통합 (DB 옵션 없음)`으로 적었다. Notion에 옮길 때 기존 옵션을 쓸지 정해야 한다.
- `POST /api/nbreads/[nbreadId]/participants`는 RLS 때문에 그룹장이 자기 엔빵에 그룹장으로 참여하는 경우에만 행을 만든다. 초대받은 사용자의 참여는 초대 도메인의 다른 경로를 쓴다.
- 1인당 금액은 DB 컬럼이 아니고 화면이 `amount / participant_count`로 계산한다. 이 초안은 총액과 인원 컬럼이 요청값대로 저장되는지를 확인한다.

## 케이스 목록

### GROUP-CREATE-007: 로그인 사용자가 만든 엔빵은 요청한 금액과 인원으로 저장된다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 그룹 생성 |
| 케이스 유형 | 성공 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 로그인 1계정 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/route.integration.test.ts` |

## 목적
엔빵 생성 API가 금액, 인원, 납부 주기 값을 요청 그대로 저장하는지 검증한다.

## 시나리오
로그인 사용자의 토큰으로 `POST /api/nbreads`를 호출한다.

## Given
- 로그인 사용자 Alice가 있다.

## When
- Alice가 자신을 그룹장으로 지정해 금액 17000, 인원 4, 연 단위, 3월 15일 납부인 엔빵 생성을 요청한다.

## Then
- 응답 상태가 201이다.
- 응답의 `id`로 조회한 `nbread` 행의 `title`, `amount`, `participant_count`, `payment_period`, `payment_date`, `payment_month`, `leader_id`가 요청값과 같다.

## 테스트 데이터
- 사용자 2명, 실행마다 다른 엔빵 제목

## Cleanup 대상
- 제목으로 예약한 `nbread` 행, 테스트 사용자

### GROUP-CREATE-008: 다른 사용자를 그룹장으로 지정한 엔빵은 만들어지지 않는다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 그룹 생성 |
| 케이스 유형 | 권한 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 권한 없음 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/route.integration.test.ts` |

## 목적
요청자가 아닌 사용자를 그룹장으로 지정한 엔빵이 만들어지지 않는지 검증한다.

## 시나리오
Alice의 토큰으로 `leaderId`를 Bob으로 넣어 `POST /api/nbreads`를 호출한다.

## Given
- 사용자 Alice와 Bob이 있다.

## When
- Alice가 `leaderId`에 Bob의 아이디를 넣어 엔빵 생성을 요청한다.

## Then
- 응답 상태가 2xx가 아니다.
- 요청한 제목의 `nbread` 행이 없다.

## 테스트 데이터
- 사용자 2명, 실행마다 다른 엔빵 제목

## Cleanup 대상
- 제목으로 예약한 `nbread` 행(만들어졌을 경우), 테스트 사용자

### GROUP-UPDATE-001: 그룹장이 수정하면 금액과 인원이 요청값으로 바뀐다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 그룹 수정 |
| 케이스 유형 | 성공 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 관리자/그룹장 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/route.integration.test.ts` |

## 목적
그룹장의 수정 요청이 엔빵의 금액, 인원, 납부일에 반영되는지 검증한다.

## 시나리오
그룹장 토큰으로 `PATCH /api/nbreads/{nbreadId}`를 호출한다.

## Given
- 금액 20000, 인원 3, 납부일 5일인 엔빵이 있다.
- 그룹장과 일반 참여자가 참여해 있다.

## When
- 그룹장이 제목, 금액 36000, 인원 4, 납부일 25일로 수정을 요청한다.

## Then
- 응답 상태가 204다.
- `nbread` 행의 `title`, `amount`, `participant_count`, `payment_date`가 요청값이고 `leader_id`는 그대로다.

## 테스트 데이터
- 그룹장, 일반 참여자, 비참여자 3명

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 `participant`, `nbread_records`, 테스트 사용자

### GROUP-UPDATE-002: 그룹장이 아닌 사용자의 수정은 엔빵을 바꾸지 않는다 (코드에 넣지 않음)
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 그룹 수정 |
| 케이스 유형 | 권한 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 권한 없음 |
| Cleanup | 필요 |
| Spec 경로 | 없음 (현재 실패) |

## 목적
일반 참여자와 비참여자가 엔빵 정보를 바꿀 수 없는지 검증한다.

## 시나리오
일반 참여자 토큰과 비참여자 토큰으로 각각 `PATCH /api/nbreads/{nbreadId}`를 호출한다.

## Given
- 그룹장과 일반 참여자가 참여한 엔빵이 있다.

## When
- 일반 참여자 또는 비참여자가 금액과 인원을 바꾸는 수정을 요청한다.

## Then
- `nbread` 행이 요청 전과 같다.

## 현재 동작
- 두 경우 모두 응답 상태가 204이고 `nbread` 행이 요청값으로 바뀐다.

## 테스트 데이터
- 그룹장, 일반 참여자, 비참여자 3명

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-DELETE-001: 그룹장이 삭제하면 엔빵과 참여자, 납부 기록, 초대가 함께 지워진다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 그룹 삭제 |
| 케이스 유형 | 성공 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 관리자/그룹장 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/route.integration.test.ts` |

## 목적
E2E에서 빠진 그룹 삭제 검증을 다시 다룬다. 엔빵을 지우면 딸린 데이터가 남지 않는지 확인한다.

## 시나리오
그룹장 토큰으로 `DELETE /api/nbreads/{nbreadId}`를 호출한다.

## Given
- 그룹장과 일반 참여자가 참여한 엔빵이 있다.
- 참여자 2명의 `nbread_records`가 2건 있다.
- 비참여자에게 보낸 `nbread_invite`가 1건 있다.

## When
- 그룹장이 엔빵 삭제를 요청한다.

## Then
- 응답 상태가 204다.
- 해당 엔빵의 `nbread`, `participant`, `nbread_records`, `nbread_invite` 행이 모두 0건이다.

## 테스트 데이터
- 그룹장, 일반 참여자, 비참여자 3명, 초대 1건

## Cleanup 대상
- 실패 시 남을 수 있는 `nbread`와 딸린 행, 테스트 사용자

### GROUP-DELETE-002: 그룹장이 아닌 사용자의 삭제는 엔빵을 지우지 않는다 (코드에 넣지 않음)
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 그룹 삭제 |
| 케이스 유형 | 권한 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 권한 없음 |
| Cleanup | 필요 |
| Spec 경로 | 없음 (현재 실패) |

## 목적
일반 참여자와 비참여자가 엔빵을 지울 수 없는지 검증한다.

## 시나리오
일반 참여자 토큰과 비참여자 토큰으로 각각 `DELETE /api/nbreads/{nbreadId}`를 호출한다.

## Given
- 그룹장과 일반 참여자가 참여한 엔빵이 있다.

## When
- 일반 참여자 또는 비참여자가 엔빵 삭제를 요청한다.

## Then
- `nbread` 행과 `participant` 2건이 그대로 있다.

## 현재 동작
- 두 경우 모두 응답 상태가 204이고 `nbread`, `participant`, `nbread_records` 행이 모두 지워진다.

## 테스트 데이터
- 그룹장, 일반 참여자, 비참여자 3명

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-MEMBER-003: 그룹장이 참여하면 참여자 행과 미납 기록 1건이 생긴다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 추가 |
| 케이스 유형 | 성공 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 관리자/그룹장 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/participants/route.integration.test.ts` |

## 목적
엔빵을 만든 직후 그룹장 참여 요청이 참여자 행과 첫 정산 기간의 미납 기록을 만드는지 검증한다.

## 시나리오
그룹장 토큰으로 `isLeader: true`를 넣어 `POST /api/nbreads/{nbreadId}/participants`를 호출한다.

## Given
- 참여자가 없는 정원 3명 엔빵이 있다.

## When
- 그룹장이 그룹장으로 참여를 요청한다.

## Then
- 응답 상태가 200이다.
- `participant` 행이 1건이고 그룹장의 `is_leader`가 `true`다.
- 그룹장의 `nbread_records`가 1건이고 `is_paid`는 `false`, `payment_date`는 엔빵의 `start_date`다.

## 테스트 데이터
- 사용자 4명 중 그룹장

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-MEMBER-004: 같은 사용자가 두 번 참여해도 참여자 행은 하나다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 추가 |
| 케이스 유형 | 예외 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 관리자/그룹장 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/participants/route.integration.test.ts` |

## 목적
같은 사용자의 참여 요청이 반복되어도 참여자가 중복으로 생기지 않는지 검증한다.

## 시나리오
그룹장 토큰으로 참여 요청을 두 번 보낸다.

## Given
- 참여자가 없는 정원 3명 엔빵이 있다.

## When
- 그룹장이 그룹장으로 참여를 두 번 요청한다.

## Then
- 두 응답 모두 상태가 200이다.
- `participant` 행은 그룹장 1건뿐이다.

## 테스트 데이터
- 사용자 4명 중 그룹장

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-MEMBER-005: 정원이 찬 엔빵에는 참여자가 추가되지 않는다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 추가 |
| 케이스 유형 | 예외 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 관리자/그룹장 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/participants/route.integration.test.ts` |

## 목적
참여 인원이 정원에 도달한 엔빵에 참여자가 더 추가되지 않는지 검증한다.

## 시나리오
정원 1명이 이미 찬 엔빵에 그룹장이 참여를 요청한다.

## Given
- 정원 1명 엔빵에 일반 참여자 1명이 참여해 있다.
- 그룹장은 아직 참여자가 아니다.

## When
- 그룹장이 그룹장으로 참여를 요청한다.

## Then
- 응답 상태가 200이다.
- `participant` 행은 기존 일반 참여자 1건뿐이다.

## 테스트 데이터
- 사용자 4명 중 그룹장과 일반 참여자

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-MEMBER-006: 그룹장이 아닌 사용자는 남의 엔빵에 스스로 참여할 수 없다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 추가 |
| 케이스 유형 | 권한 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 권한 없음 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/participants/route.integration.test.ts` |

## 목적
초대 경로를 거치지 않은 사용자가 이 API로 다른 사람의 엔빵에 들어갈 수 없는지 검증한다.

## 시나리오
비참여자 토큰으로 `isLeader`를 `false`와 `true`로 바꿔 가며 참여를 요청한다.

## Given
- 참여자가 없는 정원 3명 엔빵이 있다.

## When
- 비참여자가 참여를 요청한다.

## Then
- 응답 상태가 2xx가 아니다.
- `participant` 행이 0건이다.

## 테스트 데이터
- 사용자 4명 중 비참여자

## Cleanup 대상
- Seed로 만든 `nbread`, 테스트 사용자

### GROUP-MEMBER-007: 일반 참여자는 스스로 그룹에서 나갈 수 있다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 권한과 그룹 탈퇴 |
| 케이스 유형 | 성공 |
| 우선순위 | P1 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 로그인 1계정 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/participants/route.integration.test.ts` |

## 목적
일반 참여자의 나가기 요청이 본인 참여자 행만 지우는지 검증한다.

## 시나리오
일반 참여자 토큰으로 `userId`에 본인 아이디를 넣어 `DELETE /api/nbreads/{nbreadId}/participants`를 호출한다.

## Given
- 그룹장과 일반 참여자 2명이 참여한 엔빵이 있다.

## When
- 일반 참여자가 본인을 대상으로 나가기를 요청한다.

## Then
- 응답 상태가 204다.
- `participant` 행은 그룹장과 다른 일반 참여자 2건이다.

## 테스트 데이터
- 그룹장, 일반 참여자 2명

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-MEMBER-008: 그룹장은 다른 참여자를 내보낼 수 있다
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 권한과 그룹 탈퇴 |
| 케이스 유형 | 성공 |
| 우선순위 | P1 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 관리자/그룹장 |
| Cleanup | 필요 |
| Spec 경로 | `src/app/api/nbreads/[nbreadId]/participants/route.integration.test.ts` |

## 목적
그룹장의 내보내기 요청이 지정한 참여자 행만 지우는지 검증한다.

## 시나리오
그룹장 토큰으로 `userId`에 일반 참여자 아이디를 넣어 `DELETE /api/nbreads/{nbreadId}/participants`를 호출한다.

## Given
- 그룹장과 일반 참여자 2명이 참여한 엔빵이 있다.

## When
- 그룹장이 일반 참여자 1명을 내보낸다.

## Then
- 응답 상태가 204다.
- `participant` 행은 그룹장과 남은 일반 참여자 2건이다.

## 테스트 데이터
- 그룹장, 일반 참여자 2명

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자

### GROUP-MEMBER-009: 그룹장이 아닌 사용자는 다른 참여자를 내보낼 수 없다 (코드에 넣지 않음)
| 속성 | 값 |
|---|---|
| 도메인 | 그룹 |
| 시나리오 | 참여자 권한과 그룹 탈퇴 |
| 케이스 유형 | 권한 |
| 우선순위 | P0 |
| 테스트 레벨 | Route Handler 통합 (DB 옵션 없음) |
| 데이터 준비 방식 | Seed |
| 계정 조건 | 권한 없음 |
| Cleanup | 필요 |
| Spec 경로 | 없음 (현재 실패) |

## 목적
일반 참여자와 비참여자가 다른 참여자를 그룹에서 내보낼 수 없는지 검증한다.

## 시나리오
다른 일반 참여자 토큰과 비참여자 토큰으로 각각 일반 참여자 1명을 대상으로 `DELETE /api/nbreads/{nbreadId}/participants`를 호출한다.

## Given
- 그룹장과 일반 참여자 2명이 참여한 엔빵이 있다.

## When
- 그룹장이 아닌 사용자가 일반 참여자 1명을 내보내기 요청한다.

## Then
- `participant` 행 3건이 그대로 있다.

## 현재 동작
- 두 경우 모두 응답 상태가 204이고 대상 참여자의 행이 지워진다.

## 테스트 데이터
- 그룹장, 일반 참여자 2명, 비참여자 1명

## Cleanup 대상
- Seed로 만든 `nbread`와 딸린 행, 테스트 사용자
