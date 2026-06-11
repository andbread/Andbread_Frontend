'use client'

import { useEffect, useState } from 'react'
import DetailHeader from '@/components/common/header/DetailHeader'
import ToggleButton from '@/components/common/toggle/ToggleButton'
import PermissionDeniedModal from '@/components/common/modal/PermissionDeniedModal'
import Spinner from '@/components/common/spinner/Spinner'
import IOSGuideModal from '@/components/common/modal/IOSGuideModal'
import { getNotificationState } from '@/lib/notification/getNotificationState'
import { updateNotificationState } from '@/lib/notification/updateNotificationState'
import useUserStore from '@/stores/useAuthStore'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'

type NotificationItem = {
  id: 'chat' | 'invite' | 'friend' | 'payment'
  label: string
  field: 'chatEnabled' | 'inviteEnabled' | 'friendEnabled' | 'paymentEnabled'
}

const notificationItems: NotificationItem[] = [
  { id: 'chat', label: '채팅 알림', field: 'chatEnabled' },
  { id: 'invite', label: '초대 알림', field: 'inviteEnabled' },
  { id: 'friend', label: '친구 알림', field: 'friendEnabled' },
  { id: 'payment', label: '정산 알림', field: 'paymentEnabled' },
]

const NotificationSettingPage = () => {
  const user = useUserStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(true)
  const [isPermissionDeniedModalOpen, setIsPermissionDeniedModalOpen] =
    useState(false)
  const [allEnabled, setAllEnabled] = useState(false)
  const [itemStates, setItemStates] = useState<
    Record<NotificationItem['id'], boolean>
  >({
    chat: false,
    invite: false,
    friend: false,
    payment: false,
  })
  const {
    requestPermission,
    showIOSGuideModal,
    setShowIOSGuideModal,
    shouldShowIOSGuide,
  } = useNotificationPermission(user?.id, {
    autoRequest: false,
  })

  const syncItemStates = (enabled: boolean) => {
    setItemStates({
      chat: enabled,
      invite: enabled,
      friend: enabled,
      payment: enabled,
    })
  }

  const ensureNotificationPermission = async () => {
    const permission = await requestPermission()

    if (permission === 'unsupported' && shouldShowIOSGuide) {
      return false
    }

    if (permission === 'denied' || permission === 'unsupported') {
      setIsPermissionDeniedModalOpen(true)
      return false
    }

    return true
  }

  const handleAllToggle = async () => {
    if (!user) return

    const nextEnabled = !allEnabled

    if (nextEnabled) {
      const canEnable = await ensureNotificationPermission()
      if (!canEnable) return
    }

    await updateNotificationState(user.id, {
      allEnabled: nextEnabled,
      chatEnabled: nextEnabled,
      inviteEnabled: nextEnabled,
      friendEnabled: nextEnabled,
      paymentEnabled: nextEnabled,
    })
    trackEvent(GA_EVENTS.CHANGE_NOTIFICATION_SETTING, {
      target: 'all',
      enabled: nextEnabled,
    })
    setAllEnabled(nextEnabled)
    syncItemStates(nextEnabled)
  }

  const handleItemToggle = async (item: NotificationItem) => {
    if (!user) return

    const nextEnabled = !itemStates[item.id]

    if (nextEnabled) {
      const canEnable = await ensureNotificationPermission()
      if (!canEnable) return
    }

    await updateNotificationState(user.id, {
      [item.field]: nextEnabled,
    })
    trackEvent(GA_EVENTS.CHANGE_NOTIFICATION_SETTING, {
      target: item.id,
      enabled: nextEnabled,
    })
    setItemStates((prev) => ({
      ...prev,
      [item.id]: nextEnabled,
    }))
  }

  useEffect(() => {
    const fetchNotificationState = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      const notificationState = await getNotificationState(user.id)
      setAllEnabled(notificationState.allEnabled)
      setItemStates({
        chat: notificationState.chatEnabled,
        invite: notificationState.inviteEnabled,
        friend: notificationState.friendEnabled,
        payment: notificationState.paymentEnabled,
      })
      setIsLoading(false)
    }

    fetchNotificationState()
  }, [user])

  if (isLoading) {
    return <Spinner isLoading={isLoading} />
  }

  return (
    <div className="min-h-dvh bg-background px-24 pb-40 pt-24">
      <DetailHeader />
      <main className="mt-17">
        <h1 className="text-heading04 text-gray-800">알림 설정</h1>

        <section className="mt-18">
          <h2 className="mb-12 text-body03 text-gray-500">전체</h2>
          <div className="card flex h-68 items-center justify-between px-24 py-0">
            <span className="text-body02 text-gray-800">전체 알림</span>
            <ToggleButton
              ariaLabel="전체 알림 설정"
              enabled={allEnabled}
              onClick={handleAllToggle}
            />
          </div>
        </section>

        <section className="mt-40">
          <h2 className="mb-12 text-body03 text-gray-500">개별 알림</h2>
          <div className="card px-24 py-24">
            <ul className="flex flex-col gap-20">
              {notificationItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span className="text-body02 text-gray-800">
                    {item.label}
                  </span>
                  <ToggleButton
                    ariaLabel={`${item.label} 설정`}
                    enabled={itemStates[item.id]}
                    onClick={() => handleItemToggle(item)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <PermissionDeniedModal
        isOpen={isPermissionDeniedModalOpen}
        onClose={() => setIsPermissionDeniedModalOpen(false)}
      />
      <IOSGuideModal
        isOpen={showIOSGuideModal}
        onClose={() => setShowIOSGuideModal(false)}
      />
    </div>
  )
}

export default NotificationSettingPage
