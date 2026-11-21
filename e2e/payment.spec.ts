import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import { applySession, createSession } from './fixtures/session'
import {
  participantCheckbox,
  participantCheckboxLabel,
  toastMessage,
} from './fixtures/ui'
import { shiftMonths, type Seeder, type TestUser } from './fixtures/seed'
import { failRequest } from './fixtures/net'

test.skip(!hasTestDatabase, testDatabaseSkipReason)

const UPDATE_SUCCESS_MESSAGE = '완료 여부가 업데이트되었어요.'
const UPDATE_FAILURE_MESSAGE =
  '완료 여부 업데이트에 실패했어요. 다시 시도해주세요.'

/**
 * 그룹장과 참여자를 만들고 그룹에 넣는다.
 * participant 삽입 트리거가 그룹의 start_date 기준 미납 기록을 함께 만든다.
 */
const seedSettlementGroup = async (
  seed: Seeder,
  memberNames: string[] = [],
  // 참여자 목록은 participant_count만큼만 그려지므로 나중에 참여자를 더 넣을 때 늘려 잡는다.
  participantCount = memberNames.length + 1,
) => {
  const leader = await seed.createUser('E2E 그룹장')
  const members: TestUser[] = []

  for (const name of memberNames) {
    members.push(await seed.createUser(name))
  }

  const nbread = await seed.createNbread({
    leaderId: leader.id,
    title: seed.unique('E2E 정산 그룹'),
    amount: 30000,
    participantCount,
    paymentDate: 8,
  })

  await seed.addParticipant(nbread.id, leader.id, true)

  for (const member of members) {
    await seed.addParticipant(nbread.id, member.id, false)
  }

  return { leader, members, nbread, startDate: nbread.start_date! }
}

test.describe('납부 상태 변경', () => {
  // SETTLE-TOGGLE-001
  test('그룹장이 참여자의 납부 상태를 완료로 변경한다', async ({
    page,
    seed,
  }) => {
    const { leader, members, nbread, startDate } = await seedSettlementGroup(
      seed,
      ['E2E 참여자'],
    )
    const member = members[0]
    await applySession(page, await createSession(leader))

    await page.goto(`/nbread/${nbread.id}`)
    await expect(participantCheckbox(page, member.name)).not.toBeChecked()

    await participantCheckboxLabel(page, member.name).click()

    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toBeVisible()
    await expect(participantCheckbox(page, member.name)).toBeChecked()

    const records = await seed.getRecords(nbread.id, member.id)
    const currentRecord = records.find(
      (record) => record.payment_date === startDate,
    )
    expect(currentRecord?.is_paid).toBe(true)
  })

  // SETTLE-TOGGLE-002
  test('일반 참여자가 자신의 납부 상태를 완료로 변경한다', async ({
    page,
    seed,
  }) => {
    const { leader, members, nbread, startDate } = await seedSettlementGroup(
      seed,
      ['E2E 참여자'],
    )
    const member = members[0]
    await applySession(page, await createSession(member))

    await page.goto(`/nbread/${nbread.id}`)
    await expect(participantCheckbox(page, member.name)).toBeEnabled()

    await participantCheckboxLabel(page, member.name).click()

    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toBeVisible()
    await expect(participantCheckbox(page, member.name)).toBeChecked()

    const memberRecords = await seed.getRecords(nbread.id, member.id)
    expect(
      memberRecords.find((record) => record.payment_date === startDate)
        ?.is_paid,
    ).toBe(true)

    const leaderRecords = await seed.getRecords(nbread.id, leader.id)
    expect(
      leaderRecords.find((record) => record.payment_date === startDate)
        ?.is_paid,
    ).toBe(false)
  })

  // SETTLE-TOGGLE-003
  test('완료된 납부 상태를 다시 미납으로 변경한다', async ({ page, seed }) => {
    const { leader, members, nbread, startDate } = await seedSettlementGroup(
      seed,
      ['E2E 참여자'],
    )
    const member = members[0]
    await seed.upsertRecord(nbread.id, member.id, startDate, true)
    await applySession(page, await createSession(leader))

    await page.goto(`/nbread/${nbread.id}`)
    await expect(participantCheckbox(page, member.name)).toBeChecked()

    await participantCheckboxLabel(page, member.name).click()

    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toBeVisible()
    await expect(participantCheckbox(page, member.name)).not.toBeChecked()

    const records = await seed.getRecords(nbread.id, member.id)
    const currentRecord = records.find(
      (record) => record.payment_date === startDate,
    )
    expect(currentRecord?.is_paid).toBe(false)
  })

  // SETTLE-TOGGLE-004
  test('일반 참여자는 다른 참여자의 납부 상태를 변경할 수 없다', async ({
    page,
    seed,
  }) => {
    const { leader, members, nbread, startDate } = await seedSettlementGroup(
      seed,
      ['E2E 참여자', 'E2E 다른 참여자'],
    )
    const [member, otherMember] = members
    await applySession(page, await createSession(member))

    await page.goto(`/nbread/${nbread.id}`)

    await expect(participantCheckbox(page, member.name)).toBeEnabled()
    await expect(participantCheckbox(page, leader.name)).toBeDisabled()
    await expect(participantCheckbox(page, otherMember.name)).toBeDisabled()

    for (const user of [leader, otherMember]) {
      const records = await seed.getRecords(nbread.id, user.id)
      expect(
        records.find((record) => record.payment_date === startDate)?.is_paid,
      ).toBe(false)
    }
  })
})

