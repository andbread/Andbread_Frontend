import Modal from '../common/modal/Modal'
import { useRouter } from 'next/navigation'
import { updateAcceptInvite } from '@/lib/invite/updateInvite'
import { updateRejectedInvite } from '@/lib/invite/updateInvite'
interface InviteAcceptModalProps {
  id: number | null
  isOpen: boolean
  onClose: () => void
  senderNbreadTitle: string | null
  senderNbreadId: string | null
  receiverId: string
}
const InviteAcceptModal = ({isOpen,onClose,senderNbreadTitle,senderNbreadId,receiverId} : InviteAcceptModalProps) => {
    const router = useRouter()
    const fetchInviteAccept = async () => {
        const acceptInviteData = await updateAcceptInvite(receiverId,senderNbreadId)
        onClose()
        router.push(`/nbread/${senderNbreadId}`)

    }
    const fetchInviteReject = async () => {
        const rejectInviteData = await updateRejectedInvite(receiverId,senderNbreadId)
        onClose()
    }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-32 px-12 pb-8">
        <div className="flex flex-col gap-8">
          <h5>엔빵 초대를 수락하시겠어요?</h5>
          <p className="text-body02">
            {senderNbreadTitle}의 초대를 수락하시겠어요?
          </p>
        </div>
        <div className="flex h-48 flex-row gap-8">
          <button className="btn w-112 bg-gray-200 text-heading05"
          onClick={fetchInviteReject}
          >
            거절하기
          </button>
          <button
            className="btn w-112 bg-secondary-100 text-heading05"
            onClick={fetchInviteAccept}
          >
            수락하기
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default InviteAcceptModal
