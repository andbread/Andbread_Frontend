'use client'
import { useEffect, useState } from 'react'
import DetailHeader from '@/components/common/header/DetailHeader'
import { getNotification } from '@/lib/notification'
import useUserStore from '@/stores/useAuthStore'
import { Notification } from '@/types/notification'
import Icon from '@/components/common/icon/Icon'
import Spinner from '@/components/common/spinner/Spinner'
import FriendAcceptModal from '@/components/friend/FriendAcceptModal'
import { getRelativeTime } from '@/utils/getRelativeTime'

const Page = () => {
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
        {notificationData.map((data, index) => (
          <div
            className="card card-clickable relative flex cursor-pointer flex-row justify-between"
            key={data.id}
            onClick={() => {
              setSelectedNotifycationId(data.id)
              setSelectedNotifycationType(data.type)
              setSelectedNotifycationSenderName(
                (data.data as any)?.sender_name ?? null,
              )
              setSelectedNotifycationSenderId(
                (data.data as any)?.sender_id ?? null,
              )
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
