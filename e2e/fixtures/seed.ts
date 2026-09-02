import { randomUUID } from 'node:crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database, NbreadRecordsRow, NbreadRow } from '@/types/supabase'
import {
  hasTestDatabase,
  supabaseServiceRoleKey,
  supabaseUrl,
  testDatabaseSkipReason,
  testUserPassword,
} from './env'

export interface TestUser {
  id: string
  email: string
  password: string
  name: string
  tag: string
  socialType: 'kakao' | 'google'
  profileImage: string | null
}

interface CreateNbreadOptions {
  leaderId: string
  title: string
  amount: number
  participantCount: number
  paymentDate: number
  paymentPeriod?: 'month' | 'year'
  paymentMonth?: number | null
}

/**
 * 테스트 데이터를 만들고 실행이 끝나면 되돌린다.
 * service role key를 쓰므로 Node.js 테스트 프로세스에서만 사용하고 브라우저로 넘기지 않는다.
 */
export class Seeder {
  readonly admin: SupabaseClient<Database>
  readonly runId = randomUUID().slice(0, 8)

  private readonly authUserIds: string[] = []
  private readonly nbreadIds: string[] = []
  private readonly nbreadTitles: string[] = []
  private uniqueCounter = 0

  constructor() {
    if (!hasTestDatabase) {
      throw new Error(testDatabaseSkipReason)
    }

    this.admin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }

  /** 실행마다 다른 값을 써서 병렬 실행과 잔여 데이터의 충돌을 피한다. */
  unique(prefix: string) {
    this.uniqueCounter += 1

    return `${prefix} ${this.runId}-${this.uniqueCounter}`
  }

