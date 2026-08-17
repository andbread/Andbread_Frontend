import type { SupabaseClient } from '@supabase/supabase-js'
import { Nbread } from '@/types/nbread'
import { NbreadRow } from '@/types/supabase'

const EMPTY = { monthlyNbreads: [], myNbreads: [] }

/**
 * currentMonth는 클라이언트가 넘긴다.
 * 서버에서 new Date().getMonth()를 쓰면 배포 서버 시간대(UTC) 기준이 되어
 * 월이 바뀌는 구간에 한국 사용자와 판정이 어긋난다.
 *
 * paidCount를 엔빵 개수만큼 반복 조회하는 N+1은 그대로 옮긴다. 제거는 후속 이슈다.
 */
export const getUserNbreads = async (
  client: SupabaseClient,
  userId: string,
  currentMonth: number,
): Promise<{ monthlyNbreads: Nbread[]; myNbreads: Nbread[] }> => {
  if (!userId) return EMPTY

  // 1. 현재 로그인한 유저의 참여 정보를 가져옴
  const { data: participantEntries, error: participantError } = await client
    .from('participant')
    .select('nbread_id')
    .eq('user_id', userId)

  if (participantError) {
    console.error(
      '❌ Failed to fetch participant entries:',
      participantError.message,
    )

    return EMPTY
  }

  const nbreadIds = participantEntries?.map((entry) => entry.nbread_id) || []
  if (nbreadIds.length === 0) {
    return EMPTY
  }

  // 2. 현재 로그인한 유저가 참여 중인 모든 엔빵 가져오기
  const { data: nbreads, error } = await client
    .from('nbread')
    .select('*')
    .in('id', nbreadIds)

  if (error || !nbreads) {
    console.error('❌ Failed to fetch nbreads:', error?.message)
    return EMPTY
  }

  // 3. Supabase에서 가져온 엔빵 정보를 type에 맞게 변환
  const allNbreads: Nbread[] = (nbreads as NbreadRow[]).map((nbread) => ({
    id: nbread.id,
    title: nbread.title,
    amount: nbread.amount,
    participantCount: nbread.participant_count,
    paymentDate: nbread.payment_date,
    paymentMonth: nbread.payment_month,
    paymentPeriod: nbread.payment_period as 'year' | 'month',
    leaderId: nbread.leader_id,
    participants: null,
    startDate: nbread.start_date,
    endDate: nbread.end_date,
  }))

  // 4. 각 nbread 객체에 paidCount 값을 추가
  const nbreadWithPaidCounts = await Promise.all(
    allNbreads.map(async (nbread) => {
      const { count, error } = await client
        .from('nbread_records')
        .select('*', { count: 'exact' })
        .eq('nbread_id', nbread.id)
        .eq('payment_date', nbread.startDate)
        .eq('is_paid', true)

      if (error) {
        console.error(
          `❌ Failed to fetch paid count for nbread_id: ${nbread.id}`,
          error.message,
        )
        return { ...nbread, paidCount: 0 }
      }

      return { ...nbread, paidCount: count || 0 }
    }),
  )

  // 5. 필터링: 이번 달 엔빵과 나의 엔빵 구분
  const monthlyNbreads = nbreadWithPaidCounts.filter((nbread) => {
    return (
      nbread.paymentPeriod === 'month' ||
      (nbread.paymentPeriod === 'year' && nbread.paymentMonth === currentMonth) // 연간 결제 엔빵은 해당 월에만 포함
    )
  })

  const myNbreads = nbreadWithPaidCounts

  return { monthlyNbreads, myNbreads }
}
