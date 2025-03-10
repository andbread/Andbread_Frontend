import { useEffect, useState } from 'react'
import Modal from './Modal'
import { getUserTotalNbreadAmount } from '@/lib/nbread/getUserTotalNbreadAmount'
import useUserStore from '@/stores/useAuthStore'

interface MyNbreadSumModalProps {
  isOpen: boolean
  onClose: () => void
}

const MyNbreadSumModal = ({ isOpen, onClose }: MyNbreadSumModalProps) => {
  const [totalAmount, setTotalAmount] = useState(0)
  const userData = useUserStore((state) => state.user)

  useEffect(() => {
    if (userData?.id) {
      const fetchTotalAmount = async () => {
        const total = await getUserTotalNbreadAmount(userData.id)
        setTotalAmount(total)
      }
      fetchTotalAmount()
    }
  }, [userData?.id])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p className="text-center text-heading04 font-bold text-gray-800">
        내가 그동안 엔빵한 총 금액은?
      </p>
      <p className="mt-24 text-center text-heading01 text-secondary-300">
        {totalAmount.toLocaleString()}원
      </p>
      <button onClick={onClose} className="btn btn-primary btn-medium m-12">
        알겠어요
      </button>
    </Modal>
  )
}

export default MyNbreadSumModal
