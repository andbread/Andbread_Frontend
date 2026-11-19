import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import {
  applySession,
  createFakeSession,
  createSession,
} from './fixtures/session'
import { toastMessage } from './fixtures/ui'
import type { Seeder } from './fixtures/seed'

test.skip(!hasTestDatabase, testDatabaseSkipReason)

/** 방장, 초대 대상자, 정원이 남은 엔빵, 대기 중 초대를 한 번에 만든다. */
const seedPendingInvite = async (seed: Seeder) => {
  const leader = await seed.createUser('E2E 방장')
  const target = await seed.createUser('E2E 초대 대상자')
  const title = seed.unique('E2E 초대 엔빵')
  const nbread = await seed.createNbread({
    leaderId: leader.id,
    title,
    amount: 20000,
    participantCount: 2,
    paymentDate: 12,
  })

  await seed.addParticipant(nbread.id, leader.id, true)

  const inviteToken = await seed.createInvite(nbread.id, target.id, 'pending')

  return { leader, target, nbread, title, inviteToken }
}

test.describe('초대 응답 자격 검증', () => {
  // INVITE-ACCESS-001
  test('비로그인 사용자는 초대 내용 노출 없이 로그인 화면으로 이동한다', async ({
    page,
    seed,
  }) => {
    const { leader, title, inviteToken } = await seedPendingInvite(seed)

    // 세션을 주입하지 않고 접속해 비로그인 상태를 유지한다.
    await page.goto(`/invite/${inviteToken}`)

    await expect(page).toHaveURL(`/login?redirect=%2Finvite%2F${inviteToken}`)

    // 로그인 전에는 엔빵 제목과 방장 이름이 노출되지 않아야 한다.
    await expect(page.getByText(title)).toHaveCount(0)
    await expect(page.getByText(leader.name)).toHaveCount(0)

    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('pending')
  })

  // INVITE-ACCESS-003
  test('세션이 끊긴 채 로컬 사용자 정보만 남아도 로그인 화면에 머문다', async ({
    page,
    seed,
  }) => {
    const { leader, title, inviteToken } = await seedPendingInvite(seed)
    // Supabase 세션 없이 localStorage의 user-store만 남은 상태를 만든다.
    await applySession(page, createFakeSession())

    await page.goto(`/invite/${inviteToken}`)

    await expect(page).toHaveURL(`/login?redirect=%2Finvite%2F${inviteToken}`)

    // LoginRedirectGuard가 /home으로 되돌리지 않아야 로그인 버튼이 보인다.
    await expect(
      page.getByRole('button', { name: '카카오로 시작하기' }),
    ).toBeVisible()

    await expect(page.getByText(title)).toHaveCount(0)
    await expect(page.getByText(leader.name)).toHaveCount(0)
  })

  // INVITE-ACCESS-002
  test('초대받지 않은 계정은 지정 사용자 초대에 응답할 수 없다', async ({
    page,
    seed,
  }) => {
    const { nbread, inviteToken } = await seedPendingInvite(seed)
    const other = await seed.createUser('E2E 권한 없는 계정')
    await applySession(page, await createSession(other))

    await page.goto(`/invite/${inviteToken}`)
    await page.getByRole('button', { name: '초대 수락하기' }).click()
    await page.getByRole('button', { name: '수락하기', exact: true }).click()

    await expect(
      toastMessage(page, '초대받은 계정으로 로그인해 주세요.'),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '초대를 수락하시겠어요?' }),
    ).not.toBeVisible()

    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('pending')

    const participants = await seed.getParticipants(nbread.id, other.id)
    expect(participants).toHaveLength(0)
  })
})

test.describe('초대 링크 조회', () => {
  // INVITE-DETAIL-001
  test('유효한 대기 중 초대 링크에서 초대 정보를 확인할 수 있다', async ({
    page,
    seed,
  }) => {
    const { leader, target, title, inviteToken } = await seedPendingInvite(seed)
    await applySession(page, await createSession(target))

    await page.goto(`/invite/${inviteToken}`)

    const invitePage = page.getByRole('main')
    await expect(invitePage).toContainText(`${leader.name}님이 당신을`)
    await expect(invitePage).toContainText(`${title}에 초대했어요`)

    await expect(
      page.getByRole('button', { name: '초대 수락하기' }),
    ).toBeVisible()
    // 응답 확인 모달에도 같은 이름의 버튼이 있어 화면에 보이는 쪽만 남긴다.
    await expect(
      page
        .getByRole('button', { name: '거절하기', exact: true })
        .filter({ visible: true }),
    ).toBeVisible()
  })
})

