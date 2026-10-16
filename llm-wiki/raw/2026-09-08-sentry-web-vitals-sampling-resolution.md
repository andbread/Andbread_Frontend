# Sentry Web Vitals가 비어 보인 이유는 수집 실패가 아니라 표본 해상도였다

작성일 2026-09-08. GitHub Issue [#221](https://github.com/andbread/Andbread_Frontend/issues/221)을 구현하다가 이슈의 문제 진단 자체가 틀렸다는 것을 확인하고, 진단을 바꿔 이슈 본문을 정정한 기록이다. 작업 브랜치는 `hm1n/setting-89-sentry-web-vitals-sentry-web-vitals-p`이다.

## 이슈가 원래 주장한 것

이슈 #221의 초기 본문은 다음과 같이 진단하고 있었다.

> Sentry Insights > Web Vitals 화면에서 Performance Score가 0으로 표시되고, LCP / INP / CLS / TTFB 지표가 모두 비어 있습니다.

원인은 `src/instrumentation-client.ts`의 `tracesSampleRate: 0.1`이며, 방문 10건 중 1건만 `pageload` 트랜잭션이 전송되어 표본이 쌓이지 않아 성능 측정이 불가능하다는 것이었다. 해결책으로 `pageload`만 샘플링 100%로 올리는 방안을 제시했다.

## 실제로 확인된 것

사용자가 대시보드를 두 가지 조회 조건으로 확인한 결과, 지표는 정상적으로 쌓이고 있었다. 조회 조건에 따라 결과가 갈렸다.

| 조회 기간 | Performance Score | LCP | CLS | INP | TTFB |
| --- | --- | --- | --- | --- | --- |
| 24시간 | 65 | 결측 | 결측 | 624ms | 11.70ms |
| 30일 | 74 | 3.54s | 0.0005 | 420ms | 13.60ms |

30일 기준으로는 다섯 지표가 모두 산출되고 Score도 74가 나온다. 따라서 수집 파이프라인에는 결함이 없고, 이슈가 관측한 "모두 비어 있다"는 상태는 조회 기간을 24시간으로 좁혔을 때만 나타나는 현상이었다.

Score Breakdown 그래프도 같은 이야기를 하고 있었다. 선이 대부분 구간에서 0에 붙어 있고 며칠에 한 번씩만 20에서 100 사이로 튀어 오른다. 이 모양은 해당 구간에 측정 데이터가 한 건도 없다는 뜻이다.

## 진단을 어떻게 바꿨는가

문제는 "수집이 안 된다"가 아니라 "표본 해상도가 부족하다"로 정리했다. 30일치를 한 덩어리로 합쳐야 p75 하나가 겨우 산출되는 상태이므로, 다음 세 가지를 할 수 없다.

- 배포 직후 성능 회귀를 감지할 수 없다. 24시간 창의 수치는 신뢰할 수 없고, 실제로 Score가 65와 74로 갈렸다. 성능이 변한 것이 아니라 표본이 적어 흔들린 값이다.
- 릴리즈 단위 비교를 할 수 없다. All Releases로 30일을 합쳐야 숫자가 나오므로 어느 배포부터 느려졌는지 판단할 수 없다.
- 라우트 단위 분해를 할 수 없다. 이미 부족한 표본을 페이지별로 다시 나누면 대부분 칸이 비게 된다.

작업의 값은 여기에 있다. 현재 LCP p75가 `3.54s`로 Sentry 기준 개선 필요 구간(2.5초 초과)에 있는데, 30일을 기다려야 숫자 하나가 나오는 상태에서는 개선 전후를 비교할 수 없다. 성능 개선을 하려면 먼저 측정을 신뢰할 수 있게 만들어야 한다.

이 진단으로 이슈 본문과 제목을 정정했다. 제목은 `Sentry Web Vitals 수집을 위한 pageload 트랜잭션 샘플링 100% 조정`에서 `Web Vitals 표본 해상도 확보를 위한 pageload 트랜잭션 샘플링 100% 조정`으로 바꿨다.

## 이슈 본문의 SDK 서술 오류 두 건

구현하면서 이슈가 전제한 API 사용법이 설치된 `@sentry/nextjs` 10.53.1과 어긋나는 것을 확인했다.

첫째로 `inheritOrSampleWith`는 import 대상이 아니다. 이슈 본문은 이 함수를 별도로 가져다 쓰는 것처럼 적었으나, 실제로는 `tracesSampler`에 전달되는 `samplingContext` 객체의 메서드다. `node_modules/@sentry/core/build/types/types-hoist/samplingcontext.d.ts`에서 확인했다.

```ts
export interface TracesSamplerSamplingContext extends SamplingContext {
    inheritOrSampleWith: (fallbackSampleRate: number) => number;
}
```

둘째로 `enableStandaloneClsSpans`와 `enableStandaloneLcpSpans`는 `browserTracingIntegration`의 최상위 옵션이 아니라 `_experiments` 하위 옵션이다. 이슈 본문대로 최상위에 넘기면 타입 오류가 난다. `node_modules/@sentry/browser/build/npm/types/tracing/browserTracingIntegration.d.ts` 205행 부근에서 확인했다.

## `pageload` 판정이 성립하는 근거

`tracesSampler`에서 `pageload`를 구분하려면 샘플링 시점의 `samplingContext.attributes`에 `sentry.op` 값이 있어야 한다. 그런데 Sentry core의 브라우저 경로는 최상위 `op` 옵션을 `attributes`로 옮기지 않는다. `_startRootSpan`이 `sampleSpan`에 넘기는 것은 `spanArguments.attributes`뿐이고, `sentry.op` 속성은 그 뒤 `SentrySpan` 생성자에서 붙는다.

실제로 core의 브라우저 경로를 직접 재현해 확인했다. 최상위 `op`로 넘긴 span은 `attributes`가 비어 있었고, `attributes`에 직접 넣은 경우만 값이 보였다.

```
[{"name":"/route-a","attributes":{}},
 {"name":"/route-b","attributes":{"sentry.op":"pageload"}},
 {"name":"GET /api/x","attributes":{}}]
```

그럼에도 이 판정이 성립하는 이유는 Next.js App Router 계측이 `attributes`에 직접 넣어 주기 때문이다. `node_modules/@sentry/nextjs/build/esm/client/routing/appRouterRoutingInstrumentation.js`의 `appRouterInstrumentPageLoad`가 다음과 같이 호출한다.

```js
startBrowserTracingPageLoadSpan(client, {
  name: parameterizedPathname ?? pathname,
  attributes: {
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: 'pageload',
    ...
  },
})
```

따라서 이 판정은 App Router 계측 구현에 의존한다. Pages Router로 옮기거나 SDK가 이 부분을 바꾸면 판정이 조용히 실패할 수 있다. 그래서 판정 함수를 `src/lib/sentry/tracesSampler.ts`로 분리하고 유닛 테스트로 두 분기를 고정했다. 분기가 어긋나면 Web Vitals가 쌓이지 않거나 Sentry 쿼터가 새는데 예외는 발생하지 않기 때문이다.

## standalone span 옵션을 제외한 이유

이슈의 선택 과제였던 `_experiments.enableStandaloneClsSpans`와 `enableStandaloneLcpSpans`는 이번 범위에서 제외했다. 로컬 프로덕션 빌드에서 옵션만 토글해 양방향으로 실측한 결과가 판단 근거다.

| 설정 | `pageload` 트랜잭션의 `measurements` | standalone span |
| --- | --- | --- |
| 옵션 없음 (현재 배포본과 동일) | `ttfb`, `lcp` 140ms, `cls` 0.223, `fp`, `fcp` | 없음 |
| 옵션 활성화 | `ttfb`, `fp`, `fcp` | `ui.webvital.lcp`, `ui.webvital.cls` |

옵션을 켜면 LCP와 CLS가 트랜잭션의 `measurements`에서 빠지고 `pagehide` 시점에 별도 span으로 전송된다. 전송된 span에는 `sentry.pageload.span_id`가 있어 원래 `pageload` span과 연결되고, LCP span에는 `lcp.element`와 `lcp.renderTime` 같은 부가 속성이 함께 담긴다.

문제는 현재 대시보드가 커스텀 Dashboard이고 그 위젯이 트랜잭션 기준 `measurements.lcp`와 `measurements.cls`를 조회할 가능성이 높다는 점이다. 옵션을 켜면 두 위젯이 영구히 빈값이 된다. 값 정확도 개선보다 기존 관측 수단을 유지하는 편이 낫다고 판단해, 먼저 샘플링만 올려 24시간 창에서 지표가 채워지는지 확인한 뒤 필요하면 별도 이슈로 다루기로 했다.

첫 측정에서 `cls` 키가 아예 없었던 것도 이 과정에서 확인했다. 레이아웃 이동이 한 번도 없으면 `cls` 항목이 생성되지 않는다. 페이지 로드 직후 요소를 삽입해 이동을 강제하니 `cls: 0.223`이 실렸다.

## 검증 방법

로컬에 더미 DSN으로 프로덕션 빌드를 만들고 `next start`로 띄운 뒤, Playwright의 `page.route`로 `/monitoring` 요청을 가로채 envelope 본문을 직접 읽었다. `NODE_ENV=production`이므로 `0.1` 분기가 실제로 동작하는 상태였다.

| 대상 | 결과 |
| --- | --- |
| `pageload` 트랜잭션 | `sentry.sample_rate: 1`, envelope 헤더 `sampled: "true"` |
| `navigation` 트랜잭션 | `sentry.sample_rate: 0.1`, 클라이언트 전환 14회 중 2건만 전송 |

더미 DSN은 존재하지 않는 프로젝트를 가리켰고 응답은 모두 `401`이었으며, 마지막 회차는 `route.fulfill`로 가로채 네트워크로 나가지도 않았다. 따라서 이 검증분은 실제 Sentry 프로젝트에 한 건도 들어가지 않았다.

## 부수적으로 처리한 것

작업 워크트리의 `node_modules`가 손상된 상태였다. 패키지 디렉터리에 `package.json`이 없어 `require('@sentry/nextjs')`가 실패했고, `npm install`은 `ENOTEMPTY`로 중단됐다. 디렉터리를 삭제하고 `npm ci`로 다시 설치해 해결했다.

워크트리에 `.env`가 없어 첫 빌드가 `Error: supabaseUrl is required.`로 실패했다. 검증용으로만 더미 환경변수를 명령줄에 넘겨 빌드했고 `.env` 파일은 만들지 않았다. 빌드가 생성한 `public/sitemap-0.xml`과 `public/robots.txt` 변경은 되돌렸다.

## 확인 필요

- 대시보드 Pages 표의 `PAGELOADS` 값이 라우트별 실제 표본 수다. 30일 기준으로 라우트당 수십 건 수준이면 해상도 진단이 확정되고, 수백 건 이상이 이미 쌓여 있다면 이 이슈를 폐기하는 편이 맞다. 아직 확인하지 않았다.
- Sentry Stats > Usage의 트랜잭션 사용량을 확인하지 않았다. Score Breakdown의 스파이크 빈도로 보아 절대량이 작아 100%로 올려도 쿼터 부담이 크지 않을 것으로 추정하지만, 실측이 아닌 추정이다.
- 24시간 창에서 LCP와 CLS가 결측인 이유를 표본 부족으로 설명했으나, 브라우저 지원 차이가 섞여 있을 가능성은 배제하지 못했다. Safari와 iOS는 LCP API와 Layout Instability API를 지원하지 않으므로, 통과한 소수 표본이 iOS였다면 TTFB만 남는다. `browser.name`으로 필터해 확인하면 갈린다.
- Sentry 기본 화면인 Insights > Web Vitals가 standalone span을 읽는지 확인하지 않았다. 이번 판단은 커스텀 Dashboard 위젯을 기준으로 했다.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`는 standalone span 옵션이 포함된 상태에서 모두 통과했다. 옵션을 제거한 뒤에는 다시 실행하지 않았다.
