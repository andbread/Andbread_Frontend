import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GET, PATCH } from '@/app/api/nbreads/[nbreadId]/records/route'
import type { NbreadRecord } from '@/types/nbread'
import { routeContext, routeRequest } from '../../../../../../e2e/fixtures/route'
import {
  Seeder,
  shiftMonths,
  type TestUser,
} from '../../../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../../../e2e/fixtures/session'

const recordsPath = (nbreadId: string) => `/api/nbreads/${nbreadId}/records`

describe('PATCH /api/nbreads/[nbreadId]/records', () => {
  const seed = new Seeder()
  let leader: TestUser
  let member: TestUser
  let otherMember: TestUser
  const tokens = new Map<string, string>()

  beforeAll(async () => {
    ;[leader, member, otherMember] = await Promise.all([
      seed.createUser('통합 그룹장'),
      seed.createUser('통합 참여자'),
      seed.createUser('통합 다른 참여자'),
    ])

    const signedIn = await Promise.all(
      [leader, member].map(
        async (user) => [user.id, await signInAccessToken(user)] as const,
      ),
    )
    for (const [id, token] of signedIn) tokens.set(id, token)
  })

  afterAll(async () => {
    await seed.cleanup()
  })

  /** participant 삽입 트리거가 start_date 기준 미납 기록을 참여자마다 하나씩 만든다. */
  const createGroup = async () => {
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title: seed.unique('통합 정산 그룹'),
      amount: 30000,
      participantCount: 3,
      paymentDate: 8,
    })

    await seed.addParticipant(nbread.id, leader.id, true)
    await seed.addParticipant(nbread.id, member.id, false)
    await seed.addParticipant(nbread.id, otherMember.id, false)

    return { nbreadId: nbread.id, startDate: nbread.start_date! }
  }

  const isPaidAt = async (
    nbreadId: string,
    userId: string,
    paymentDate: string,
  ) => {
    const records = await seed.getRecords(nbreadId, userId)
    return records.find((record) => record.payment_date === paymentDate)
      ?.is_paid
  }

  const patchRecord = (
    actor: TestUser,
    nbreadId: string,
    body: Record<string, unknown>,
  ) =>
    PATCH(
      routeRequest(recordsPath(nbreadId), {
        token: tokens.get(actor.id),
        method: 'PATCH',
        body,
      }),
      routeContext({ nbreadId }),
    )

  it('그룹장이 참여자의 납부 상태를 완료로 바꾸면 그 참여자의 현재 기간 기록만 완료가 된다', async () => {
    const { nbreadId, startDate } = await createGroup()

    const response = await patchRecord(leader, nbreadId, {
      userId: member.id,
      isPaid: true,
      startDate,
    })

    expect(response.status).toBe(204)
    expect(await isPaidAt(nbreadId, member.id, startDate)).toBe(true)
    expect(await isPaidAt(nbreadId, leader.id, startDate)).toBe(false)
    expect(await isPaidAt(nbreadId, otherMember.id, startDate)).toBe(false)
  })

  it('일반 참여자는 자기 납부 상태를 완료로 바꿀 수 있다', async () => {
    const { nbreadId, startDate } = await createGroup()

    const response = await patchRecord(member, nbreadId, {
      userId: member.id,
      isPaid: true,
      startDate,
    })

    expect(response.status).toBe(204)
    expect(await isPaidAt(nbreadId, member.id, startDate)).toBe(true)
  })

  it.each([
    ['기준일이 없으면', {}],
    ['기준일이 날짜가 아니면', { startDate: 'not-a-date' }],
  ])('%s 400을 반환하고 기록을 바꾸지 않는다', async (_label, dateField) => {
    const { nbreadId, startDate } = await createGroup()

    const response = await patchRecord(leader, nbreadId, {
      userId: member.id,
      isPaid: true,
      ...dateField,
    })

    expect(response.status).toBe(400)
    expect(await isPaidAt(nbreadId, member.id, startDate)).toBe(false)
  })

  it('시각이 붙은 기준일로 갱신해도 같은 날짜 키로 조회한 기록에 반영되고 이전 기간 기록은 그대로다', async () => {
    const { nbreadId, startDate } = await createGroup()
    const previousDate = shiftMonths(startDate, -1)
    await seed.upsertRecord(nbreadId, member.id, previousDate, false)

    const response = await patchRecord(member, nbreadId, {
      userId: member.id,
      isPaid: true,
      startDate: `${startDate}T12:00:00.000Z`,
    })
    expect(response.status).toBe(204)

    const listResponse = await GET(
      routeRequest(`${recordsPath(nbreadId)}?startDate=${startDate}`, {
        token: tokens.get(member.id),
      }),
      routeContext({ nbreadId }),
    )
    expect(listResponse.status).toBe(200)
    const { data } = (await listResponse.json()) as { data: NbreadRecord[] }

    expect(data.find((record) => record.userId === member.id)?.isPaid).toBe(
      true,
    )
    expect(await isPaidAt(nbreadId, member.id, previousDate)).toBe(false)
  })
})
