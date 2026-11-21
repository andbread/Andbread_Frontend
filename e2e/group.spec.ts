import type { Page } from '@playwright/test'
import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import {
  applySession,
  createFakeSession,
  createSession,
} from './fixtures/session'
import {
  myNbreadItem,
  nbreadField,
  participantCard,
  toastMessage,
} from './fixtures/ui'
import { failRequest } from './fixtures/net'

test.skip(!hasTestDatabase, testDatabaseSkipReason)

interface CreateFormInput {
  amount: number
  title: string
  participantCount: number
  paymentDate: number
}

/** 생성 폼의 입력 요소에는 label이 연결되어 있지 않아 placeholder와 형제 구조로 짚는다. */
const fillCreateForm = async (page: Page, input: CreateFormInput) => {
  await page.getByPlaceholder('총 금액을 입력하세요').fill(String(input.amount))
  await page.getByPlaceholder('타이틀을 입력해주세요').fill(input.title)
  await nbreadField(page, 'participant-count').selectOption(
    String(input.participantCount),
  )
  await page.getByText('매월', { exact: true }).click()
  await nbreadField(page, 'payment-date').selectOption(
    String(input.paymentDate),
  )
}

test.describe('그룹 생성', () => {
  // GROUP-CREATE-001
  test('필수 정보를 입력하면 그룹 미리보기로 이동한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    await applySession(page, await createSession(user))

    await page.goto('/nbread/create')
    await fillCreateForm(page, {
      amount: 12000,
      title: '테스트 구독',
      participantCount: 3,
      paymentDate: 15,
    })
    await page.getByRole('button', { name: '저장하기' }).click()

    await expect(page).toHaveURL('/nbread/preview')
    await expect(
      page.getByRole('heading', { name: '테스트 구독' }),
    ).toBeVisible()
    await expect(nbreadField(page, 'amount')).toHaveText('12,000원')
    await expect(nbreadField(page, 'participant-count')).toHaveText('3명')
    await expect(nbreadField(page, 'payment-amount')).toHaveText('4,000원')
    await expect(nbreadField(page, 'payment-date')).toHaveText('매월 15일')
    await expect(participantCard(page, user.name)).toBeVisible()
  })

  // GROUP-CREATE-003
  test('금액과 인원을 바꾸면 나눈 금액이 반올림되어 갱신된다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    await applySession(page, await createSession(user))

    await page.goto('/nbread/create')
    await page.getByPlaceholder('총 금액을 입력하세요').fill('10000')
    await nbreadField(page, 'participant-count').selectOption('3')

    // 생성 폼은 Math.round를 쓰므로 10000 / 3은 3333이 된다.
    await expect(nbreadField(page, 'payment-amount')).toHaveValue('3333')
    await expect(nbreadField(page, 'payment-amount')).toBeDisabled()
  })

  // GROUP-CREATE-004
  test('미리보기에서 그룹을 만들면 홈으로 이동한다', async ({ page, seed }) => {
    const user = await seed.createUser()
    const title = seed.unique('E2E 그룹 생성')

    // 화면 조작으로 만들어질 엔빵이라 아이디를 미리 알 수 없으므로 제목으로 예약한다.
    seed.trackNbreadTitle(title)
    await applySession(page, await createSession(user))

    await page.goto('/nbread/create')
    await fillCreateForm(page, {
      amount: 24000,
      title,
      participantCount: 2,
      paymentDate: 20,
    })
    await page.getByRole('button', { name: '저장하기' }).click()

    await expect(page).toHaveURL('/nbread/preview')
    await page.getByRole('button', { name: '엔빵 만들기' }).click()

    await expect(page).toHaveURL('/home')
    await expect(myNbreadItem(page, title)).toBeVisible()

    const created = await seed.findNbreadByTitle(title)
    expect(created).not.toBeNull()

    const participants = await seed.getParticipants(created!.id)
    expect(participants).toHaveLength(1)
    expect(participants[0].user_id).toBe(user.id)
    expect(participants[0].is_leader).toBe(true)
  })

  // GROUP-CREATE-005
  test('그룹 저장 요청이 실패하면 생성 화면으로 돌아간다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    const title = seed.unique('E2E 저장 실패 구독')

    // nbread INSERT 정책은 authenticated이면서 leader_id = auth.uid()인 요청만
    // 허용한다. 가짜 세션(storage: {})은 요청을 anon으로 보내 mock이 걸리지
    // 않아도 RLS가 거절해 같은 토스트가 뜨므로, mock이 실제로 실행됐는지
    // 구분하지 못한다. 실제 로그인을 써야 mock이 깨졌을 때 INSERT가 성공해
    // 테스트가 실패한다. mock이 깨지면 그룹이 실제로 생성될 수 있으므로
    // 제목을 미리 예약해 cleanup이 찾아 지우게 한다.
    seed.trackNbreadTitle(title)
    await applySession(page, await createSession(user))

    await failRequest(page, '/rest/v1/nbread', 'POST')

    await page.goto('/nbread/create')
    await fillCreateForm(page, {
      amount: 18000,
      title,
      participantCount: 2,
      paymentDate: 9,
    })
    await page.getByRole('button', { name: '저장하기' }).click()

    await expect(page).toHaveURL('/nbread/preview')
    await page.getByRole('button', { name: '엔빵 만들기' }).click()

    await expect(
      toastMessage(page, '엔빵 만들기에 실패했어요. 다시 시도해주세요.'),
    ).toBeVisible()
    await expect(page).toHaveURL('/nbread/create')
  })

  // GROUP-CREATE-006
  test('생성 초안 없이 미리보기에 접근하면 생성 화면으로 돌아간다', async ({
    page,
  }) => {
    // 생성 초안은 새로고침에도 남지 않는 순수 클라이언트 상태(Zustand, 미영속)이므로
    // 이 페이지로 직접 진입하기만 해도 초안 없음 상태가 재현된다.
    await applySession(page, createFakeSession())

    await page.goto('/nbread/preview')

    await expect(
      toastMessage(page, '먼저 엔빵 폼을 작성해주세요.'),
    ).toBeVisible()
    await expect(page).toHaveURL('/nbread/create')
  })
})

