import { Participant } from '@/types/nbread'
import NbreadParticipantCard from './nbreadParticipantCard'
import DashlineCard from '../common/card/dashlineCard'
import useUserStore from '@/stores/useAuthStore'

interface NbreadParticipantsListProps {
  participants: Participant[]
  participantMaxCount: number
  paymentAmount: number
  isEditing: boolean
  leaderId: string
}

const NbreadParticipantsList = ({
  participants,
  participantMaxCount,
  paymentAmount,
  isEditing,
  leaderId,
}: NbreadParticipantsListProps) => {
  const userData = useUserStore((state) => state.user)

  return (
    <section>
      <div className="mb-12 mt-40 text-body02 text-gray-500">참여한 사람</div>
      <div className="mb-40 flex flex-col gap-8">
        {isEditing ? (
          <>
            {participants.map((participant, index) => (
              <NbreadParticipantCard
                key={index}
                isNbreadLeader={true}
                name={participant.user.name}
                paymentAmount={paymentAmount}
                hasCheckbox={!isEditing}
                isCheckboxDisabled={
                  leaderId !== userData!.id &&
                  participant.user.id !== userData?.id
                }
                hasDelete={isEditing && participant.user.id !== userData?.id}
                // TODO 친구초대 기능 구현 후 모달 구현
                onClickDelete={() => console.log('엔빵 멤버 삭제 모달 오픈')}
              />
            ))}
            <DashlineCard
              text="친구 초대는 엔빵 수정이 끝난 후에 가능해요."
              iconType="warning"
              size={10}
              tailwindColor="text-gray-00"
            />
          </>
        ) : (
          Array.from({ length: participantMaxCount }).map((_, index) =>
            participants && index < participants.length ? (
              <NbreadParticipantCard
                key={index}
                isNbreadLeader={true}
                name={participants[index].user.name}
                paymentAmount={paymentAmount}
                hasCheckbox={!isEditing}
                isCheckboxDisabled={
                  leaderId !== userData!.id &&
                  participants[index].user.id !== userData?.id
                }
                hasDelete={false}
              />
            ) : (
              <DashlineCard
                key={index}
                text="친구 추가하기"
                iconType="plus"
                size={10}
                tailwindColor="text-gray-00"
                onClick={() => console.log('친구 초대하기 모달 열기')}
              />
            ),
          )
        )}
      </div>
    </section>
  )
}

export default NbreadParticipantsList
