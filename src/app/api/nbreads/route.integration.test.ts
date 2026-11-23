import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { POST as createNbread } from '@/app/api/nbreads/route'
import { routeRequest } from '../../../../e2e/fixtures/route'
import { Seeder, type TestUser } from '../../../../e2e/fixtures/seed'
import { signInAccessToken } from '../../../../e2e/fixtures/session'

describe('POST /api/nbreads', () => {
  const seed = new Seeder()
  let alice: TestUser
  let bob: TestUser
  let aliceToken: string

  beforeAll(async () => {
    ;[alice, bob] = await Promise.all([
      seed.createUser('통합 그룹장'),
      seed.createUser('통합 다른 사용자'),
    ])
    aliceToken = await signInAccessToken(alice)
  })

  afterAll(async () => {
    await seed.cleanup()
  })

  // GROUP-CREATE-007
  it('로그인 사용자가 만든 엔빵은 요청한 금액과 인원으로 저장된다', async () => {
    const title = seed.unique('통합 엔빵 생성')
    seed.trackNbreadTitle(title)

    const response = await createNbread(
      routeRequest('/api/nbreads', {
        token: aliceToken,
        method: 'POST',
        body: {
          title,
          amount: 17000,
          participantCount: 4,
          paymentPeriod: 'year',
          paymentDate: 15,
          paymentMonth: 3,
          leaderId: alice.id,
        },
      }),
    )

    expect(response.status).toBe(201)
    const { data } = (await response.json()) as { data: { id: string } }

    const { data: row, error } = await seed.admin
      .from('nbread')
      .select('*')
      .eq('id', data.id)
      .single()

    expect(error).toBeNull()
    expect(row).toMatchObject({
      title,
      amount: 17000,
      participant_count: 4,
      payment_period: 'year',
      payment_date: 15,
      payment_month: 3,
      leader_id: alice.id,
    })
  })

  // GROUP-CREATE-008
  it('다른 사용자를 그룹장으로 지정한 엔빵은 만들어지지 않는다', async () => {
    const title = seed.unique('통합 엔빵 대리 생성')
    seed.trackNbreadTitle(title)

    const response = await createNbread(
      routeRequest('/api/nbreads', {
        token: aliceToken,
        method: 'POST',
        body: {
          title,
          amount: 10000,
          participantCount: 2,
          paymentPeriod: 'month',
          paymentDate: 10,
          paymentMonth: null,
          leaderId: bob.id,
        },
      }),
    )

    expect(response.ok).toBe(false)
    expect(await seed.findNbreadByTitle(title)).toBeNull()
  })
})