  async createUser(name?: string): Promise<TestUser> {
    const id = randomUUID()
    const email = `e2e-${this.runId}-${id.slice(0, 8)}@nbread-e2e.test`
    const userName = name ?? `E2E ${id.slice(0, 4)}`

    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password: testUserPassword,
      email_confirm: true,
      user_metadata: { full_name: userName },
    })

    if (error || !data.user) {
      throw error ?? new Error('테스트 인증 사용자를 만들지 못했습니다.')
    }

    this.authUserIds.push(data.user.id)

    const tag = await this.insertUserRow(data.user.id, email, userName)

    return {
      id: data.user.id,
      email,
      password: testUserPassword,
      name: userName,
      tag,
      socialType: 'kakao',
      profileImage: null,
    }
  }

  /**
   * 가입 트리거가 없어 user 행은 이 helper가 직접 만든다.
   * tag에는 user_tag_key 유니크 제약이 있고 값이 네 자리뿐이라
   * 한 실행에서 여러 계정을 만들면 겹칠 수 있다. 겹치면 다른 값으로 다시 시도한다.
   */
  private async insertUserRow(id: string, email: string, name: string) {
    const now = new Date().toISOString()

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const tag = String(1000 + Math.floor(Math.random() * 9000))

      const { error } = await this.admin.from('user').upsert(
        {
          id,
          email,
          name,
          social_type: 'kakao',
          tag,
          terms_agreed: true,
          terms_agreed_at: now,
          privacy_agreed: true,
          privacy_agreed_at: now,
        },
        { onConflict: 'id' },
      )

      if (!error) return tag

      // tag 충돌이 아닌 오류는 다시 시도해도 같은 결과이므로 그대로 알린다.
      if (error.code !== '23505' || !error.message.includes('user_tag_key')) {
        throw error
      }
    }

    throw new Error('겹치지 않는 테스트 사용자 tag를 찾지 못했습니다.')
  }

  async createNbread(options: CreateNbreadOptions): Promise<NbreadRow> {
    const { data, error } = await this.admin
      .from('nbread')
      .insert({
        title: options.title,
        amount: options.amount,
        participant_count: options.participantCount,
        payment_period: options.paymentPeriod ?? 'month',
        payment_date: options.paymentDate,
        payment_month: options.paymentMonth ?? null,
        leader_id: options.leaderId,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw error ?? new Error('테스트 엔빵을 만들지 못했습니다.')
    }

    this.trackNbread(data.id)

    return data
  }

  /** cleanup 대상 엔빵을 아이디로 등록한다. */
  trackNbread(nbreadId: string) {
    if (!this.nbreadIds.includes(nbreadId)) {
      this.nbreadIds.push(nbreadId)
    }
  }

  /**
   * 아직 아이디를 모르는 엔빵을 제목으로 예약한다.
   * 검증 중간에 테스트가 실패해도 cleanup이 제목으로 찾아 지운다.
   */
  trackNbreadTitle(title: string) {
    if (!this.nbreadTitles.includes(title)) {
      this.nbreadTitles.push(title)
    }
  }

  async findNbreadByTitle(title: string): Promise<NbreadRow | null> {
    const { data, error } = await this.admin
      .from('nbread')
      .select('*')
      .eq('title', title)
      .maybeSingle()

    if (error) throw error

    return data
  }

  /**
   * participant 삽입은 create_initial_nbread_records 트리거를 통과하므로
   * 그룹의 start_date 기준 미납 기록이 함께 생성된다.
   */
  async addParticipant(nbreadId: string, userId: string, isLeader: boolean) {
    const { error } = await this.admin.from('participant').insert({
      nbread_id: nbreadId,
      user_id: userId,
      is_leader: isLeader,
    })

    if (error) throw error
  }

  async upsertRecord(
    nbreadId: string,
    userId: string,
    paymentDate: string,
    isPaid: boolean,
  ) {
    const { error } = await this.admin.from('nbread_records').upsert(
      {
        nbread_id: nbreadId,
        user_id: userId,
        payment_date: paymentDate,
        is_paid: isPaid,
      },
      { onConflict: 'nbread_id,payment_date,user_id' },
    )

    if (error) throw error
  }

  async getRecords(
    nbreadId: string,
    userId: string,
  ): Promise<NbreadRecordsRow[]> {
    const { data, error } = await this.admin
      .from('nbread_records')
      .select('*')
      .eq('nbread_id', nbreadId)
      .eq('user_id', userId)

    if (error) throw error

    return data ?? []
  }

  async createInvite(
    nbreadId: string,
    targetUserId: string | null,
    status: 'pending' | 'accepted' | 'rejected' | 'expired' = 'pending',
  ): Promise<string> {
    const inviteToken = `e2e-${randomUUID()}`

    const { error } = await this.admin.from('nbread_invite').insert({
      nbread_id: nbreadId,
      target_user_id: targetUserId,
      status,
      invite_token: inviteToken,
    })

    if (error) throw error

    return inviteToken
  }

  async getInvite(inviteToken: string) {
    const { data, error } = await this.admin
      .from('nbread_invite')
      .select('*')
      .eq('invite_token', inviteToken)
      .maybeSingle()

    if (error) throw error

    return data
  }

  async getParticipants(nbreadId: string, userId?: string) {
    const query = this.admin
      .from('participant')
      .select('*')
      .eq('nbread_id', nbreadId)

    const { data, error } = await (userId ? query.eq('user_id', userId) : query)

    if (error) throw error

    return data ?? []
  }

  /** 자식 행부터 지워서 외래 키 제약에 걸리지 않도록 한다. */
  async cleanup() {
    for (const title of this.nbreadTitles) {
      const { data } = await this.admin
        .from('nbread')
        .select('id')
        .eq('title', title)

      for (const row of data ?? []) {
        this.trackNbread(row.id)
      }
    }

    for (const nbreadId of this.nbreadIds) {
      await this.admin.from('nbread_records').delete().eq('nbread_id', nbreadId)
      await this.admin.from('participant').delete().eq('nbread_id', nbreadId)
      await this.admin.from('nbread_invite').delete().eq('nbread_id', nbreadId)
      await this.admin.from('nbread').delete().eq('id', nbreadId)
    }

    for (const userId of this.authUserIds) {
      await this.admin.from('user').delete().eq('id', userId)
      await this.admin.auth.admin.deleteUser(userId)
    }

    this.nbreadIds.length = 0
    this.nbreadTitles.length = 0
    this.authUserIds.length = 0
  }
}

/** `YYYY-MM-DD` 문자열을 월 단위로 이동한다. 정산 기간 경계를 고정하려고 UTC로만 계산한다. */
export const shiftMonths = (date: string, months: number) => {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1 + months, day))

  return shifted.toISOString().split('T')[0]
}
