'use client'
import { useEffect, useState } from 'react'
import { getUserNbreads } from '@/lib/nbread'
import Header from '@/components/home/Header'
import MonthlyNbread from '@/components/home/MonthlyNbread'
import MyNbread from '@/components/home/MyNbread'
import { Nbread } from '@/types/nbread'
import useUserStore from '@/stores/useAuthStore'
import { getParticipants } from '@/lib/participant'

const HomePage = () => {
  const user = useUserStore((state) => state.user)
  const [nbreadList, setNbreadList] = useState<Nbread[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

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

  return (
    <div className="flex flex-col justify-between p-24 pt-16">
      <Header />
      <main className="mt-24 p-4">
        <MonthlyNbread
          nbreadList={nbreadList}
          totalAmount={totalAmount}
          currentMonth={currentMonth}
        />
        <MyNbread nbreadList={nbreadList} />
      </main>
    </div>
  )
}

export default HomePage
