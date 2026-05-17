import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useUserStore from '@/stores/useAuthStore'
import { getNotificationState } from '@/lib/notification/getNotificationState'
import Icon from '@/components/common/icon/Icon'

const BasicList = () => {
  const router = useRouter()
  const user = useUserStore()
  const [isToggle, setIsToggle] = useState(false) // 추후 유저 알림 상태를 초기 상태로 둘 예정

  const handleFriendList = () => {
    router.push('/friendList')
  }

  const handleNotificationSetting = () => {
    router.push('/mypage/notification-setting')
  }

  useEffect(() => {
    const fetchNotificationState = async () => {
      if (!user.user) return

      const notificationState = await getNotificationState(user.user.id)
      setIsToggle(notificationState.allEnabled)
    }

    fetchNotificationState()
  }, [user])

  return (
    <div className="card p-28">
      <ul>
        <li
          className="mb-20 flex cursor-pointer flex-row items-center justify-between"
          onClick={handleNotificationSetting}
        >
          <span className="text-body02 text-gray-800">알림 설정</span>
          <Icon type="angleRight" width={16} height={16} fill="text-gray-300" />
        </li>

        <li
          className="cursor-pointer text-body02 text-gray-800"
          onClick={handleFriendList}
        >
          친구 목록
        </li>
      </ul>
    </div>
  )
}
export default BasicList
