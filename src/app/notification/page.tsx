'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DetailHeader from '@/components/common/header/DetailHeader'
import {
  deleteAllNotifications,
  deleteNotification,
  getNotification,
} from '@/lib/notification'
import useUserStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import { Notification } from '@/types/notification'
import Icon from '@/components/common/icon/Icon'
import Spinner from '@/components/common/spinner/Spinner'
import FriendAcceptModal from '@/components/friend/FriendAcceptModal'
import { getRelativeTime } from '@/utils/getRelativeTime'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'
import { useToast } from '@/components/common/toast/Toast'

interface InviteNotificationData {
  inviteToken?: string
}

interface FriendNotificationData {
  sender_name?: string
  sender_id?: string
}

const Page = () => {
  const router = useRouter()
  const [notificationData, setNotificationData] = useState<Notification[]>([])
  const [selectedNotifycationId, setSelectedNotifycationId] = useState<
    number | null
  >(null)
  const [selectedNotifycationType, setSelectedNotifycationType] = useState<
    string | null
  >(null)
  const [selectedNotifycationSenderName, setSelectedNotifycationSenderName] =
    useState<string | null>(null)
  const [selectedNotifycationSenderId, setSelectedNotifycationSenderId] =
    useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [deletingNotificationId, setDeletingNotificationId] = useState<
    number | null
  >(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const userData = useUserStore((state) => state.user)
  const setNotificationCount = useNotificationStore((state) => state.setCount)
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!userData) return

    setIsLoading(true)
    try {
      const data = await getNotification(userData.id)
      setNotificationData(data)
      setNotificationCount(data.length)
      if (data.length > 0) {
        trackEvent(GA_EVENTS.RECEIVE_NOTIFICATION, {
          count: data.length,
        })
      }
    } catch (error) {
      console.error(error)
      useToast.error('알림을 불러오지 못했어요. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [setNotificationCount, userData])

  const handleDeleteNotification = async (notificationId: number) => {
    if (!userData || deletingNotificationId !== null || isDeletingAll) return

    setDeletingNotificationId(notificationId)
    try {
      await deleteNotification(notificationId, userData.id)
      const nextNotifications = notificationData.filter(
        (notification) => notification.id !== notificationId,
      )
      setNotificationData(nextNotifications)
      setNotificationCount(nextNotifications.length)
    } catch (error) {
      console.error(error)
      useToast.error('알림 삭제에 실패했어요. 다시 시도해주세요.')
    } finally {
      setDeletingNotificationId(null)
    }
  }

  const handleDeleteAllNotifications = async () => {
    if (!userData || notificationData.length === 0 || isDeletingAll) return

    setIsDeletingAll(true)
    try {
      await deleteAllNotifications(userData.id)
      setNotificationData([])
      setNotificationCount(0)
    } catch (error) {
      console.error(error)
      useToast.error('알림 전체 삭제에 실패했어요. 다시 시도해주세요.')
    } finally {
      setIsDeletingAll(false)
    }
  }

  useEffect(() => {
    if (userData) {
      void fetchNotifications()
    }
  }, [fetchNotifications, userData])

  useEffect(() => {
    if (selectedNotifycationType === 'friend_request') {
      setIsAcceptModalOpen(true)
    }
  }, [selectedNotifycationType])
  if (isLoading) {
    return <Spinner isLoading={isLoading} />
  }

  return (
    <div className="jusfity-between flex h-screen w-full flex-col overflow-y-hidden">
      <div className="pl-24 pt-24">
        <DetailHeader />
      </div>
      <div className="mb-16 flex flex-row items-end justify-between px-24 pt-24">
        <header className="text-heading02 text-gray-800">알림</header>
        <button
          type="button"
          className="pb-2 text-body02 text-gray-400 disabled:cursor-not-allowed disabled:text-gray-300"
          onClick={handleDeleteAllNotifications}
          disabled={
            notificationData.length === 0 ||
            isDeletingAll ||
            deletingNotificationId !== null
          }
        >
          {'모두 지우기'}
        </button>
      </div>

      <div className="flex h-full flex-col justify-between gap-8 px-20">
        {notificationData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-body01 text-gray-400">알림이 없어요.</p>
          </div>
        ) : (
          notificationData.map((data) => (
            <div
              className="card card-clickable relative flex cursor-pointer flex-row justify-between"
              key={data.id}
              onClick={() => {
                trackEvent(GA_EVENTS.CLICK_NOTIFICATION, {
                  notification_type: data.type,
                  notification_id: data.id,
                })
                if (data.type === 'invite') {
                  // 모든 엔빵 초대 알림은 토큰 기반 단일 초대 페이지로 이동한다.
                  const inviteToken = (
                    data.data as InviteNotificationData | null
                  )?.inviteToken

                  if (!inviteToken) {
                    useToast.error('초대 정보를 찾을 수 없어요.')
                    return
                  }

                  router.push(`/invite/${inviteToken}`)
                } else if (data.type === 'friend_request') {
                  // 친구 요청 알림일 경우
                  const friendData = data.data as FriendNotificationData | null
                  setSelectedNotifycationId(data.id)
                  setSelectedNotifycationType(data.type)
                  setSelectedNotifycationSenderName(
                    friendData?.sender_name ?? null,
                  )
                  setSelectedNotifycationSenderId(friendData?.sender_id ?? null)
                }
              }}
            >
              <div className="flex w-full flex-col gap-4">
                <div className="text-body01 text-gray-800">{data.title}</div>
                <div className="flex w-full flex-row justify-between">
                  <div className="text-body02 text-gray-600">
                    {data.message}
                  </div>
                  <div className="text-body02 text-gray-300">
                    {getRelativeTime(data.created_at)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label={`${data.title} 알림 지우기`}
                className="absolute right-12 top-12 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isDeletingAll || deletingNotificationId !== null}
                onClick={(event) => {
                  event.stopPropagation()
                  void handleDeleteNotification(data.id)
                }}
              >
                <Icon
                  type={'cross'}
                  width={16}
                  height={16}
                  fill={'text-gray-400'}
                />
              </button>
            </div>
          ))
        )}
      </div>
      <FriendAcceptModal
        senderUserId={selectedNotifycationSenderId}
        id={selectedNotifycationId}
        isOpen={isAcceptModalOpen}
        onClose={() => {
          setIsAcceptModalOpen(false)
          setSelectedNotifycationType(null)
        }}
        senderUserName={selectedNotifycationSenderName}
        receiverId={userData?.id as string}
      />
    </div>
  )
}

export default Page
