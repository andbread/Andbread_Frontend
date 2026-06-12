import { useEffect, useReducer } from 'react'
import Modal from '../common/modal/Modal'
import { updateAcceptFriend,updateRejectedFriend } from '@/lib/friend/updateFriend'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'
interface FriendAcceptModalProps {
  id: number | null
//   type : string | null
  senderUserName: string | null
  senderUserId: string | null
  receiverId: string
  isOpen: boolean
  onClose: () => void
}
const FriendAcceptModal = ({
  isOpen,
  onClose,
  senderUserName,
  receiverId,
  id,
//   type,
  senderUserId
}: FriendAcceptModalProps) => {
  const fetchUpdateAccept = async () => {
    const acceptData = await updateAcceptFriend(
      receiverId,
      senderUserId,
    )
    if (acceptData) {
      trackEvent(GA_EVENTS.ACCEPT_FRIEND, { sender_id: senderUserId })
    }
    onClose()
  }
  const fetchUpdateReject = async() => {
    const rejectData = await updateRejectedFriend(
      receiverId,
      senderUserId,
    )
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-32 px-12 pb-8">
        <div className="flex flex-col gap-8">
          <h5>친구 신청을 수락하시겠어요?</h5>
          <p className="text-body02">
            {senderUserName}님의 친구 신청을 수락하시겠어요?
          </p>
        </div>
        <div className="flex h-48 flex-row gap-8">
          <button className="btn w-112 bg-gray-200 text-heading05"
          onClick={fetchUpdateReject}>
            거절하기
          </button>
          <button
            className="btn w-112 bg-secondary-100 text-heading05"
            onClick={fetchUpdateAccept}
          >
            수락하기
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default FriendAcceptModal
