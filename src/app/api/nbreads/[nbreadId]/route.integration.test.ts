import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  DELETE as deleteNbread,
  PATCH as updateNbread,
} from '@/app/api/nbreads/[nbreadId]/route'
import { routeContext, routeRequest } from '../../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../../e2e/fixtures/session'

const ORIGINAL = {
  amount: 20000,
  participantCount: 3,
  paymentDate: 5,
}

describe('/api/nbreads/[nbreadId]', () => {
  const seed = new Seeder()
  let leader: TestUser
  let member: TestUser
  let outsider: TestUser
  let leaderToken: string
  let memberToken: string

  beforeAll(async () => {
    ;[leader, member, outsider] = await Promise.all([
      seed.createUser('통합 그룹장'),
      seed.createUser('통합 참여자'),
      seed.createUser('통합 비참여자'),
    ])
    ;[leaderToken, memberToken] = await Promise.all([
      signInAccessToken(leader),
      signInAccessToken(member),
    ])
  })

  afterAll(async () => {
    await seed.cleanup()
  })

  const createGroup = async () => {
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title: seed.unique('통합 엔빵'),
      ...ORIGINAL,
    })
    await seed.addParticipant(nbread.id, leader.id, true)
    await seed.addParticipant(nbread.id, member.id, false)
    return nbread
  }

  const readNbread = async (nbreadId: string) => {
    const { data, error } = await seed.admin
      .from('nbread')
      .select('*')
      .eq('id', nbreadId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  const countRows = async (
    table: 'participant' | 'nbread_records' | 'nbread_invite',
    nbreadId: string,
  ) => {
    const { count, error } = await seed.admin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('nbread_id', nbreadId)

    if (error) throw error
    return count
  }

  describe('PATCH', () => {
    const patch = (nbreadId: string, token: string, title: string) =>
      updateNbread(
        routeRequest(`/api/nbreads/${nbreadId}`, {
          token,
          method: 'PATCH',
          body: {
            title,
            amount: 36000,
            participantCount: 4,
            paymentPeriod: 'month',
            paymentDate: 25,
            paymentMonth: null,
            leaderId: leader.id,
          },
        }),
        routeContext({ nbreadId }),
      )

    // GROUP-UPDATE-001
    it('그룹장이 수정하면 금액과 인원이 요청값으로 바뀐다', async () => {
      const nbread = await createGroup()
      const title = seed.unique('통합 엔빵 수정')

      const response = await patch(nbread.id, leaderToken, title)

      expect(response.status).toBe(204)
      expect(await readNbread(nbread.id)).toMatchObject({
        title,
        amount: 36000,
        participant_count: 4,
        payment_date: 25,
        leader_id: leader.id,
      })
    })

    // GROUP-UPDATE-002
    it('일반 참여자가 수정하면 거부하고 기존 정보를 유지한다', async () => {
      const nbread = await createGroup()

      const response = await patch(
        nbread.id,
        memberToken,
        seed.unique('권한 없는 수정'),
      )

      expect(response.status).toBe(403)
      expect(await readNbread(nbread.id)).toMatchObject({
        title: nbread.title,
        amount: ORIGINAL.amount,
        participant_count: ORIGINAL.participantCount,
        payment_date: ORIGINAL.paymentDate,
        leader_id: leader.id,
      })
    })
  })

  describe('DELETE', () => {
    const remove = (nbreadId: string, token: string) =>
      deleteNbread(
        routeRequest(`/api/nbreads/${nbreadId}`, { token, method: 'DELETE' }),
        routeContext({ nbreadId }),
      )

    // GROUP-DELETE-001
    it('그룹장이 삭제하면 엔빵과 참여자, 납부 기록, 초대가 함께 지워진다', async () => {
      const nbread = await createGroup()
      await seed.createInvite(nbread.id, outsider.id)

      expect(await countRows('participant', nbread.id)).toBe(2)
      expect(await countRows('nbread_records', nbread.id)).toBe(2)
      expect(await countRows('nbread_invite', nbread.id)).toBe(1)

      const response = await remove(nbread.id, leaderToken)

      expect(response.status).toBe(204)
      expect(await readNbread(nbread.id)).toBeNull()
      expect(await countRows('participant', nbread.id)).toBe(0)
      expect(await countRows('nbread_records', nbread.id)).toBe(0)
      expect(await countRows('nbread_invite', nbread.id)).toBe(0)
    })

    // GROUP-DELETE-002
    it('일반 참여자가 삭제하면 거부하고 엔빵을 유지한다', async () => {
      const nbread = await createGroup()

      const response = await remove(nbread.id, memberToken)

      expect(response.status).toBe(403)
      expect(await readNbread(nbread.id)).not.toBeNull()
      expect(await countRows('participant', nbread.id)).toBe(2)
    })
  })
})
