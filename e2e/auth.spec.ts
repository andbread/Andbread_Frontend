import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import { applySession, createSession, readUserStore } from './fixtures/session'
import { toastMessage } from './fixtures/ui'

/** 콜백/약관 동의 흐름의 복귀 경로 검증에 공통으로 쓰는 허용된 경로. */
const ALLOWED_NEXT_PATH = '/invite/sample-code'

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

  // AUTH-ACCESS-002
  test('약관에 동의하지 않은 로그인 사용자가 보호 경로를 열면 약관 동의 화면으로 이동한다', async ({
    page,
    seed,
  }) => {
    test.skip(!hasTestDatabase, testDatabaseSkipReason)

    const user = await seed.createUser(undefined, { termsAgreed: false })
    await applySession(page, await createSession(user))

    await page.goto('/home')

    await expect(page).toHaveURL('/terms-agreement')
  })

  // AUTH-ACCESS-003
  test('비로그인 사용자가 약관 동의 화면을 열면 로그인 화면으로 이동한다', async ({
    page,
  }) => {
    await page.goto('/terms-agreement')

    await expect(page).toHaveURL('/login')
  })

  // AUTH-ACCESS-004
  test('이미 약관에 동의한 사용자가 약관 동의 화면을 열면 요청한 경로로 이동한다', async ({
    page,
    seed,
  }) => {
    test.skip(!hasTestDatabase, testDatabaseSkipReason)

    const user = await seed.createUser()
    await applySession(page, await createSession(user))

    await page.goto(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )

    await expect(page).toHaveURL(ALLOWED_NEXT_PATH)
  })

  // AUTH-ACCESS-005
  test('로그인한 사용자가 로그인 화면을 열면 홈으로 이동한다', async ({
    page,
    seed,
  }) => {
    test.skip(!hasTestDatabase, testDatabaseSkipReason)

    const user = await seed.createUser()
    await applySession(page, await createSession(user))

    await page.goto('/login')

    await expect(page).toHaveURL('/home')
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

  // AUTH-CALLBACK-002
  test('약관에 동의하지 않은 사용자는 인증 콜백 뒤 약관 동의 화면으로 이동한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser(undefined, { termsAgreed: false })
    const session = await createSession(user)

    await applySession(page, session, { withUserStore: false })

    await page.goto(
      `/auth/callback?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )

    await expect(page).toHaveURL(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
  })

  // AUTH-CALLBACK-003
  test('인증 세션이 없는 콜백 화면은 오류 메시지를 표시한다', async ({
    page,
  }) => {
    await page.goto('/auth/callback')

    // 세션이 없으면 supabase-js가 AuthSessionMissingError를 던지고
    // 그 메시지를 그대로 화면에 보여준다.
    await expect(page.getByText('Auth session missing!')).toBeVisible()
  })

  // AUTH-CALLBACK-004
  test('사용자 행이 없는 인증 사용자의 콜백은 오류 메시지를 표시한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser(undefined, { createRow: false })
    const session = await createSession(user)

    await applySession(page, session, { withUserStore: false })

    await page.goto('/auth/callback')

    await expect(
      page.getByText('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.'),
    ).toBeVisible()
  })
})

test.describe('회원 탈퇴', () => {
  test.skip(!hasTestDatabase, testDatabaseSkipReason)

  // AUTH-DELETE-003
  test('로그인 사용자가 회원 탈퇴를 완료하면 인증 사용자와 로컬 로그인 상태가 제거된다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    await applySession(page, await createSession(user))

    await page.goto('/mypage')

    // 계정 관리 메뉴와 모달 확인 버튼이 같은 문구를 쓰므로 li만 짚는다.
    await page.locator('li', { hasText: '탈퇴하기' }).click()

    const confirmButton = page.getByRole('button', { name: '탈퇴하기' })
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()

    await expect(toastMessage(page, '회원 탈퇴가 완료되었어요.')).toBeVisible()
    await expect(page).toHaveURL('/login')

    const userStore = await readUserStore(page)
    expect(userStore?.state?.user).toBeNull()

    const { data } = await seed.admin.auth.admin.getUserById(user.id)
    expect(data.user).toBeNull()
  })
})

test.describe('복귀 경로 검증', () => {
  // AUTH-REDIRECT-001
  test('콜백의 외부 복귀 주소는 홈 경로로 바뀐다', async ({ page, seed }) => {
    test.skip(!hasTestDatabase, testDatabaseSkipReason)

    const user = await seed.createUser()
    const session = await createSession(user)

    await applySession(page, session, { withUserStore: false })

    await page.goto(
      `/auth/callback?next=${encodeURIComponent('https://evil.example.com')}`,
    )

    await expect(page).toHaveURL('/home')
  })

  // AUTH-REDIRECT-002
  test('허용되지 않은 로그인 복귀 경로는 홈으로 바뀐다', async ({ page }) => {
    let authorizeRequestUrl: string | null = null

    await page.route('**/auth/v1/authorize**', async (route) => {
      authorizeRequestUrl = route.request().url()
      await route.abort()
    })

    await page.goto('/login?redirect=%2Fmypage')
    await page.getByRole('button', { name: '카카오로 시작하기' }).click()

    await expect.poll(() => authorizeRequestUrl).not.toBeNull()

    const redirectTo = new URL(authorizeRequestUrl!).searchParams.get(
      'redirect_to',
    )
    expect(redirectTo).toContain(encodeURIComponent('/home'))
  })
})

test.describe('약관 동의', () => {
  test.skip(!hasTestDatabase, testDatabaseSkipReason)

  // AUTH-TERMS-001
  test('필수 약관을 모두 선택한 사용자는 동의를 저장하고 요청한 경로로 이동한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser(undefined, { termsAgreed: false })
    await applySession(page, await createSession(user))

    await page.goto(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
    // 체크박스 input은 CSS로 숨겨져 있어 클릭은 감싸는 label에 해야 한다.
    await page.getByTestId('terms-agree-all').click()
    await page.getByRole('button', { name: '확인' }).click()

    await expect(toastMessage(page, '약관 동의가 완료됐어요.')).toBeVisible()
    await expect(page).toHaveURL(ALLOWED_NEXT_PATH)
  })

  // AUTH-TERMS-002
  test('필수 약관을 모두 선택하지 않으면 동의가 제출되지 않는다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser(undefined, { termsAgreed: false })
    await applySession(page, await createSession(user))

    await page.goto(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
    // 체크박스 input은 CSS로 숨겨져 있어 클릭은 감싸는 label에 해야 한다.
    // 서비스 이용 약관만 체크하고 개인정보 처리방침은 남겨 둔다.
    await page.getByTestId('terms-agree-service').click()

    await expect(page.getByRole('button', { name: '확인' })).toBeDisabled()
    await expect(page).toHaveURL(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
  })

  // AUTH-TERMS-003
  test('약관 동의 저장이 실패하면 오류를 알리고 현재 화면에 머문다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser(undefined, { termsAgreed: false })
    await applySession(page, await createSession(user))

    // 조회는 그대로 두고 약관 동의 저장 요청만 실패로 만든다.
    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/user'),
      async (route) => {
        if (route.request().method() !== 'PATCH') {
          await route.continue()
          return
        }

        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'E2E forced user update failure',
          }),
        })
      },
    )

    await page.goto(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
    // 체크박스 input은 CSS로 숨겨져 있어 클릭은 감싸는 label에 해야 한다.
    await page.getByTestId('terms-agree-all').click()
    await page.getByRole('button', { name: '확인' }).click()

    await expect(
      toastMessage(page, '약관 동의 저장에 실패했어요.'),
    ).toBeVisible()
    await expect(page).toHaveURL(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
  })

  // AUTH-TERMS-004
  test('약관 동의를 나중에 하기로 확정하면 로그아웃하고 복귀 경로를 가진 로그인 화면으로 이동한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser(undefined, { termsAgreed: false })
    await applySession(page, await createSession(user))

    await page.goto(
      `/terms-agreement?next=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )
    // 화면의 '나중에 하기'와 종료 확인 모달의 '나중에 하기'가 같은 문구라
    // DOM 순서상 먼저 그려지는 화면 버튼을 먼저 짚는다.
    await page.getByRole('button', { name: '나중에 하기' }).first().click()

    const confirmLater = page
      .getByRole('button', { name: '나중에 하기' })
      .nth(1)
    await expect(confirmLater).toBeVisible()
    await confirmLater.click()

    await expect(page).toHaveURL(
      `/login?redirect=${encodeURIComponent(ALLOWED_NEXT_PATH)}`,
    )

    const userStore = await readUserStore(page)
    expect(userStore?.state?.user).toBeNull()
  })
})
