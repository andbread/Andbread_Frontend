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

/** 완료 상태(수락/거절/만료) 초대를 만든다. 수락 상태는 대상자를 참여자로도 등록한다. */
const seedCompletedInvite = async (
  seed: Seeder,
  status: 'accepted' | 'rejected' | 'expired',
) => {
  const leader = await seed.createUser('E2E 방장')
  const target = await seed.createUser('E2E 초대 대상자')
  const title = seed.unique('E2E 초대 상태 엔빵')
  const nbread = await seed.createNbread({
    leaderId: leader.id,
    title,
    amount: 20000,
    participantCount: 2,
    paymentDate: 12,
  })

  await seed.addParticipant(nbread.id, leader.id, true)

  if (status === 'accepted') {
    await seed.addParticipant(nbread.id, target.id, false)
  }

  const inviteToken = await seed.createInvite(nbread.id, target.id, status)

  return { leader, target, nbread, title, inviteToken }
}

/** 정원이 남은 엔빵과 초대 대상 계정을 만든다. 초대 보내기 화면 검증에 쓴다. */
const seedInviteSendTarget = async (
  seed: Seeder,
  existingStatus: 'pending' | 'rejected',
) => {
  const leader = await seed.createUser('E2E 초대 발신자')
  const target = await seed.createUser('E2E 검색 대상자')
  const title = seed.unique('E2E 초대 보내기 엔빵')
  const nbread = await seed.createNbread({
    leaderId: leader.id,
    title,
    amount: 30000,
    participantCount: 3,
    paymentDate: 10,
  })

  await seed.addParticipant(nbread.id, leader.id, true)
  await seed.createInvite(nbread.id, target.id, existingStatus)

  return { leader, target, nbread }
}

test.describe('초대 응답 자격 검증', () => {
  // INVITE-ACCESS-001
  // `nbread_invite`의 SELECT RLS 정책이 `authenticated` 역할에만 열려 있어
  // (supabase/migrations/20260814100000_baseline_schema.sql:1339 "Authenticated users can select"),
  // 세션이 없는 브라우저는 초대가 실제로 있어도 조회 결과가 항상 비어 로그인 안내 대신
  // "초대 정보를 찾을 수 없어요." 화면으로 빠진다. 실제 동작으로 재현할 수 없어 자동화를 보류한다.
  // RLS 정책 변경은 이 PR의 범위 밖이라 별도 확인이 필요하다.
  test.fixme(
    '비로그인 사용자는 초대에 응답하기 전에 로그인 안내를 받는다',
    async ({ page, seed }) => {
      const { inviteToken } = await seedPendingInvite(seed)

      // 세션을 주입하지 않고 접속해 비로그인 상태를 유지한다.
      await page.goto(`/invite/${inviteToken}`)

      await expect(page.getByText('로그인이 필요해요.')).toBeVisible()
      await page.getByRole('button', { name: '로그인하러 가기' }).click()

      await expect(page).toHaveURL(
        `/login?redirect=%2Finvite%2F${inviteToken}`,
      )

      const invite = await seed.getInvite(inviteToken)
      expect(invite?.status).toBe('pending')
    },
  )

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

  // INVITE-DETAIL-002
  test('존재하지 않는 초대 링크에서는 찾을 수 없다는 안내가 보인다', async ({
    page,
  }) => {
    await page.goto('/invite/e2e-nonexistent-invite-token')

    await expect(
      page.getByRole('heading', { name: '초대 정보를 찾을 수 없어요.' }),
    ).toBeVisible()
    await expect(
      page.getByText('초대 링크가 올바른지 확인해 주세요.'),
    ).toBeVisible()

    await page.getByRole('button', { name: '홈으로 가기' }).click()
    await expect(page).toHaveURL('/')
  })

  // INVITE-DETAIL-003
  test('이미 수락한 초대 링크에서는 참여 중인 엔빵으로 이동할 수 있다', async ({
    page,
    seed,
  }) => {
    const { target, nbread, inviteToken } = await seedCompletedInvite(
      seed,
      'accepted',
    )
    await applySession(page, await createSession(target))

    await page.goto(`/invite/${inviteToken}`)

    await expect(
      page.getByRole('heading', { name: '이미 수락한 초대예요.' }),
    ).toBeVisible()
    await expect(
      page.getByText('참여 중인 엔빵을 확인해 주세요.'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '초대 수락하기' }),
    ).not.toBeVisible()

    await page.getByRole('button', { name: '엔빵 확인하기' }).click()
    await expect(page).toHaveURL(`/nbread/${nbread.id}`)
  })

  // INVITE-DETAIL-004
  test('이미 거절한 초대 링크에서는 홈으로 이동할 수 있다', async ({
    page,
    seed,
  }) => {
    const { target, inviteToken } = await seedCompletedInvite(seed, 'rejected')
    await applySession(page, await createSession(target))

    await page.goto(`/invite/${inviteToken}`)

    await expect(
      page.getByRole('heading', { name: '이미 거절한 초대예요.' }),
    ).toBeVisible()
    await expect(
      page.getByText('이 초대는 다시 수락할 수 없어요.'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '초대 수락하기' }),
    ).not.toBeVisible()

    await page.getByRole('button', { name: '홈으로 가기' }).click()
    await expect(page).toHaveURL('/')
  })

  // INVITE-DETAIL-005
  test('만료된 초대 링크에서는 다시 초대를 요청하라는 안내가 보인다', async ({
    page,
    seed,
  }) => {
    const { target, inviteToken } = await seedCompletedInvite(seed, 'expired')
    await applySession(page, await createSession(target))

    await page.goto(`/invite/${inviteToken}`)

    await expect(
      page.getByRole('heading', { name: '이미 만료된 초대예요.' }),
    ).toBeVisible()
    await expect(
      page.getByText('방장에게 다시 초대를 요청해주세요.'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '초대 수락하기' }),
    ).not.toBeVisible()

    await page.getByRole('button', { name: '홈으로 가기' }).click()
    await expect(page).toHaveURL('/')
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

  // INVITE-RESPOND-004
  test('초대 대상자가 거절하면 같은 초대를 다시 수락할 수 없다', async ({
    page,
    seed,
  }) => {
    const { target, nbread, inviteToken } = await seedPendingInvite(seed)
    await applySession(page, await createSession(target))

    await page.goto(`/invite/${inviteToken}`)
    // 응답 확인 모달에도 같은 이름의 버튼이 있어 화면에 보이는 쪽만 남긴다.
    await page
      .getByRole('button', { name: '거절하기', exact: true })
      .filter({ visible: true })
      .click()

    const rejectModal = page
      .getByTestId('invite-response-modal')
      .filter({ visible: true })
    await rejectModal
      .getByRole('button', { name: '거절하기', exact: true })
      .click()

    await expect(toastMessage(page, '엔빵 초대를 거절했어요.')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '이미 거절한 초대예요.' }),
    ).toBeVisible()
    await expect(
      page.getByText('이 초대는 다시 수락할 수 없어요.'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '초대 수락하기' }),
    ).not.toBeVisible()

    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('rejected')

    const participants = await seed.getParticipants(nbread.id, target.id)
    expect(participants).toHaveLength(0)
  })
})

