import { afterAll, describe, expect, it } from 'vitest'
import { POST as sendInvite } from '@/app/api/nbreads/[nbreadId]/invites/route'
import { routeContext, routeRequest } from '../../../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../../../e2e/fixtures/session'

describe('POST /api/nbreads/[nbreadId]/invites', () => {
  const seed = new Seeder()

  const send = async (user: TestUser, nbreadId: string, targetUserId: string) =>
    sendInvite(
      routeRequest(`/api/nbreads/${nbreadId}/invites`, {
        token: await signInAccessToken(user),
        method: 'POST',
        body: { targetUserId },
      }),
      routeContext({ nbreadId }),
    )

  const getInvitesTo = async (nbreadId: string, targetUserId: string) => {
    const { data, error } = await seed.admin
      .from('nbread_invite')
      .select('status')
      .eq('nbread_id', nbreadId)
      .eq('target_user_id', targetUserId)

    if (error) throw error

    return data
  }

  const seedNbread = async () => {
    const leader = await seed.createUser('통합 초대 방장')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title: seed.unique('통합 초대 엔빵'),
      amount: 20000,
      participantCount: 3,
      paymentDate: 12,
    })
    await seed.addParticipant(nbread.id, leader.id, true)

    return { leader, nbread }
  }

  afterAll(async () => {
    await seed.cleanup()
  })

  it('방장이 초대를 보내면 대상에게 대기 중 초대가 1건 생긴다', async () => {
    const { leader, nbread } = await seedNbread()
    const target = await seed.createUser('통합 초대 대상자')

    const response = await send(leader, nbread.id, target.id)

    expect(response.status).toBe(200)
    expect(await getInvitesTo(nbread.id, target.id)).toEqual([
      { status: 'pending' },
    ])
  })

  it('같은 대상에게 같은 엔빵 초대를 두 번 보내도 대기 중 초대가 중복되지 않는다', async () => {
    const { leader, nbread } = await seedNbread()
    const target = await seed.createUser('통합 초대 대상자')

    const first = await send(leader, nbread.id, target.id)
    const second = await send(leader, nbread.id, target.id)

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await getInvitesTo(nbread.id, target.id)).toEqual([
      { status: 'pending' },
    ])
  })

  it('엔빵 참여자가 아닌 사용자는 그 엔빵의 초대를 보낼 수 없다', async () => {
    const { nbread } = await seedNbread()
    const outsider = await seed.createUser('통합 엔빵 외부인')
    const target = await seed.createUser('통합 초대 대상자')

    const response = await send(outsider, nbread.id, target.id)

    expect(response.ok).toBe(false)
    expect(await getInvitesTo(nbread.id, target.id)).toHaveLength(0)
  })
})
