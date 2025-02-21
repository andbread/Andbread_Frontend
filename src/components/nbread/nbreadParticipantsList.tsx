import { Participant } from '@/types/nbread'
import NbreadParticipantCard from './nbreadParticipantCard'
import DashlineCard from '../common/card/dashlineCard'

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
  return (
    <section>
      <div className="mb-12 mt-40 text-body02 text-gray-500">참여한 사람</div>
      <div className="mb-40 flex flex-col gap-8">
        {Array.from({ length: participantMaxCount }).map((_, index) =>
          participants && index < participants.length ? (
            <NbreadParticipantCard
              key={index}
              isNbreadLeader={true}
              name={participants[index].user.name}
              paymentAmount={paymentAmount}
              hasCheckbox={!isEditing}
              // TODO 기능 구현 후 ID 하드코딩 값 수정 필요
              isCheckboxDisabled={
                leaderId !== '1' && participants[index].user.id !== '1'
              }
              hasDelete={isEditing && participants[index].user.id !== '1'}
              onClickDelete={() => console.log('엔빵 멤버 삭제 모달 오픈')}
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
        )}
      </div>
    </section>
  )
}

export default NbreadParticipantsList
