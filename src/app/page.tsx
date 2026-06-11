'use client'
import { useEffect, useState } from 'react'
import { getUserNbreads } from '@/lib/nbread'
import Header from '@/components/home/Header'
import MonthlyNbread from '@/components/home/MonthlyNbread'
import MyNbread from '@/components/home/MyNbread'
import { Nbread } from '@/types/nbread'
import useUserStore from '@/stores/useAuthStore'
import { getParticipants } from '@/lib/participant'
import Spinner from '@/components/common/spinner/Spinner'
import NotificationPermissionModal from '@/components/common/modal/NotificationPermissionModal'
import NotificationDeniedModal from '@/components/common/modal/NotificationDeniedModal'
import ReceivedInviteBanner from '@/components/home/ReceivedInviteBanner'
import { getPendingInvites } from '@/lib/invite/getPendingInvites'
import type { PendingInvite } from '@/lib/invite/getPendingInvites'

// [ ] OS 알림 허용 후 모달 닫힘
// [ ] OS 알림 허용 상태 확인해서 모달 열기

const HomePage = () => {
  const user = useUserStore((state) => state.user)
  const [nbreadList, setNbreadList] = useState<Nbread[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotificationDeniedModalOpen, setIsNotificationDeniedModalOpen] =
    useState<boolean>(false)
  const currentMonth = new Date().getMonth() + 1

  // Nbread 및 Participant 정보를 DB로부터 fetch
  const fetchNbreads = async (userId: string) => {
    try {
      const [nbreads, invites] = await Promise.all([
        getUserNbreads(userId),
        // 초대 조회 실패가 기존 홈 엔빵 조회까지 막지 않도록 빈 목록으로 처리한다.
        getPendingInvites(userId).catch(() => []),
      ])

      const nbreadsWithParticipants = await Promise.all(
        nbreads.map(async (nbread) => {
          const participants = await getParticipants(nbread.id)
          return { ...nbread, participants }
        }),
      )
      setNbreadList(nbreadsWithParticipants)
      setPendingInvites(invites)
    } catch {
      setNbreadList([])
      setPendingInvites([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchNbreads(user.id)
    // testSendPaymentNotification()
    // test()
  }, [user])

  // NbreadList가 업데이트된 후 totalAmount 계산
  useEffect(() => {
    const total = monthlyNbreadList.reduce(
      (sum: number, nbread: Nbread) =>
        sum + Math.floor(nbread.amount / Math.max(nbread.participantCount, 1)),
      0,
    )
    setTotalAmount(total)
  }, [nbreadList])

  return (
    <div className="flex flex-col justify-between p-24 pt-16">
      <Header />
      <main className="mt-24 p-4">
        {isLoading ? (
          <Spinner isLoading={isLoading} />
        ) : (
          <>
            <ReceivedInviteBanner invites={pendingInvites} />
            <MonthlyNbread
              nbreadList={monthlyNbreadList}
              totalAmount={totalAmount}
              currentMonth={currentMonth}
            />
            <MyNbread nbreadList={myNbreadList} />
          </>
        )}
      </main>
      {/* iOS 알림 권한 요청 모달 */}
      <NotificationPermissionModal
        userId={user?.id}
        handlePermissionDenied={() => setIsNotificationDeniedModalOpen(true)}
      />
      <NotificationDeniedModal
        isOpen={isNotificationDeniedModalOpen}
        onClose={() => setIsNotificationDeniedModalOpen(false)}
      />
    </div>
  )
}

export default HomePage
