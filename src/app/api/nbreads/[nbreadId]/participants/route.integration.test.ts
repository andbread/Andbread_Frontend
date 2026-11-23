import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  DELETE as removeParticipant,
  POST as joinNbread,
} from '@/app/api/nbreads/[nbreadId]/participants/route'
import {
  routeContext,
  routeRequest,
} from '../../../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../../../e2e/fixtures/session'

type Role = 'leader' | 'member' | 'otherMember' | 'outsider'

describe('/api/nbreads/[nbreadId]/participants', () => {
  const seed = new Seeder()
  const users = {} as Record<Role, TestUser>
  const tokens = {} as Record<Role, string>

  beforeAll(async () => {
    const roles: Role[] = ['leader', 'member', 'otherMember', 'outsider']
    await Promise.all(
      roles.map(async (role) => {
        users[role] = await seed.createUser(`통합 ${role}`)
        tokens[role] = await signInAccessToken(users[role])
      }),
    )
  })

  afterAll(async () => {
    await seed.cleanup()
  })

  const createNbread = (participantCount: number) =>
    seed.createNbread({
      leaderId: users.leader.id,
      title: seed.unique('통합 참여 엔빵'),
      amount: 30000,
      participantCount,
      paymentDate: 10,
    })

  const participantIds = async (nbreadId: string) =>
    (await seed.getParticipants(nbreadId)).map((p) => p.user_id).sort()

  describe('POST', () => {
    const join = (nbreadId: string, role: Role, isLeader: boolean) =>
      joinNbread(
        routeRequest(`/api/nbreads/${nbreadId}/participants`, {
          token: tokens[role],
          method: 'POST',
          body: { isLeader },
        }),
        routeContext({ nbreadId }),
      )

    // GROUP-MEMBER-003
    it('그룹장이 참여하면 참여자 행과 미납 기록 1건이 생긴다', async () => {
      const nbread = await createNbread(3)

      const response = await join(nbread.id, 'leader', true)

      expect(response.status).toBe(200)
      const participants = await seed.getParticipants(nbread.id)
      expect(participants).toHaveLength(1)
      expect(participants[0]).toMatchObject({
        user_id: users.leader.id,
        is_leader: true,
      })

      const records = await seed.getRecords(nbread.id, users.leader.id)
      expect(records).toHaveLength(1)
      expect(records[0]).toMatchObject({
        is_paid: false,
        payment_date: nbread.start_date,
      })
    })

    // GROUP-MEMBER-004
    it('같은 사용자가 두 번 참여해도 참여자 행은 하나다', async () => {
      const nbread = await createNbread(3)

      expect((await join(nbread.id, 'leader', true)).status).toBe(200)
      expect((await join(nbread.id, 'leader', true)).status).toBe(200)

      expect(await participantIds(nbread.id)).toEqual([users.leader.id])
    })

    // GROUP-MEMBER-005
    it('정원이 찬 엔빵에는 참여자가 추가되지 않는다', async () => {
      const nbread = await createNbread(1)
      await seed.addParticipant(nbread.id, users.member.id, false)

      expect((await join(nbread.id, 'leader', true)).status).toBe(200)

      expect(await participantIds(nbread.id)).toEqual([users.member.id])
    })

    // GROUP-MEMBER-006
    it.each([false, true])(
      '그룹장이 아닌 사용자는 남의 엔빵에 스스로 참여할 수 없다(isLeader=%s)',
      async (isLeader) => {
        const nbread = await createNbread(3)

        const response = await join(nbread.id, 'outsider', isLeader)

        expect(response.ok).toBe(false)
        expect(await participantIds(nbread.id)).toEqual([])
      },
    )
  })

  describe('DELETE', () => {
    const createGroup = async () => {
      const nbread = await createNbread(3)
      await seed.addParticipant(nbread.id, users.leader.id, true)
      await seed.addParticipant(nbread.id, users.member.id, false)
      await seed.addParticipant(nbread.id, users.otherMember.id, false)
      return nbread
    }

    const remove = (nbreadId: string, role: Role, userId: string) =>
      removeParticipant(
        routeRequest(`/api/nbreads/${nbreadId}/participants?userId=${userId}`, {
          token: tokens[role],
          method: 'DELETE',
        }),
        routeContext({ nbreadId }),
      )

    // GROUP-MEMBER-007
    it('일반 참여자는 스스로 그룹에서 나갈 수 있다', async () => {
      const nbread = await createGroup()

      const response = await remove(nbread.id, 'member', users.member.id)

      expect(response.status).toBe(204)
      expect(await participantIds(nbread.id)).toEqual(
        [users.leader.id, users.otherMember.id].sort(),
      )
    })

    // GROUP-MEMBER-008
    it('그룹장은 다른 참여자를 내보낼 수 있다', async () => {
      const nbread = await createGroup()

      const response = await remove(nbread.id, 'leader', users.member.id)

      expect(response.status).toBe(204)
      expect(await participantIds(nbread.id)).toEqual(
        [users.leader.id, users.otherMember.id].sort(),
      )
    })

    // GROUP-MEMBER-009
    it('일반 참여자가 다른 참여자를 내보내면 거부한다', async () => {
      const nbread = await createGroup()

      const response = await remove(nbread.id, 'member', users.otherMember.id)

      expect(response.status).toBe(403)
      expect(await participantIds(nbread.id)).toEqual(
        [users.leader.id, users.member.id, users.otherMember.id].sort(),
      )
    })
  })
})
