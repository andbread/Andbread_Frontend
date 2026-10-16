import { describe, expect, it } from 'vitest'
import { toPaymentDateKey } from './toPaymentDateKey'

// 이 함수의 결과는 nbread_records.payment_date 와 문자열이 정확히 일치해야 한다.
// 하루라도 어긋나면 조회 0건, 갱신 0행이 되고 예외는 나지 않는다.
// 아래 테스트는 현재 변환 규칙을 고정하는 회귀 테스트다.
describe('toPaymentDateKey', () => {
  describe('정상 변환', () => {
    it('날짜만 있는 문자열은 그대로 유지한다', () => {
      expect(toPaymentDateKey('2026-09-01')).toBe('2026-09-01')
    })

    it('UTC 시각이 붙어 있으면 시각을 떼고 날짜만 남긴다', () => {
      expect(toPaymentDateKey('2026-09-01T23:00:00Z')).toBe('2026-09-01')
    })
  })

  describe('타임존 경계', () => {
    // UTC 로 환산한 뒤 날짜를 자르기 때문에 KST 자정 입력은 전날로 밀린다.
    // 현재 동작이며, 결제일이 하루 밀리는 경로이므로 명시적으로 고정한다.
    it('KST 자정은 UTC 기준 전날로 변환된다', () => {
      expect(toPaymentDateKey('2026-09-01T00:00:00+09:00')).toBe('2026-08-31')
    })

    it('KST 오전 9시 이후는 같은 날로 변환된다', () => {
      expect(toPaymentDateKey('2026-09-01T09:00:00+09:00')).toBe('2026-09-01')
    })

    it('UTC 자정은 같은 날로 유지된다', () => {
      expect(toPaymentDateKey('2026-09-01T00:00:00Z')).toBe('2026-09-01')
    })
  })

  describe('잘못된 입력', () => {
    // 조용히 잘못된 키를 만드는 것보다 예외로 끊는 편이 안전하다.
    it('빈 문자열이면 예외를 던진다', () => {
      expect(() => toPaymentDateKey('')).toThrow(RangeError)
    })

    it('날짜로 해석할 수 없는 문자열이면 예외를 던진다', () => {
      expect(() => toPaymentDateKey('납부일 미정')).toThrow(RangeError)
    })
  })
})
