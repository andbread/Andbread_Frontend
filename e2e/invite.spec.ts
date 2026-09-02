import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import { applySession, createSession } from './fixtures/session'
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
})
