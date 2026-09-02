import { describe, expect, it, test } from 'vitest'
import { calculateIndividualShare } from './calculateIndividualShare'

describe('calculateIndividualShare', () => {
  describe('정상 계산', () => {
    it('총 금액을 참여 인원으로 나눈다', () => {
      expect(calculateIndividualShare(30000, 3)).toBe(9999)
    })

    it('나누어떨어지지 않으면 원 단위 미만을 버린다', () => {
      expect(calculateIndividualShare(10000, 3)).toBe(3333)
    })

    it('참여 인원이 1명이면 총 금액을 그대로 반환한다', () => {
      expect(calculateIndividualShare(17900, 1)).toBe(17900)
    })
  })

  describe('경계값', () => {
    it('총 금액이 0이면 0을 반환한다', () => {
      expect(calculateIndividualShare(0, 4)).toBe(0)
    })

    it('1인당 금액이 1원 미만이면 0으로 내려간다', () => {
      expect(calculateIndividualShare(3, 4)).toBe(0)
    })

    it('참여 인원에 소수가 들어오면 정수로 버린 뒤 나눈다', () => {
      expect(calculateIndividualShare(10000, 2.7)).toBe(5000)
    })

    // 금액 컬럼에 음수를 막는 제약이 없어 표시 로직까지 그대로 내려온다.
    it('총 금액이 음수면 음수 몫을 그대로 반환한다', () => {
      expect(calculateIndividualShare(-3000, 2)).toBe(-1500)
    })
  })

  describe('잘못된 참여 인원', () => {
    // 인원이 0이면 0 나눗셈으로 Infinity 가 되어 화면에 그대로 노출된 적이 있다.
    // 1명으로 취급해 최소한 숫자가 나오도록 막는다.
    // 1명 미만 소수는 정수로 버린 뒤 0이 되므로 같은 경로를 탄다.
    test.for([
      { label: '0명', participantCount: 0 },
      { label: '음수', participantCount: -3 },
      { label: '1명 미만 소수', participantCount: 0.5 },
      { label: '숫자가 아닌 값', participantCount: Number.NaN },
    ])('참여 인원이 $label 이면 1명으로 취급한다', ({ participantCount }) => {
      expect(calculateIndividualShare(30000, participantCount)).toBe(30000)
    })
  })

  describe('잘못된 총 금액', () => {
    it('총 금액이 숫자가 아니면 0을 반환한다', () => {
      expect(calculateIndividualShare(Number.NaN, 3)).toBe(0)
    })

    it('총 금액이 무한이면 0을 반환한다', () => {
      expect(calculateIndividualShare(Number.POSITIVE_INFINITY, 3)).toBe(0)
    })
  })
})
