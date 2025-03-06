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
    console.log("엔빵 가용인원",participantCount.participantCount);
    const usersData = await participantUsers(nbreadId)
    console.log("엔빵에 참가한 인원",usersData?.length)
    if(usersData){
      if(participantCount.participantCount <= usersData.length){
        return {title:"엔빵 초대가 만료되었어요.",subTitle:"링크가 만료되어 초대를 수락할 수 없어요.",buttonTitle:"홈으로 가기"}
      }
      else {
        const isUser = await isGetParticipantsUser(participant, nbreadId)
    console.log('isUser : ',isUser)
    if (isUser == null) {
      console.log("해당 엔빵에 유저가 없어요!!")
      const { data, error } = await supabase.from('participant').insert({
        nbread_id: nbreadId,
        user_id: participant.user.id,
        is_leader: participant.isLeader,
      })

      if (error) {
        console.error('Error inserting participant:', error)
        throw error
      }
      console.log("저장됐어?",data);
      return {isInsert:true,title:"엔빵 참여가 완료되었어요.",subTitle:"참여한 엔빵 정보를 바로 확인할 수 있어요.",buttonTitle:"엔빵확인하러 가기"}
    }
    return {isInsert:false,title: "이미 참가 완료되어 있어요.",subTitle:"참여한 엔빵 정보를 바로 확인할 수 있어요.",buttonTitle:"엔빵확인하러 가기"}
  }
      }
    }
     catch (error) {
    throw error
  }
}
