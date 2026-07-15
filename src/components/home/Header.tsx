'use client'

import { useRouter } from 'next/navigation'
import Icon from '@/components/common/icon/Icon'
import Avatar from '@/components/common/avatar/avatar'
import NbreadTextLogo from '@/assets/logo/nbread-logo-text.svg'
import useUserStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import { getNotification } from '@/lib/notification'
import { useEffect } from 'react'

const Header = () => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const notificationCount = useNotificationStore((state) => state.count)
  const setNotificationCount = useNotificationStore((state) => state.setCount)

  useEffect(() => {
    if (!user) {
      setNotificationCount(0)
      return
    }

    getNotification(user.id)
      .then((notifications) =>
        setNotificationCount(
          notifications.filter((notification) => !notification.is_read).length,
        ),
      )
      .catch((error) => {
        console.error('Error fetching notification count:', error)
      })
  }, [setNotificationCount, user])

  return (
    <header className="my-16 flex items-start justify-between p-4">
      <div className="cursor-pointer" onClick={() => router.replace('/home')}>
        <NbreadTextLogo />
      </div>
      <div className="flex h-full flex-row items-center gap-16">
        <div
          onClick={() => router.push('/notification')}
          className="relative mr-4 cursor-pointer"
        >
          <Icon type="alarm" width={24} height={24} fill="text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -right-6 -top-6 flex h-16 min-w-16 items-center justify-center rounded-full bg-system-red01 px-4 text-[10px] font-semibold leading-none text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </div>
        <div
          onClick={() => router.push('/calendar')}
          className="mb-2 cursor-pointer"
        >
          <Icon type="calendar" width={24} height={24} fill="text-gray-600" />
        </div>
        <button
          onClick={() => router.push('/mypage')}
          className="cursor-pointer"
        >
          <Avatar
            size="large"
            profileImageUrl={user ? user.profileImage : undefined}
          />
        </button>
      </div>
    </header>
  )
}

export default Header
