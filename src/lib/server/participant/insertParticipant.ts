import type { SupabaseClient } from '@supabase/supabase-js'
import { getNbread } from '@/lib/server/nbread/getNbread'
import { isGetParticipantsUser, participantUsers } from './getParticipants'

export interface InsertParticipantResult {
  isInsert: string
  title: string
  subTitle: string
  buttonTitle: string
}

/**
 * 정원 검사와 삽입 사이의 경쟁 조건은 기존 그대로 남아 있다.
 * 원자적으로 처리하는 작업은 후속 이슈로 분리한다.
 *
 * usersData 조회가 실패하면 아무 값도 돌려주지 않던 기존 동작을 유지하기 위해
 * null을 돌려주고, 클라이언트 lib이 undefined로 되돌린다.
 */
export const insertParticipant = async (
  client: SupabaseClient,
  nbreadId: string,
  userId: string,
  isLeader: boolean,
): Promise<InsertParticipantResult | null> => {
  const nbread = await getNbread(client, nbreadId)
  const usersData = await participantUsers(client, nbreadId)

  if (!usersData) return null

  if (nbread.participantCount <= usersData.length) {
    return {
      isInsert: '만료',
      title: '엔빵 초대가 만료되었어요.',
      subTitle: '링크가 만료되어 초대를 수락할 수 없어요.',
      buttonTitle: '홈으로 가기',
    }
  }

  const isUser = await isGetParticipantsUser(client, userId, nbreadId)

  if (isUser != null) {
    return {
      isInsert: '이미 참여',
      title: '이미 참여 중인 엔빵이에요.',
      subTitle: '참여한 엔빵 정보를 바로 확인할 수 있어요.',
      buttonTitle: '엔빵 확인하러 가기',
    }
  }

  const { error } = await client.from('participant').insert({
    nbread_id: nbreadId,
    user_id: userId,
    is_leader: isLeader,
  })

  if (error) {
    throw error
  }

  return {
    isInsert: '참여',
    title: '엔빵 참여가 완료되었어요.',
    subTitle: '참여한 엔빵 정보를 바로 확인할 수 있어요.',
    buttonTitle: '엔빵 확인하러 가기',
  }
}
