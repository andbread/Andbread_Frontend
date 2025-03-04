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
import InvitationToNbreadModal from '@/components/inviteAccept/InvitationToNbreadModal'
import { getUser } from '@/lib/auth'
import { insertParticipant } from '@/lib/participant'
const HomePage = () => {
  const user = useUserStore((state) => state.user)
  const [nbreadList, setNbreadList] = useState<Nbread[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isModalOpen, setModalOpen] = useState<boolean>(false)
  const [groupId, setGroupId] = useState<string>()
  const currentMonth = new Date().getMonth() + 1

  // Nbread 및 Participant 정보를 DB로부터 fetch
  const fetchNbreads = async (userId: string) => {
    const nbreads = await getUserNbreads(userId)

    const nbreadsWithParticipants = await Promise.all(
      nbreads.map(async (nbread) => {
        const participants = await getParticipants(nbread.id)
        return { ...nbread, participants }
      }),
    )
    setNbreadList(nbreadsWithParticipants)

    setIsLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchNbreads(user.id)
  }, [user])

  // NbreadList가 업데이트된 후 totalAmount 계산
  useEffect(() => {
    const total = nbreadList.reduce(
      (sum: number, nbread: Nbread) =>
        sum + Math.floor(nbread.amount / Math.max(nbread.participantCount, 1)),
      0,
    )
    setTotalAmount(total)
  }, [nbreadList])
  const inviteAccept = () => {
    const fetchInviteData = async () => {
      const accessToken = sessionStorage.getItem('access_token')
      if (!accessToken) {
      } else {
        const data = await getUser(accessToken)
        console.log('user : ', data)
        if (data.data.user) {
          const provider = data.data.user.app_metadata.provider as
            | 'kakao'
            | 'google'

          const userInfo = {
            id: data.data.user.id,
            email: data.data.user.email || '',
            socialType: provider,
            name: data.data.user.user_metadata.full_name || '',
            profileImage: data.data.user.user_metadata.avatar_url || '',
          }
          const user = {
            user: userInfo,
            isLeader: false,
          }
          if (groupId) {
            const data = await insertParticipant(user, groupId)
            console.log(data)
            sessionStorage.removeItem('group_id')
          }
        }
      }
    }
    fetchInviteData()
    setModalOpen(false)
  }
  useEffect(() => {
    const groupId = sessionStorage.getItem('group_id')
    if (groupId) {
      setGroupId(groupId)
      setModalOpen(true)
    }
  }, [])

  return (
    <div className="flex flex-col justify-between p-24 pt-16">
      <Header />
      <main className="mt-24 p-4">
        {isLoading ? (
          <Spinner isLoading={isLoading} />
        ) : (
          <>
            <MonthlyNbread
              nbreadList={nbreadList}
              totalAmount={totalAmount}
              currentMonth={currentMonth}
            />
            <MyNbread nbreadList={nbreadList} />
          </>
        )}
      </main>
      {/* 초대 링크 페이지에서 로그인 필요문구를 받은 유저에게 보여지는 모달 */}
      <InvitationToNbreadModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={inviteAccept}
      />
    </div>
  )
}

export default HomePage
