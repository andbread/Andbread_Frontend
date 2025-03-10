'use client'
import { useState } from 'react'
import InviteAcceptModal from './InviteAcceptModal'
import { useRouter } from 'next/navigation'
const InviteAcceptButton = () => {
  const [isModalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const handleModalClose = () => {
    setModalOpen(false)
  }
  const handleHome = () => {
    router.push('/')
  }
  return (
    <div className="mb-64 flex flex-col">
      <button
        className="btn-large mb-20 rounded-8 bg-secondary-100 text-white"
        onClick={() => setModalOpen(true)}
      >
        초대 수락하기 🍞
      </button>
      <button className="text-body02 text-gray-600" onClick={handleHome}>
        홈으로 가기
      </button>
      <InviteAcceptModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  )
}
export default InviteAcceptButton
