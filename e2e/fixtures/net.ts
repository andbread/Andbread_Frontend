import type { Page } from '@playwright/test'

/**
 * 특정 경로·메서드의 요청만 500으로 대체해 실패 경로를 검증한다.
 * 대상이 아닌 요청(다른 메서드, 조회 등)은 그대로 흘려보낸다.
 * 진단 메시지는 인자로 받지 않고 경로와 메서드로 조합한다. 이 메시지는
 * 어떤 어설션에도 쓰이지 않고 실패 시 디버깅에만 쓰이기 때문이다.
 *
 * `times`를 주면 대상 요청 중 처음 그 횟수만 실패시키고 이후는 실제 서버로 보낸다.
 * Playwright `page.route`의 `times`는 그대로 흘려보낸 조회 요청까지 횟수로 세므로 쓰지 않는다.
 */
export const failRequest = (
  page: Page,
  pathSuffix: string,
  method: string,
  { times = Infinity }: { times?: number } = {},
) => {
  let failedCount = 0

  return page.route(
    (url) => url.pathname.endsWith(pathSuffix),
    async (route) => {
      if (route.request().method() !== method || failedCount >= times) {
        await route.continue()
        return
      }

      failedCount += 1
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `E2E forced ${method} ${pathSuffix} failure`,
        }),
      })
    },
  )
}
