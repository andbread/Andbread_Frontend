import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import { applySession, createSession, readUserStore } from './fixtures/session'

test.describe('접근 제어', () => {
  // AUTH-ACCESS-001
  test('비로그인 사용자가 보호 경로를 열면 첫 화면으로 이동한다', async ({
    page,
  }) => {
    await page.goto('/home')

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('heading', { name: '이번 달 엔빵' }),
    ).not.toBeVisible()
  })
})

test.describe('로그인 콜백 처리', () => {
  test.skip(!hasTestDatabase, testDatabaseSkipReason)

  // AUTH-CALLBACK-001
  test('약관에 동의한 사용자는 인증 콜백 뒤 요청한 초대 경로로 이동한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    const session = await createSession(user)

    // user-store는 콜백 흐름이 직접 채워야 하는 값이므로 주입하지 않는다.
    await applySession(page, session, { withUserStore: false })

    await page.goto('/auth/callback?next=%2Finvite%2Fsample-code')

    await expect(page).toHaveURL('/invite/sample-code')

    const userStore = await readUserStore(page)
    expect(userStore?.state?.user?.id).toBe(user.id)
  })
})