test.describe('정산 기간 기록 조회', () => {
  // SETTLE-PERIOD-001
  test('현재 정산 기간의 납부 기록만 참여자 목록에 반영된다', async ({
    page,
    seed,
  }) => {
    const { leader, nbread, startDate } = await seedSettlementGroup(seed)

    // 이전 기간은 완료, 현재 기간은 미납으로 두어 두 기록이 섞이는지 본다.
    await seed.upsertRecord(
      nbread.id,
      leader.id,
      shiftMonths(startDate, -1),
      true,
    )
    await seed.upsertRecord(nbread.id, leader.id, startDate, false)
    await applySession(page, await createSession(leader))

    await page.goto(`/nbread/${nbread.id}`)

    // 체크박스 input은 CSS로 숨겨져 있어 렌더 완료는 감싸는 label로 기다린다.
    await expect(participantCheckboxLabel(page, leader.name)).toBeVisible()
    await expect(participantCheckbox(page, leader.name)).not.toBeChecked()
  })

  // SETTLE-PERIOD-002
  test('새 참여자가 추가되면 그룹 시작일 기준의 미납 기록이 한 건 생성된다', async ({
    page,
    seed,
  }) => {
    const { nbread, startDate } = await seedSettlementGroup(seed, [], 2)
    const newMember = await seed.createUser('E2E 새 참여자')

    // 트리거를 통과시키려고 화면이 아니라 helper로 참여자를 넣는다.
    await seed.addParticipant(nbread.id, newMember.id, false)

    const records = await seed.getRecords(nbread.id, newMember.id)
    expect(records).toHaveLength(1)
    expect(records[0].payment_date).toBe(startDate)
    expect(records[0].is_paid).toBe(false)

    await applySession(page, await createSession(newMember))
    await page.goto(`/nbread/${nbread.id}`)

    await expect(participantCheckboxLabel(page, newMember.name)).toBeVisible()
    await expect(participantCheckbox(page, newMember.name)).not.toBeChecked()
  })
})

