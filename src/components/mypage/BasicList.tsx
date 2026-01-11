import { useEffect, useState } from 'react'
import ToggleButton from '../common/toggle/ToggleButton'
import { useRouter } from 'next/navigation'
import useUserStore from '@/stores/useAuthStore'
import NotificationPermissionModal from '@/components/common/modal/NotificationPermissionModal'
import NotificationDeniedModal from '@/components/common/modal/NotificationDeniedModal'
import { set } from 'nprogress'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { getNotificationState } from '@/lib/notification/getNotificationState'
import { updateNotificationState } from '@/lib/notification/updateNotificationState'
import PermissionDeniedModal from '@/components/common/modal/PermissionDeniedModal'

const BasicList = () => {
  const router = useRouter()
  const user = useUserStore()
  const [isToggle, setIsToggle] = useState(false) // 추후 유저 알림 상태를 초기 상태로 둘 예정
  const [isNotificationDeniedModalOpen, setIsNotificationDeniedModalOpen] =
    useState(false)
  const [isPermissionDeniedModalOpen, setIsPermissionDeniedModalOpen] =
    useState(false)
  const { requestPermission } = useNotificationPermission(user.user?.id)

  const handleToggle = async () => {
    if (!isToggle) {
      const permission = await requestPermission()

      if (permission === 'denied') {
        setIsPermissionDeniedModalOpen(true)
        return
      }
    }
    await updateNotificationState(user.user!.id, !isToggle)
    setIsToggle(!isToggle)
  }

  const handleFriendList = () => {
    router.push('/friendList')
  }

  useEffect(() => {
    const fetchNotificationState = async () => {
      if (!user.user) return

      const notificationState = await getNotificationState(user.user.id)
      setIsToggle(notificationState)
    }

    fetchNotificationState()
  }, [user])

  return (
    <div className="card p-28">
      <ul>
        <div className="mb-20 flex flex-row items-center justify-between">
          <li className="text-body02 text-gray-800">알림 설정</li>
          <div className="flex flex-row items-center">
            <span className="pr-10 text-body03 text-gray-300">
              {isToggle ? '알림 끄기' : '알림 켜기'}
            </span>
            <ToggleButton onClick={handleToggle} enabled={isToggle} />
          </div>
        </div>

        <li
          className="cursor-pointer text-body02 text-gray-800"
          onClick={handleFriendList}
        >
          친구 목록
        </li>
      </ul>
      <NotificationPermissionModal
        userId={user.user?.id}
        handlePermissionDenied={() => setIsNotificationDeniedModalOpen(true)}
      />
      <NotificationDeniedModal
        isOpen={isNotificationDeniedModalOpen}
        onClose={() => setIsNotificationDeniedModalOpen(false)}
      />
      <PermissionDeniedModal
        isOpen={isPermissionDeniedModalOpen}
        onClose={() => setIsPermissionDeniedModalOpen(false)}
      />
    </div>
  )
}
export default BasicList
