import type { Page } from '@playwright/test'
import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import {
  applySession,
  createFakeSession,
  createSession,
} from './fixtures/session'
import {
  monthlyNbreadEmptyState,
  monthlyNbreadItem,
  myNbreadItem,
  nbreadField,
  participantCard,
  toastMessage,
} from './fixtures/ui'

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

  // GROUP-CREATE-002
  test('필수 입력값이 없으면 저장하기 버튼을 누를 수 없다', async ({
    page,
  }) => {
    // 폼 검증만 확인하고 백엔드 데이터를 읽거나 쓰지 않으므로 실제 Supabase 로그인 없이
    // 보호 경로 통과에만 필요한 가짜 세션을 주입한다.
    await applySession(page, createFakeSession())

    await page.goto('/nbread/create')
    const submitButton = page.getByRole('button', { name: '저장하기' })

    // 총 금액과 타이틀이 모두 빈 경우
    await expect(submitButton).toBeDisabled()

    // 총 금액만 입력한 경우
    await page.getByPlaceholder('총 금액을 입력하세요').fill('12000')
    await expect(submitButton).toBeDisabled()

    // 총 금액을 지우고 타이틀만 입력한 경우
    await page.getByPlaceholder('총 금액을 입력하세요').fill('')
    await page.getByPlaceholder('타이틀을 입력해주세요').fill('테스트 구독')
    await expect(submitButton).toBeDisabled()

    await expect(page).toHaveURL('/nbread/create')
  })

  // GROUP-CREATE-005
  test('그룹 저장 요청이 실패하면 생성 화면으로 돌아간다', async ({
    page,
  }) => {
    // 미리보기는 화면 조작으로 만든 클라이언트 상태만 읽고, 실패시키려는 요청도
    // 네트워크 계층에서 대체하므로 실제 Supabase 로그인 없이 가짜 세션으로 충분하다.
    await applySession(page, createFakeSession())

    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/nbread'),
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue()
          return
        }

        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'E2E forced nbread insert failure',
          }),
        })
      },
    )

    await page.goto('/nbread/create')
    await fillCreateForm(page, {
      amount: 18000,
      title: '테스트 저장 실패 구독',
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

    await expect(toastMessage(page, '먼저 엔빵 폼을 작성해주세요.')).toBeVisible()
    await expect(page).toHaveURL('/nbread/create')
  })
})

