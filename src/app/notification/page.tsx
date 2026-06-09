'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DetailHeader from '@/components/common/header/DetailHeader'
import { getNotification } from '@/lib/notification'
import useUserStore from '@/stores/useAuthStore'
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
  const userData = useUserStore((state) => state.user)
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)
  const fetchNotifications = async () => {
    setIsLoading(true)
    const data = await getNotification(userData!.id)
    const sortedDataByCreatedAt = data.sort(
      (a, b) => Number(new Date(b.created_at)) - Number(new Date(a.created_at)),
    )
    setNotificationData(sortedDataByCreatedAt)
    if (sortedDataByCreatedAt.length > 0) {
      trackEvent(GA_EVENTS.RECEIVE_NOTIFICATION, {
        count: sortedDataByCreatedAt.length,
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (userData) {
      fetchNotifications()
    }
  }, [userData])
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
        <div
          className="cursor-pointer pb-2 text-body02 text-gray-400"
          onClick={
            () => null // TODO 알림 모두 지우기 함수 추가
          }
        >
          모두 지우기
        </div>
      </div>

      <div className="flex flex-col justify-between gap-8 px-20">
        {notificationData.map((data) => (
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
                const inviteToken = (data.data as InviteNotificationData | null)
                  ?.inviteToken

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
                <div className="text-body02 text-gray-600">{data.message}</div>
                <div className="text-body02 text-gray-300">
                  {getRelativeTime(data.created_at)}
                </div>
              </div>
            </div>
            <div
              className="absolute right-12 top-12 cursor-pointer"
              onClick={
                () => null // TODO 알림 삭제 함수 추가
              }
            >
              <Icon
                type={'cross'}
                width={16}
                height={16}
                fill={'text-gray-400'}
              />
            </div>
          </div>
        ))}
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
