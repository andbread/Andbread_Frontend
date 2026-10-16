import { describe, expect, it, vi } from 'vitest'
import { tracesSampler } from './tracesSampler'

// pageload 만 100% 로 올리고 그 외 트랜잭션은 기존 비율을 유지하는 것이 이 함수의 목적이다.
// 분기가 어긋나면 Web Vitals 가 안 쌓이거나(전자) Sentry 쿼터가 새는데(후자) 예외는 나지 않는다.
// 아래 테스트는 두 분기를 모두 고정하는 회귀 테스트다.

type SamplingContext = Parameters<typeof tracesSampler>[0]

const createContext = (
  attributes: SamplingContext['attributes'],
  inheritOrSampleWith: SamplingContext['inheritOrSampleWith'] = (fallback) =>
    fallback,
): SamplingContext => ({
  name: '/nbread',
  attributes,
  inheritOrSampleWith,
})

describe('tracesSampler', () => {
  describe('pageload 트랜잭션', () => {
    it('pageload 는 항상 100% 로 샘플링한다', () => {
      expect(tracesSampler(createContext({ 'sentry.op': 'pageload' }))).toBe(
        1.0,
      )
    })

    it('pageload 는 들어온 트레이스의 샘플링 결정을 따르지 않는다', () => {
      const inheritOrSampleWith = vi.fn(() => 0.1)

      expect(
        tracesSampler(
          createContext({ 'sentry.op': 'pageload' }, inheritOrSampleWith),
        ),
      ).toBe(1.0)
      expect(inheritOrSampleWith).not.toHaveBeenCalled()
    })
  })

  describe('그 외 트랜잭션', () => {
    it('navigation 은 기존 비율 판단에 위임한다', () => {
      const inheritOrSampleWith = vi.fn((fallback: number) => fallback)

      tracesSampler(
        createContext({ 'sentry.op': 'navigation' }, inheritOrSampleWith),
      )

      // 테스트 실행 환경(NODE_ENV=test)에서는 production 이 아니므로 1.0 을 넘긴다.
      expect(inheritOrSampleWith).toHaveBeenCalledWith(1.0)
    })

    it('attributes 가 없어도 기존 비율 판단에 위임한다', () => {
      const inheritOrSampleWith = vi.fn((fallback: number) => fallback)

      tracesSampler(createContext(undefined, inheritOrSampleWith))

      expect(inheritOrSampleWith).toHaveBeenCalledWith(1.0)
    })

    it('들어온 트레이스의 샘플링 결정이 있으면 그 값을 그대로 반환한다', () => {
      expect(
        tracesSampler(createContext({ 'sentry.op': 'http.client' }, () => 0.5)),
      ).toBe(0.5)
    })
  })
})