test.describe('납부 상태 저장 처리', () => {
  // SETTLE-UPDATE-001
  test('납부 체크박스를 연속으로 선택해도 갱신 요청은 한 번만 전송된다', async ({
    page,
    seed,
  }) => {
    const { leader, members, nbread, startDate } = await seedSettlementGroup(
      seed,
      ['E2E 참여자'],
    )
    const member = members[0]
    await applySession(page, await createSession(leader))

    const pageErrors: Error[] = []
    page.on('pageerror', (error) => pageErrors.push(error))

    let patchCount = 0
    let releasePatch = () => {}
    const heldPatch = new Promise<void>((resolve) => {
      releasePatch = resolve
    })

    // 첫 갱신 요청 응답을 붙잡아 두고, 그 사이 연속 클릭이 요청을 더 보내는지 센다.
    // 조회는 그대로 두고 갱신 요청만 가로채므로 seed 데이터와 실제 로그인을 그대로 쓴다.
    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/nbread_records'),
      async (route) => {
        if (route.request().method() !== 'PATCH') {
          await route.continue()
          return
        }

        patchCount += 1
        await heldPatch
        await route.continue()
      },
    )

    await page.goto(`/nbread/${nbread.id}`)
    const label = participantCheckboxLabel(page, member.name)
    const checkbox = participantCheckbox(page, member.name)
    await expect(checkbox).not.toBeChecked()

    await label.click()

    // 요청이 진행되는 동안에는 체크박스가 비활성화되어 막혀 있다는 것이 화면에 보여야 한다.
    await expect(checkbox).toBeDisabled()

    // Playwright는 label 클릭 시 연결된 input이 활성화될 때까지 기다리므로,
    // 비활성 상태에서 사용자가 누르는 상황은 force로 재현한다.
    await label.click({ force: true })
    await label.click({ force: true })

    releasePatch()

    // 연속 클릭이 요청을 만들었다면 첫 응답이 돌아오기 전에 이미 route 핸들러에 닿는다.
    // 따라서 응답 완료(토스트와 활성화 복귀)를 기다린 뒤 세면 고정 대기 없이 확인할 수 있다.
    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toBeVisible()
    await expect(checkbox).toBeEnabled()
    await expect(checkbox).toBeChecked()
    expect(patchCount).toBe(1)

    // 잠금은 요청이 끝나면 풀린다. 성공 직후 다시 누르면 곧바로 미납으로 되돌릴 수 있다.
    await label.click()

    await expect.poll(() => patchCount).toBe(2)
    await expect(checkbox).not.toBeChecked()
    await expect(checkbox).toBeEnabled()

    const records = await seed.getRecords(nbread.id, member.id)
    expect(
      records.find((record) => record.payment_date === startDate)?.is_paid,
    ).toBe(false)
    expect(pageErrors).toEqual([])
  })

  // SETTLE-UPDATE-002
  test('납부 상태 저장에 실패하면 화면 상태를 유지하고 다시 시도할 수 있다', async ({
    page,
    seed,
  }) => {
    const { leader, members, nbread, startDate } = await seedSettlementGroup(
      seed,
      ['E2E 참여자'],
    )
    const member = members[0]
    await applySession(page, await createSession(leader))

    const pageErrors: Error[] = []
    page.on('pageerror', (error) => pageErrors.push(error))

    let patchCount = 0
    page.on('request', (request) => {
      if (
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname.endsWith('/rest/v1/nbread_records')
      ) {
        patchCount += 1
      }
    })

    // 조회는 그대로 두고 첫 갱신 요청만 실패로 만든다. 두 번째 요청은 실제 DB로 간다.
    await failRequest(page, '/rest/v1/nbread_records', 'PATCH', { times: 1 })

    await page.goto(`/nbread/${nbread.id}`)
    const label = participantCheckboxLabel(page, member.name)
    const checkbox = participantCheckbox(page, member.name)
    await expect(checkbox).not.toBeChecked()

    await label.click()

    await expect(toastMessage(page, UPDATE_FAILURE_MESSAGE)).toBeVisible()
    await expect(checkbox).not.toBeChecked()
    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toHaveCount(0)
    expect(patchCount).toBe(1)

    // 실패 후에는 잠금이 풀려 있어야 한다. 다시 누르면 두 번째 요청이 나가야 한다.
    await expect(checkbox).toBeEnabled()
    await label.click()

    await expect.poll(() => patchCount).toBe(2)
    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toBeVisible()
    await expect(checkbox).toBeChecked()

    const records = await seed.getRecords(nbread.id, member.id)
    expect(
      records.find((record) => record.payment_date === startDate)?.is_paid,
    ).toBe(true)

    // 실패한 요청이 UI 핸들러 밖으로 처리되지 않은 rejection을 남기지 않아야 한다.
    expect(pageErrors).toEqual([])
  })
})
