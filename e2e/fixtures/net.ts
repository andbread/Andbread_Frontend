import type { Page } from '@playwright/test'

/**
 * 특정 경로·메서드의 요청만 500으로 대체해 실패 경로를 검증한다.
 * 대상이 아닌 요청(다른 메서드, 조회 등)은 그대로 흘려보낸다.
 * 진단 메시지는 인자로 받지 않고 경로와 메서드로 조합한다. 이 메시지는
 * 어떤 어설션에도 쓰이지 않고 실패 시 디버깅에만 쓰이기 때문이다.
 */
export const failRequest = (page: Page, pathSuffix: string, method: string) =>
  page.route(
    (url) => url.pathname.endsWith(pathSuffix),
    async (route) => {
      if (route.request().method() !== method) {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `E2E forced ${method} ${pathSuffix} failure`,
        }),
      })
    },
  )