test.describe('초대 응답', () => {
  // INVITE-RESPOND-001
  test('초대 대상자가 수락하면 엔빵 참여가 완료된다', async ({
    page,
    seed,
  }) => {
    const { target, nbread, inviteToken } = await seedPendingInvite(seed)
    await applySession(page, await createSession(target))

    // 처리 중 상태를 관찰하는 동안 응답을 붙잡아 둔다.
    // 고정 대기 대신 어설션이 끝나면 바로 풀어 주므로 결과가 시간에 좌우되지 않는다.
    let releaseResponse = () => {}
    const held = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })

    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/rpc/respond_to_nbread_invite'),
      async (route) => {
        await held
        await route.continue()
      },
    )

    await page.goto(`/invite/${inviteToken}`)
    await page.getByRole('button', { name: '초대 수락하기' }).click()

    const submitButton = page.getByRole('button', {
      name: '수락하기',
      exact: true,
    })
    await expect(submitButton).toBeVisible()
    await submitButton.click()

    const processingButton = page.getByRole('button', { name: '처리 중' })
    await expect(processingButton).toBeVisible()
    await expect(processingButton).toBeDisabled()
    await expect(page.getByRole('button', { name: '취소' })).toBeDisabled()

    releaseResponse()

    await expect(toastMessage(page, '엔빵 참여가 완료됐어요.')).toBeVisible()
    await expect(page).toHaveURL(`/nbread/${nbread.id}`)

    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('accepted')

    const participants = await seed.getParticipants(nbread.id, target.id)
    expect(participants).toHaveLength(1)
  })

  // INVITE-RESPOND-002
  test('이미 참여 중인 사용자가 다른 초대를 수락해도 참여자가 중복되지 않는다', async ({
    page,
    seed,
  }) => {
    const leader = await seed.createUser('E2E 방장')
    const member = await seed.createUser('E2E 기존 참여자')
    const title = seed.unique('E2E 중복 수락 엔빵')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title,
      amount: 20000,
      participantCount: 2,
      paymentDate: 12,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await seed.addParticipant(nbread.id, member.id, false)
    const inviteToken = await seed.createInvite(nbread.id, member.id, 'pending')
    await applySession(page, await createSession(member))

    await page.goto(`/invite/${inviteToken}`)
    await page.getByRole('button', { name: '초대 수락하기' }).click()
    await page.getByRole('button', { name: '수락하기', exact: true }).click()

    await expect(
      page.getByRole('heading', { name: '이미 참여 중인 엔빵이에요.' }),
    ).toBeVisible()

    await page.getByRole('button', { name: '엔빵 확인하기' }).click()
    await expect(page).toHaveURL(`/nbread/${nbread.id}`)

    const participants = await seed.getParticipants(nbread.id, member.id)
    expect(participants).toHaveLength(1)

    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('accepted')
  })

  // INVITE-RESPOND-003
  test('정원이 찬 엔빵의 초대를 수락하면 만료 안내가 보인다', async ({
    page,
    seed,
  }) => {
    const leader = await seed.createUser('E2E 방장')
    const existingMember = await seed.createUser('E2E 기존 참여자')
    const target = await seed.createUser('E2E 정원 초과 대상자')
    const title = seed.unique('E2E 정원 초과 엔빵')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title,
      amount: 20000,
      participantCount: 2,
      paymentDate: 12,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await seed.addParticipant(nbread.id, existingMember.id, false)
    const inviteToken = await seed.createInvite(nbread.id, target.id, 'pending')
    await applySession(page, await createSession(target))

    await page.goto(`/invite/${inviteToken}`)
    await page.getByRole('button', { name: '초대 수락하기' }).click()
    await page.getByRole('button', { name: '수락하기', exact: true }).click()

    await expect(
      page.getByRole('heading', { name: '이미 만료된 초대예요.' }),
    ).toBeVisible()

    await page.getByRole('button', { name: '홈으로 가기' }).click()
    await expect(page).toHaveURL('/')

    const participants = await seed.getParticipants(nbread.id, target.id)
    expect(participants).toHaveLength(0)

    // 함수 예외로 거래가 되돌려져 초대 상태는 pending으로 남는다.
    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('pending')
  })
})
