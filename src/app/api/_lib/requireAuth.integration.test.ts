import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GET as listNbreads } from '@/app/api/nbreads/route'
import { routeRequest } from '../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../e2e/fixtures/session'

const LIST_PATH = '/api/nbreads?currentMonth=1'

const listNbreadIds = async (token: string) => {
  const response = await listNbreads(routeRequest(LIST_PATH, { token }))
  expect(response.status).toBe(200)

  const { data } = (await response.json()) as {
    data: { myNbreads: { id: string }[] }
  }

  return data.myNbreads.map((nbread) => nbread.id).sort()
}

describe('requireAuth', () => {
  const seed = new Seeder()
  let alice: TestUser
  let bob: TestUser
  let aliceNbreadId: string
  let bobNbreadId: string

  beforeAll(async () => {
    ;[alice, bob] = await Promise.all([
      seed.createUser('통합 Alice'),
      seed.createUser('통합 Bob'),
    ])

    const createOwnedNbread = async (user: TestUser) => {
      const nbread = await seed.createNbread({
        leaderId: user.id,
        title: seed.unique('통합 엔빵'),
        amount: 10000,
        participantCount: 2,
        paymentDate: 10,
      })
      await seed.addParticipant(nbread.id, user.id, true)
      return nbread.id
    }

    ;[aliceNbreadId, bobNbreadId] = await Promise.all([
      createOwnedNbread(alice),
      createOwnedNbread(bob),
    ])
  })

  afterAll(async () => {
    await seed.cleanup()
  })

  it('토큰이 없으면 401을 반환한다', async () => {
    const response = await listNbreads(routeRequest(LIST_PATH))

    expect(response.status).toBe(401)
  })

  it('유효하지 않은 토큰이면 401을 반환한다', async () => {
    const response = await listNbreads(
      routeRequest(LIST_PATH, { token: 'not-a-valid-jwt' }),
    )

    expect(response.status).toBe(401)
  })

  it('동시에 들어온 요청은 각자 자기 토큰의 데이터만 받는다', async () => {
    const [aliceToken, bobToken] = await Promise.all([
      signInAccessToken(alice),
      signInAccessToken(bob),
    ])

    const [aliceIds, bobIds] = await Promise.all([
      listNbreadIds(aliceToken),
      listNbreadIds(bobToken),
    ])

    expect(aliceIds).toEqual([aliceNbreadId])
    expect(bobIds).toEqual([bobNbreadId])
  })
})