test.describe('초대 보내기', () => {
  // INVITE-SEND-001
  test('대기 중이거나 수락된 초대가 있으면 중복 초대가 생기지 않는다', async ({
    page,
    seed,
  }) => {
    const { leader, target, nbread } = await seedInviteSendTarget(
      seed,
      'pending',
    )
    await applySession(page, await createSession(leader))

    // 클릭이 실제로 초대 생성 요청을 보내는지는 DB 상태만으로 확정할 수 없다.
    // 조회 시점이 요청보다 앞서면 통과해버리므로 요청 자체를 가로채 센다.
    let insertCount = 0
    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/nbread_invite'),
      async (route) => {
        if (route.request().method() === 'POST') insertCount += 1
        await route.continue()
      },
    )

    await page.goto(`/nbread/${nbread.id}`)
    await page.getByText('친구 추가하기').first().click()
    await page.getByPlaceholder('태그로 검색하기').fill(target.tag)

    await expect(page.getByText(target.name, { exact: true })).toBeVisible()
    await expect(page.getByText('초대 완료', { exact: true })).toBeVisible()

    await page.getByText('초대 완료', { exact: true }).click()

    // '초대 완료' 항목은 클릭해도 상태 전이가 없어 UI만으로는 정착점을 못 잡는다.
    // 요청이 늦게 나가는 경우까지 잡을 수 있도록 네트워크가 잠잠해질 때까지 기다린 뒤 센다.
    await expect(page.getByText('초대 완료', { exact: true })).toBeVisible()
    await page.waitForLoadState('networkidle')

    expect(insertCount).toBe(0)

    const invites = await seed.getInvitesForTarget(nbread.id, target.id)
    expect(invites).toHaveLength(1)
    expect(invites[0].status).toBe('pending')
  })

  // INVITE-SEND-002
  test('거절된 초대 뒤에는 새 초대를 보낼 수 있다', async ({ page, seed }) => {
    const { leader, target, nbread } = await seedInviteSendTarget(
      seed,
      'rejected',
    )
    await applySession(page, await createSession(leader))

    await page.goto(`/nbread/${nbread.id}`)
    await page.getByText('친구 추가하기').first().click()
    await page.getByPlaceholder('태그로 검색하기').fill(target.tag)

    await expect(page.getByText(target.name, { exact: true })).toBeVisible()
    await expect(page.getByText('초대 하기', { exact: true })).toBeVisible()

    await page.getByText('초대 하기', { exact: true }).click()

    await expect(page.getByText('요청 완료', { exact: true })).toBeVisible()

    const invites = await seed.getInvitesForTarget(nbread.id, target.id)
    expect(invites).toHaveLength(2)
    expect(
      invites.filter((invite) => invite.status === 'rejected'),
    ).toHaveLength(1)
    expect(
      invites.filter((invite) => invite.status === 'pending'),
    ).toHaveLength(1)
  })
})
