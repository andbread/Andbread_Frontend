import { expect, test } from '@playwright/test'

test('랜딩 페이지의 주요 콘텐츠를 노출한다', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('엔빵')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('엔빵')
  await expect(
    page.getByRole('link', { name: '시작하기', exact: true }),
  ).toHaveAttribute('href', '/login')
})
