import { NbreadRecord, Participant } from '@/types/nbread'
import NbreadParticipantCard from './nbreadParticipantCard'
import DashlineCard from '../common/card/dashlineCard'
import useUserStore from '@/stores/useAuthStore'
import { updateNbreadRecord } from '@/lib/nbreadRecord'
import { useToast } from '../common/toast/Toast'
import { deleteParticipants } from '@/lib/participant'
import DeleteParticipantModal from '../common/Modal/DeleteParticipantModal'
import { useState } from 'react'

interface NbreadParticipantsListProps {
  nbreadId: string
  nbreadRecords: NbreadRecord[]
  currentPaymentDate: string
  participants: Participant[]
  participantMaxCount: number
  paymentAmount: number
  isEditing: boolean
  leaderId: string
  onClickInvite?: () => void
  updateParticipantData: () => void
}

const NbreadParticipantsList = ({
  nbreadId,
  currentPaymentDate,
  nbreadRecords,
  participants,
  participantMaxCount,
  paymentAmount,
  isEditing,
  leaderId,
  onClickInvite,
  updateParticipantData,
}: NbreadParticipantsListProps) => {
  const userData = useUserStore((state) => state.user)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [deleteParticipantUserId, setDeleteParticipantUserId] = useState<
    string | null
  >(null)
  const [deleteParticipantName, setDeleteParticipantName] = useState<
    string | null
  >(null)

  const participantsWithNbreadRecord = participants.map((participant) => {
    const record = nbreadRecords.find(
      (record) => record.userId === participant.user.id,
    )
    return { ...participant, isPaid: record ? record.isPaid : null }
  })

  const onClickDeleteUser = async (userId: string, userName: string) => {
    setDeleteParticipantUserId(userId)
    setDeleteParticipantName(userName)
    setIsModalOpen(true)
  }

  const onSubmitDeleteUser = async () => {
    try {
      if (deleteParticipantUserId && deleteParticipantName) {
        const data = await deleteParticipants(
          deleteParticipantUserId!,
          nbreadId,
        )
        setIsModalOpen(false)
        updateParticipantData()
        useToast.success(`${deleteParticipantName}님을 엔빵에서 내보냈어요.`)
      } else {
        throw Error
      }
    } catch (error) {
      setIsModalOpen(false)
      useToast.error('멤버 삭제에 실패했어요.')
    }
    setDeleteParticipantUserId(null)
    setDeleteParticipantName(null)
  }

  return (
    <section>
      <div className="mb-12 mt-40 text-body02 text-gray-500">참여한 사람</div>
      <div className="mb-40 flex flex-col gap-8">
        {isEditing ? (
          <>
            {participantsWithNbreadRecord.map((participant, index) => (
              <NbreadParticipantCard
                key={index}
                nbreadId={nbreadId}
                participantId={participant.user.id}
                currentPaymentDate={currentPaymentDate}
                isNbreadLeader={participant.isLeader}
                name={participant.user.name}
                profileImageUrl={participant.user.profileImage}
                paymentAmount={paymentAmount}
                isChecked={participant.isPaid!}
                hasCheckbox={!isEditing}
                isCheckboxDisabled={
                  leaderId !== userData!.id &&
                  participant.user.id !== userData?.id
                }
                hasDelete={isEditing && participant.user.id !== userData?.id}
                onClickDelete={() =>
                  onClickDeleteUser(participant.user.id, participant.user.name)
                }
              />
            ))}
            <DashlineCard
              text="친구 초대는 엔빵 수정이 끝난 후에 가능해요."
              iconType="warning"
              size={10}
              nbreadId={nbreadId}
              tailwindColor="text-gray-00"
            />
          </>
        ) : (
          Array.from({ length: participantMaxCount }).map((_, index) =>
            participantsWithNbreadRecord &&
            index < participantsWithNbreadRecord.length ? (
              <NbreadParticipantCard
                key={index}
                nbreadId={nbreadId}
                participantId={participants[index].user.id}
                currentPaymentDate={currentPaymentDate}
                isNbreadLeader={participants[index].isLeader}
                name={participants[index].user.name}
                profileImageUrl={participants[index].user.profileImage}
                paymentAmount={paymentAmount}
                hasCheckbox={!isEditing}
                isChecked={participantsWithNbreadRecord[index].isPaid!}
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
                nbreadId={nbreadId}
                tailwindColor="text-gray-00"
                onClick={onClickInvite}
              />
            ),
          )
        )}
      </div>
      <DeleteParticipantModal
        isOpen={isModalOpen}
        userName={deleteParticipantName!}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => onSubmitDeleteUser()}
      />
    </section>
  )
}

export default NbreadParticipantsList
