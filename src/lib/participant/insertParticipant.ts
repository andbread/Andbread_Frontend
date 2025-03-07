import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types/nbread'
import { isGetParticipantsUser, participantUsers } from './getParticipants'
import { getNbread } from '../nbread'
export const insertParticipant = async (
  participant: Participant,
  nbreadId: string,
) => {
  try {
    const participantCount = await getNbread(nbreadId)

    const usersData = await participantUsers(nbreadId)

    if (usersData) {
      if (participantCount.participantCount <= usersData.length) {
        return {
          isInsert: '만료',
          title: '엔빵 초대가 만료되었어요.',
          subTitle: '링크가 만료되어 초대를 수락할 수 없어요.',
          buttonTitle: '홈으로 가기',
        }
      } else {
        const isUser = await isGetParticipantsUser(participant, nbreadId)

        if (isUser == null) {
          const { data, error } = await supabase.from('participant').insert({
            nbread_id: nbreadId,
            user_id: participant.user.id,
            is_leader: participant.isLeader,
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
        return {
          isInsert: '이미 참여',
          title: '이미 참여 중인 엔빵이에요.',
          subTitle: '참여한 엔빵 정보를 바로 확인할 수 있어요.',
          buttonTitle: '엔빵 확인하러 가기',
        }
      }
    }
  } catch (error) {
    throw error
  }
}
