import { afterAll, describe, expect, it } from 'vitest'
import { POST as createLinkInvite } from '@/app/api/nbreads/[nbreadId]/invites/link/route'
import { routeContext, routeRequest } from '../../../../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../../../../e2e/fixtures/session'

describe('POST /api/nbreads/[nbreadId]/invites/link', () => {
  const seed = new Seeder()

  const createLink = async (user: TestUser, nbreadId: string) =>
    createLinkInvite(
      routeRequest(`/api/nbreads/${nbreadId}/invites/link`, {
        token: await signInAccessToken(user),
        method: 'POST',
      }),
      routeContext({ nbreadId }),
    )

  const getInvites = async (nbreadId: string) => {
    const { data, error } = await seed.admin
      .from('nbread_invite')
      .select('invite_token, target_user_id, status')
      .eq('nbread_id', nbreadId)

    if (error) throw error

    return data
  }

  const seedNbread = async () => {
    const leader = await seed.createUser('통합 링크 방장')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title: seed.unique('통합 링크 엔빵'),
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

  it('방장이 링크 초대를 만들면 대상 없는 대기 중 초대가 생기고 그 토큰을 돌려준다', async () => {
    const { leader, nbread } = await seedNbread()

    const response = await createLink(leader, nbread.id)

    expect(response.status).toBe(201)
    const { data } = (await response.json()) as {
      data: { inviteToken: string }
    }
    expect(await getInvites(nbread.id)).toEqual([
      {
        invite_token: data.inviteToken,
        target_user_id: null,
        status: 'pending',
      },
    ])
  })

  it('엔빵 참여자가 아닌 사용자는 그 엔빵의 링크 초대를 만들 수 없다', async () => {
    const { nbread } = await seedNbread()
    const outsider = await seed.createUser('통합 엔빵 외부인')

    const response = await createLink(outsider, nbread.id)

    expect(response.ok).toBe(false)
    expect(await getInvites(nbread.id)).toHaveLength(0)
  })
})
