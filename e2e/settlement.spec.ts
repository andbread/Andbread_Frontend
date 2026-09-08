import { expect, test } from './fixtures/test'
import { hasTestDatabase, testDatabaseSkipReason } from './fixtures/env'
import { applySession, createSession } from './fixtures/session'
import {
  participantCheckbox,
  participantCheckboxLabel,
  toastMessage,
} from './fixtures/ui'
import { shiftMonths, type Seeder, type TestUser } from './fixtures/seed'

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
    const { leader, members, nbread } = await seedSettlementGroup(seed, [
      'E2E 참여자',
    ])
    const member = members[0]
    await applySession(page, await createSession(leader))

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
    await expect(participantCheckbox(page, member.name)).not.toBeChecked()

    // 첫 클릭이 갱신 요청을 붙잡고 있는 동안 연달아 눌러도 요청이 더 나가지 않아야 한다.
    await label.click()
    await label.click()
    await label.click()

    releasePatch()

    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toBeVisible()
    expect(patchCount).toBe(1)

    // 여기까지는 요청이 진행 중인 동안의 잠금만 검증한다. 실제 가드는 두 겹이라
    // nbreadParticipantCard.tsx의 isThrottling이 응답 완료 후에도 3초 동안 유지된다.
    // 그 창 안에서 다시 누르면 두 번째 PATCH가 !isChecked를 보내 방금 완료로 바꾼
    // 상태가 미납으로 되돌아갈 수 있으므로 여기서 이어서 검증한다.
    // 3초 창에 기대는 구간이라 바로 위 토스트 확인 직후 곧바로 다시 클릭해 대기를
    // 넣지 않는다. waitForTimeout으로 3초를 흘려보내면 검증 방향이 반대가 된다.
    await label.click()

    // 지금 검증하려는 건 "두 번째 요청이 오지 않았다"는 부재이고, 폴링 어설션은
    // 참이 되기를 기다릴 뿐 이미 참(체크 유지)이면 그대로 통과해 버려 정착점이
    // 못 된다. click()도 change 이벤트를 보낸 뒤 곧장 반환하므로 아래 두 어설션이
    // 두 번째 PATCH가 route 핸들러에 닿기 전에 평가될 수 있다.
    // 부재는 폴링으로 확인할 수 없어 시간을 한정해 기다리는 수밖에 없다. 1초는
    // 3초 창의 1/3이라 창을 넘겨 스로틀이 풀리는 일 없이, 브라우저가 요청을 만들어
    // route 핸들러까지 보내기에는 충분하다(2026-09-01 정리 대상이던 고정 대기와
    // 달리 여기서는 대상이 상태 전이가 아니라 "요청 미발생"이라 고정 대기가 맞는
    // 도구다. 지우지 말 것 — llm-wiki/log.md 2026-09-01 항목 참고).
    await page.waitForTimeout(1000)

    expect(patchCount).toBe(1)
    await expect(participantCheckbox(page, member.name)).toBeChecked()

    // route.continue()로 실제 DB에 요청이 닿으므로, 쓰기가 정말 한 번만 반영됐는지 DB로도 확인한다.
    const records = await seed.getRecords(nbread.id, member.id)
    expect(records.filter((record) => record.is_paid)).toHaveLength(1)
  })

  // SETTLE-UPDATE-002
  test('납부 상태 저장에 실패하면 화면 상태를 유지하고 오류를 알린다', async ({
    page,
    seed,
  }) => {
    const { leader, members, nbread } = await seedSettlementGroup(seed, [
      'E2E 참여자',
    ])
    const member = members[0]
    await applySession(page, await createSession(leader))

    // 조회는 그대로 두고 정산 기록 갱신 요청만 실패로 만든다.
    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/nbread_records'),
      async (route) => {
        if (route.request().method() !== 'PATCH') {
          await route.continue()
          return
        }

        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'E2E forced nbread_records update failure',
          }),
        })
      },
    )

    // 카드가 갱신 실패를 다시 던져 브라우저에 처리되지 않은 거부가 남는다.
    // 던지는 값이 Error가 아니라 PostgrestError 객체라 pageerror에 메시지가 실리지 않으므로
    // 오류 내용 대신 사용자에게 보이는 결과만 검증한다.
    await page.goto(`/nbread/${nbread.id}`)
    await expect(participantCheckbox(page, member.name)).not.toBeChecked()

    await participantCheckboxLabel(page, member.name).click()

    await expect(toastMessage(page, UPDATE_FAILURE_MESSAGE)).toBeVisible()
    await expect(participantCheckbox(page, member.name)).not.toBeChecked()
    await expect(toastMessage(page, UPDATE_SUCCESS_MESSAGE)).toHaveCount(0)
  })
})