test.describe('홈 그룹 조회와 상세 진입', () => {
  // GROUP-HOME-003
  test('홈의 그룹 카드를 누르면 그룹 정보 탭으로 진입한다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    const title = seed.unique('E2E 상세 진입 그룹')
    const nbread = await seed.createNbread({
      leaderId: user.id,
      title,
      amount: 30000,
      participantCount: 3,
      paymentDate: 10,
    })
    await seed.addParticipant(nbread.id, user.id, true)
    await applySession(page, await createSession(user))

    await page.goto('/home')
    await myNbreadItem(page, title).click()

    await expect(page).toHaveURL(`/nbread/${nbread.id}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText('엔빵 정보', { exact: true })).toBeVisible()
    await expect(page.getByText('게시판', { exact: true })).toBeVisible()
    await expect(page.getByText('채팅방', { exact: true })).toBeVisible()

    await expect(nbreadField(page, 'amount')).toHaveText('30,000원')
    await expect(nbreadField(page, 'participant-count')).toHaveText('3명')
    await expect(nbreadField(page, 'payment-amount')).toHaveText('10,000원')
    await expect(nbreadField(page, 'payment-date')).toHaveText('매월 10일')
    await expect(participantCard(page, user.name)).toBeVisible()
  })
})

test.describe('참여자 권한과 그룹 탈퇴', () => {
  // GROUP-MEMBER-001
  test('일반 참여자는 그룹을 수정할 수 없고 나가기만 선택할 수 있다', async ({
    page,
    seed,
  }) => {
    const leader = await seed.createUser('E2E 그룹장')
    const member = await seed.createUser('E2E 참여자')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title: seed.unique('E2E 권한 그룹'),
      amount: 20000,
      participantCount: 2,
      paymentDate: 5,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await seed.addParticipant(nbread.id, member.id, false)
    await applySession(page, await createSession(member))

    await page.goto(`/nbread/${nbread.id}`)

    await expect(
      page.getByRole('button', { name: '엔빵 나가기' }),
    ).toBeVisible()
    await expect(page.getByText('수정하기', { exact: true })).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: '엔빵 삭제하기' }),
    ).not.toBeVisible()
  })

  // GROUP-MEMBER-002
  test('일반 참여자는 그룹에서 나간 뒤 홈으로 이동한다', async ({
    page,
    seed,
  }) => {
    const leader = await seed.createUser('E2E 그룹장')
    const member = await seed.createUser('E2E 참여자')
    const title = seed.unique('E2E 탈퇴 그룹')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title,
      amount: 20000,
      participantCount: 2,
      paymentDate: 5,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await seed.addParticipant(nbread.id, member.id, false)
    await applySession(page, await createSession(member))

    await page.goto(`/nbread/${nbread.id}`)
    await page.getByRole('button', { name: '엔빵 나가기' }).click()
    await page.getByRole('button', { name: '나가기', exact: true }).click()

    await expect(toastMessage(page, '엔빵 나가기에 성공했어요.')).toBeVisible()
    await expect(page).toHaveURL('/home')
    await expect(myNbreadItem(page, title)).not.toBeVisible()

    const participants = await seed.getParticipants(nbread.id)
    expect(participants).toHaveLength(1)
    expect(participants[0].user_id).toBe(leader.id)
  })
})
