import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import LogoutModal from '../user/LogoutModal'
import DeleteAccountModal from '../user/DeleteAccountModal'
import { Dispatch, RefObject, SetStateAction, useState } from 'react'
import { deleteAccount } from '@/lib/auth'

interface ManageProps {
  setAuthProgress: Dispatch<SetStateAction<boolean>>
}

const Manage = ({ setAuthProgress }: ManageProps) => {
  const router = useRouter()
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)

  const handleLogout = async () => {
    setAuthProgress(true)
    await logout(router)
  }
  const handleDeleteAccount = async () => {
    setAuthProgress(true)
    setDeleteAccountModalOpen(false)
    await deleteAccount(router)
  }

  return (
    <div className="card mt-4 p-24">
      <ul className="py-2">
        <li
          className="cursor-pointer py-10 text-body02 text-gray-800"
          onClick={() => setLogoutModalOpen(true)}
        >
          로그아웃
        </li>
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onSubmit={handleLogout}
        />
        <li
          className="cursor-pointer py-10 text-body02 text-gray-800"
          onClick={() => setDeleteAccountModalOpen(true)}
        >
          탈퇴하기
        </li>
        <DeleteAccountModal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => setDeleteAccountModalOpen(false)}
          onSubmit={handleDeleteAccount}
        />
      </ul>
    </div>
  )
}

export default Manage
