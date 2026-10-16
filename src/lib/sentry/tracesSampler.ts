import type { BrowserOptions } from '@sentry/nextjs'

// Web Vitals(LCP / CLS / INP / FCP / TTFB)는 pageload 트랜잭션을 통해서만 수집된다.
// production 기본 샘플링(0.1)에서는 표본이 쌓이지 않아 Web Vitals 집계가 불가능하므로
// pageload 만 100% 로 올리고, 그 외 트랜잭션은 기존 비율을 유지한다.
const PAGELOAD_SAMPLE_RATE = 1.0
const PRODUCTION_SAMPLE_RATE = 0.1
const DEVELOPMENT_SAMPLE_RATE = 1.0

// Next.js App Router 계측은 pageload 트랜잭션의 attributes 에 'sentry.op' 을 직접 넣는다.
// 따라서 샘플링 시점에도 이 값으로 pageload 를 구분할 수 있다.
const SENTRY_OP_ATTRIBUTE = 'sentry.op'
const PAGELOAD_OP = 'pageload'

export const tracesSampler: NonNullable<BrowserOptions['tracesSampler']> = (
  samplingContext,
) => {
  if (samplingContext.attributes?.[SENTRY_OP_ATTRIBUTE] === PAGELOAD_OP) {
    return PAGELOAD_SAMPLE_RATE
  }

  // 들어온 트레이스의 샘플링 결정이 있으면 그것을 따르고, 없으면 기존 비율로 판단한다.
  return samplingContext.inheritOrSampleWith(
    process.env.NODE_ENV === 'production'
      ? PRODUCTION_SAMPLE_RATE
      : DEVELOPMENT_SAMPLE_RATE,
  )
}
