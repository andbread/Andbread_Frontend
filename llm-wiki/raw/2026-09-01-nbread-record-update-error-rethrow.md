# 납부 상태 저장 실패 시 오류를 다시 던지는 코드

작성일 2026-09-01. E2E P0 15건을 Playwright로 옮기면서 `SETTLE-UPDATE-002`(납부 상태 저장에 실패하면 화면 상태를 유지하고 오류를 알린다)를 구현하다가 확인한 내용이다.

## 어디서 나온 이야기인가

`SETTLE-UPDATE-002`의 Notion 본문 `예외/주의사항`에 이렇게 적혀 있었다.

> 컴포넌트가 오류를 다시 던지므로 Playwright에서 처리되지 않은 오류를 별도로 수집해 예상 오류인지 확인한다.

그래서 테스트에 `page.on('pageerror')`를 붙이고, 수집된 오류가 이번 테스트가 의도한 실패인지 메시지로 확인하려 했다. 그런데 확인이 되지 않았다.

## 확인된 동작

`src/components/nbread/nbreadParticipantCard.tsx`의 `handleClickCheckbox`는 실패하면 토스트를 띄운 뒤 오류를 다시 던진다.

```ts
} catch (error) {
  useToast.error('완료 여부 업데이트에 실패했어요. 다시 시도해주세요.')
  throw error
}
```

이 함수는 `onChange`에서 `() => handleClickCheckbox()` 형태로 호출된다. 반환된 Promise를 아무도 받지 않으므로, 다시 던진 오류는 브라우저에서 처리되지 않은 거부(unhandled rejection)로 끝난다.

문제는 던지는 값의 종류다. `updateNbreadRecord`는 Supabase가 준 `PostgrestError`를 그대로 던진다. 이것은 `Error`의 인스턴스가 아니라 평범한 객체다. 그래서 Playwright의 `pageerror` 이벤트로 들어온 값의 `message`가 다음과 같이 나온다.

```
Expected substring: "E2E forced nbread_records update failure"
Received string:    "Object"
```

원래 오류 객체가 담고 있던 `message`, `code`, `details`가 전달되지 않는다. 브라우저 콘솔에도 `Uncaught (in promise) Object` 수준으로만 남는다.

## 재현 방법

E2E 테스트가 이미 이 상황을 만든다. `e2e/settlement.spec.ts`의 `SETTLE-UPDATE-002`가 `PATCH /rest/v1/nbread_records` 요청만 500으로 가로챈 뒤 체크박스를 누른다.

## 영향

- 사용자에게 보이는 동작은 정상이다. 실패 토스트가 뜨고 체크박스는 원래 상태를 유지한다. 이 부분은 테스트로 검증된다.
- 실질적인 손해는 오류 추적 쪽이다. `updateNbreadRecord`가 `captureAppError`로 Sentry에 한 번 보내기는 하지만, 컴포넌트가 다시 던진 쪽은 컨텍스트 없이 사라진다. 토스트를 띄워 이미 사용자에게 알린 뒤라서 다시 던질 이유도 뚜렷하지 않다.

## 지금 테스트에서 한 처리

`pageerror` 수집과 메시지 검증을 걷어냈다. 던지는 값에 메시지가 실리지 않아 "예상한 오류인지" 판정할 근거가 없기 때문이다. 대신 사용자에게 보이는 결과만 검증한다.

- 실패 토스트가 보인다
- 체크박스가 기존 미선택 상태를 유지한다
- 성공 토스트는 보이지 않는다

## 나중에 할 것

사용자와 합의한 처리 방향은 다음과 같다.

- 지금 컴포넌트를 고치지 않는다.
- 정산 기록 갱신을 API route로 옮기는 작업을 할 때 오류를 구체화한다. 그 시점에 다시 던질지 여부, 던진다면 어떤 형태로 던질지를 함께 정한다.
- E2E 작업이 끝나고 핸드오프 위키 문서를 쓸 때 이 문서를 근거로 언급한다.

## 관련

- Notion 테스트 케이스: `SETTLE-UPDATE-002`
- 코드: `src/components/nbread/nbreadParticipantCard.tsx`, `src/lib/nbreadRecord/updateNbreadRecord.ts`
- 테스트: `e2e/settlement.spec.ts`