test.describe('그룹 삭제', () => {
  // GROUP-DELETE-001
  test('그룹장은 편집 화면에서 그룹을 삭제하고 홈으로 이동한다', async ({
    page,
    seed,
  }) => {
    const leader = await seed.createUser('E2E 그룹장')
    const title = seed.unique('E2E 삭제 그룹')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title,
      amount: 15000,
      participantCount: 1,
      paymentDate: 7,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await applySession(page, await createSession(leader))

    await page.goto(`/nbread/${nbread.id}`)
    await page.getByText('수정하기', { exact: true }).click()
    await page.getByRole('button', { name: '엔빵 삭제하기' }).click()
    await page
      .getByRole('button', { name: '삭제하기', exact: true })
      .click()

    await expect(toastMessage(page, '엔빵이 삭제되었어요.')).toBeVisible()
    await expect(page).toHaveURL('/home')
    await expect(myNbreadItem(page, title)).not.toBeVisible()

    // nbread 삭제는 DB의 ON DELETE CASCADE로 participant, nbread_records,
    // nbread_invite를 함께 지우므로 cleanup은 이미 없는 행을 다시 지우는 셈이라 안전하다.
    const deleted = await seed.findNbreadByTitle(title)
    expect(deleted).toBeNull()
  })

  // GROUP-DELETE-002
  test('그룹 삭제 요청이 실패하면 상세 화면에 머문다', async ({
    page,
    seed,
  }) => {
    const leader = await seed.createUser('E2E 그룹장')
    const title = seed.unique('E2E 삭제 실패 그룹')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title,
      amount: 15000,
      participantCount: 1,
      paymentDate: 7,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await applySession(page, await createSession(leader))

    // 조회는 그대로 두고 그룹 삭제 요청만 실패로 만든다.
    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/nbread'),
      async (route) => {
        if (route.request().method() !== 'DELETE') {
          await route.continue()
          return
        }

        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'E2E forced nbread delete failure',
          }),
        })
      },
    )

    await page.goto(`/nbread/${nbread.id}`)
    await page.getByText('수정하기', { exact: true }).click()
    await page.getByRole('button', { name: '엔빵 삭제하기' }).click()
    await page
      .getByRole('button', { name: '삭제하기', exact: true })
      .click()

    await expect(
      toastMessage(page, '엔빵 삭제에 실패했어요. 다시 시도해주세요.'),
    ).toBeVisible()
    await expect(page).toHaveURL(`/nbread/${nbread.id}`)

    const stillExists = await seed.findNbreadByTitle(title)
    expect(stillExists).not.toBeNull()
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

  // GROUP-HOME-001
  test('홈은 이번 달 그룹과 전체 참여 그룹을 구분해 보여준다', async ({
    page,
    seed,
  }) => {
    const user = await seed.createUser()
    // 현재 월은 브라우저의 new Date() 기준이므로 테스트 실행 시점에 맞춰 결제월을 만든다.
    const currentMonth = new Date().getMonth() + 1
    const otherMonth = currentMonth === 12 ? 1 : currentMonth + 1

    const monthlyTitle = seed.unique('E2E 매월 그룹')
    const currentYearTitle = seed.unique('E2E 이번달 매년 그룹')
    const otherYearTitle = seed.unique('E2E 다른달 매년 그룹')

    const monthlyNbread = await seed.createNbread({
      leaderId: user.id,
      title: monthlyTitle,
      amount: 10000,
      participantCount: 3,
      paymentDate: 10,
    })
    const currentYearNbread = await seed.createNbread({
      leaderId: user.id,
      title: currentYearTitle,
      amount: 12000,
      participantCount: 2,
      paymentDate: 10,
      paymentPeriod: 'year',
      paymentMonth: currentMonth,
    })
    const otherYearNbread = await seed.createNbread({
      leaderId: user.id,
      title: otherYearTitle,
      amount: 24000,
      participantCount: 4,
      paymentDate: 10,
      paymentPeriod: 'year',
      paymentMonth: otherMonth,
    })

    await seed.addParticipant(monthlyNbread.id, user.id, true)
    await seed.addParticipant(currentYearNbread.id, user.id, true)
    await seed.addParticipant(otherYearNbread.id, user.id, true)
    await applySession(page, await createSession(user))

    await page.goto('/home')
    await expect(
      page.getByRole('heading', { name: '나의 엔빵' }),
    ).toBeVisible()

    await expect(monthlyNbreadItem(page, monthlyTitle)).toBeVisible()
    await expect(monthlyNbreadItem(page, currentYearTitle)).toBeVisible()
    await expect(monthlyNbreadItem(page, otherYearTitle)).not.toBeVisible()

    await expect(myNbreadItem(page, monthlyTitle)).toBeVisible()
    await expect(myNbreadItem(page, currentYearTitle)).toBeVisible()
    await expect(myNbreadItem(page, otherYearTitle)).toBeVisible()
    await expect(page.getByText('3개', { exact: true })).toBeVisible()

    // 이번 달 엔빵 목록(매월 그룹 + 이번 달 매년 그룹)의 1인당 금액 합만 반영한다.
    const expectedTotal = Math.floor(10000 / 3) + Math.floor(12000 / 2)
    await expect(
      page.getByText(`${expectedTotal.toLocaleString()}원`, { exact: true }),
    ).toBeVisible()
  })

  // GROUP-HOME-002
  test('참여 중인 그룹이 없으면 빈 상태와 추가 동선을 보여준다', async ({
    page,
    seed,
  }) => {
    // 참여 이력이 없는 사용자라 대기 중 초대도 없으므로 초대 배너와는 섞이지 않는다.
    const user = await seed.createUser()
    await applySession(page, await createSession(user))

    await page.goto('/home')

    await expect(monthlyNbreadEmptyState(page)).toBeVisible()
    await expect(
      page.getByText('엔빵을 추가해보세요!', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText(/^\d+개$/)).toHaveCount(0)

    await page.getByText('엔빵 추가하기', { exact: true }).click()

    await expect(page).toHaveURL('/nbread/create')
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

    await expect(
      toastMessage(page, '엔빵 나가기에 성공했어요.'),
    ).toBeVisible()
    await expect(page).toHaveURL('/home')
    await expect(myNbreadItem(page, title)).not.toBeVisible()

    const participants = await seed.getParticipants(nbread.id)
    expect(participants).toHaveLength(1)
    expect(participants[0].user_id).toBe(leader.id)
  })
})
