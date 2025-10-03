'use client'
import { useEffect, useState } from 'react'
import DetailHeader from '@/components/common/header/DetailHeader'
import { getNotification } from '@/lib/notification'
import useUserStore from '@/stores/useAuthStore'
import { Notification } from '@/types/notification'
import Spinner from '@/components/common/spinner/Spinner'
import { useToast } from '@/components/common/toast/Toast'
import { useRouter } from 'next/navigation'
import { Json } from '@/types/supabase'

const Page = () => {
  const [notificationData, setNotificationData] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const userData = useUserStore((state) => state.user)
  const router = useRouter()

  const fetchNotifications = async () => {
    setIsLoading(true)
    const data = await getNotification(userData!.id)
    const sortedDataByCreatedAt = data.sort(
      (a, b) => Number(new Date(b.created_at)) - Number(new Date(a.created_at)),
    )
    setNotificationData(sortedDataByCreatedAt)
    console.log(sortedDataByCreatedAt)
    setIsLoading(false)
  }

  // ----------- 태평양시 기준 시간을 알림 기준 시간으로 변경하는 함수 ----------- //
  function getRelativeTime(utcDateString: string): string {
    const KST_OFFSET = 9 * 60 * 60 * 1000 // 한국은 UTC+9
    const now = new Date(Date.now() + KST_OFFSET)
    const past = new Date(new Date(utcDateString).getTime() + KST_OFFSET)

    const diff = now.getTime() - past.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const month = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
    const year = Math.floor(diff / (1000 * 60 * 60 * 24 * 30 * 12))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 30) return `${days}일 전`
    if (month < 12) return `${month}개월 전`
    return `${year}년 전`
  }

  // -------------- 알림 아이템 클릭 시 알림 타입에 따라 처리하는 함수 ------------- //
  function notificationOnclickHandler(type: string, data: Json | null) {
    const parsedData = data as Record<string, unknown>

    console.log(type, data)
    if (!type || !data) {
      useToast.error('잘못된 요청입니다. 다시 시도해주세요.')
      return
    }

    switch (type) {
      // chat, payment : 해당 엔빵 페이지로 이동
      case 'chat':
      case 'payment':
        const nbreadId = parsedData['nbreadId'] as string
        router.replace(`/nbread/${nbreadId}`)
        break
      case 'nbread-invite':
        // NOTE 엔빵 초대 관련 로직 추가
        break

      case 'friend-request':
        // NOTE 친구 초대 관련 로직 추가
        break
    }
  }

  useEffect(() => {
    if (userData) {
      fetchNotifications()
    }
  }, [userData])

  if (isLoading) {
    return <Spinner isLoading={isLoading} />
  }

  return (
    <div className="jusfity-between flex h-full w-full flex-col overflow-y-hidden">
      <div className="pl-24 pt-24">
        <DetailHeader />
      </div>
      <div className="mb-16 flex flex-row items-end justify-between px-24 pt-24">
        <header className="text-heading02 text-gray-800">알림</header>
      </div>

      <div className="flex flex-col justify-between gap-8 overflow-y-auto px-20 pb-40 pt-4">
        {notificationData.map((item, _) => (
          <div
            className="card card-clickable relative flex cursor-pointer flex-row justify-between"
            key={item.id}
            onClick={() => notificationOnclickHandler(item.type, item.data)}
          >
            <div className="flex w-full flex-col gap-4">
              <div className="text-body01 text-gray-800">{item.title}</div>
              <div className="flex w-full flex-row justify-between">
                <div className="text-body02 text-gray-600">{item.message}</div>
                <div className="text-body02 text-gray-300">
                  {getRelativeTime(item.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Page
