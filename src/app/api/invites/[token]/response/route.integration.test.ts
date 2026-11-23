import { afterAll, describe, expect, it } from 'vitest'
import { POST as respondToInvite } from '@/app/api/invites/[token]/response/route'
import { routeContext, routeRequest } from '../../../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../../../e2e/fixtures/session'

const respond = async (
  user: TestUser,
  inviteToken: string,
  response: 'accepted' | 'rejected',
) =>
  respondToInvite(
    routeRequest(`/api/invites/${inviteToken}/response`, {
      token: await signInAccessToken(user),
      method: 'POST',
      body: { response },
    }),
    routeContext({ token: inviteToken }),
  )

/**
 * 초대 화면은 오류 응답의 message에 RPC 코드가 들어 있는지로 안내를 고른다.
 * 그래서 code 값과 함께 message가 코드를 담고 있는지도 계약으로 본다.
 */
const expectInviteError = async (
  response: Response,
  status: number,
  code: string,
) => {
  expect(response.status).toBe(status)

  const body = (await response.json()) as { message: string; code?: string }
  expect(body.code).toBe(code)
  expect(body.message).toContain(code)
}

describe('POST /api/invites/[token]/response', () => {
  const seed = new Seeder()

  /** 방장만 참여한 엔빵을 만든다. 정원은 capacity로 정한다. */
  const seedNbread = async (capacity = 2) => {
    const leader = await seed.createUser('통합 초대 방장')
    const nbread = await seed.createNbread({
      leaderId: leader.id,
      title: seed.unique('통합 초대 엔빵'),
      amount: 20000,
      participantCount: capacity,
      paymentDate: 12,
    })
    await seed.addParticipant(nbread.id, leader.id, true)

    return { leader, nbread }
  }

  afterAll(async () => {
    await seed.cleanup()
  })

  it('초대 대상자가 수락하면 초대가 accepted가 되고 참여자가 1행 생긴다', async () => {
    const { nbread } = await seedNbread()
    const target = await seed.createUser('통합 초대 대상자')
    const inviteToken = await seed.createInvite(nbread.id, target.id)

    const response = await respond(target, inviteToken, 'accepted')

    expect(response.status).toBe(200)
    const { data } = (await response.json()) as {
      data: { nbread_id: string; outcome: string }
    }
    expect(data.nbread_id).toBe(nbread.id)
    expect(data.outcome).toBe('joined')

    expect((await seed.getInvite(inviteToken))?.status).toBe('accepted')
    expect(await seed.getParticipants(nbread.id, target.id)).toHaveLength(1)
  })

  it('초대 대상이 아닌 계정이 수락하면 403 INVITE_TARGET_MISMATCH이고 DB가 바뀌지 않는다', async () => {
    const { nbread } = await seedNbread()
    const target = await seed.createUser('통합 초대 대상자')
    const other = await seed.createUser('통합 권한 없는 계정')
    const inviteToken = await seed.createInvite(nbread.id, target.id)

    const response = await respond(other, inviteToken, 'accepted')

    await expectInviteError(response, 403, 'INVITE_TARGET_MISMATCH')

    const invite = await seed.getInvite(inviteToken)
    expect(invite?.status).toBe('pending')
    expect(invite?.target_user_id).toBe(target.id)
    expect(await seed.getParticipants(nbread.id, other.id)).toHaveLength(0)
    expect(await seed.getParticipants(nbread.id, target.id)).toHaveLength(0)
  })

  it('정원이 찬 엔빵의 초대를 수락하면 409 INVITE_EXPIRED이고 참여자가 늘지 않는다', async () => {
    const { nbread } = await seedNbread(2)
    const member = await seed.createUser('통합 기존 참여자')
    await seed.addParticipant(nbread.id, member.id, false)
    const target = await seed.createUser('통합 정원 초과 대상자')
    const inviteToken = await seed.createInvite(nbread.id, target.id)

    const response = await respond(target, inviteToken, 'accepted')

    await expectInviteError(response, 409, 'INVITE_EXPIRED')

    expect(await seed.getParticipants(nbread.id)).toHaveLength(2)
    expect(await seed.getParticipants(nbread.id, target.id)).toHaveLength(0)
  })

  it('이미 참여 중인 사용자가 다른 초대를 수락해도 참여자가 중복되지 않는다', async () => {
    const { nbread } = await seedNbread()
    const member = await seed.createUser('통합 기존 참여자')
    await seed.addParticipant(nbread.id, member.id, false)
    const inviteToken = await seed.createInvite(nbread.id, member.id)

    const response = await respond(member, inviteToken, 'accepted')

    expect(response.status).toBe(200)
    const { data } = (await response.json()) as { data: { outcome: string } }
    expect(data.outcome).toBe('already_participant')

    expect(await seed.getParticipants(nbread.id, member.id)).toHaveLength(1)
    expect((await seed.getInvite(inviteToken))?.status).toBe('accepted')
  })

  it('거절한 초대를 다시 수락하면 409 INVITE_ALREADY_REJECTED이고 참여자가 생기지 않는다', async () => {
    const { nbread } = await seedNbread()
    const target = await seed.createUser('통합 초대 대상자')
    const inviteToken = await seed.createInvite(nbread.id, target.id)

    const rejected = await respond(target, inviteToken, 'rejected')
    expect(rejected.status).toBe(200)
    expect((await seed.getInvite(inviteToken))?.status).toBe('rejected')

    const response = await respond(target, inviteToken, 'accepted')

    await expectInviteError(response, 409, 'INVITE_ALREADY_REJECTED')

    expect((await seed.getInvite(inviteToken))?.status).toBe('rejected')
    expect(await seed.getParticipants(nbread.id, target.id)).toHaveLength(0)
  })
})
