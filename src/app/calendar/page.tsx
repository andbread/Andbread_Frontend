'use client'

import { useState, useEffect, useMemo } from 'react'
import NbreadCard from '@/components/home/NbreadCard'
import { getUserNbreads } from '@/lib/nbread/getUserNbread'
import Calendar from '@/components/calendar/calendar'
import DetailHeader from '@/components/common/header/DetailHeader'
import { Nbread } from '@/types/nbread'

interface CalendarPageProps {
  nbreads: Nbread[]
}
const CalendarPage = ({}: CalendarPageProps) => {
  const [userId, setUserId] = useState<string | null>(null)
  const [nbreadList, setNbreadList] = useState<Nbread[]>([])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userStore = sessionStorage.getItem('user-store')
    if (userStore) {
      const userData = JSON.parse(userStore).state?.user
      if (userData?.id) {
        setUserId(userData.id)
      }
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    const fetchNbreads = async () => {
      try {
        const nbreads = await getUserNbreads(userId)
        setNbreadList(nbreads)
        setLoading(false)
      } catch (error) {
        console.error('🚨 엔빵 데이터 가져오기 실패:', error)
        setLoading(false)
      }
    }
    fetchNbreads()
  }, [userId])

  // 날짜 필터링
  const filteredNbreadList = useMemo(() => {
    if (!selectedDate) return []

    const filtered = nbreadList.filter((nbread) => {
      const currentPaymentDate = nbread.currentPaymentDate
        ? new Date(nbread.currentPaymentDate)
        : null
      const nextPaymentDate = nbread.paymentDate
        ? new Date(nbread.paymentDate)
        : null

      // currentPaymentDate와 nextPaymentDate가 유효하지 않으면 필터링에서 제외
      if (!currentPaymentDate && !nextPaymentDate) return false

      // selectedDate와 currentPaymentDate 또는 nextPaymentDate를 비교
      const isSameDate =
        (currentPaymentDate &&
          currentPaymentDate.getDate() === selectedDate.getDate() &&
          currentPaymentDate.getMonth() === selectedDate.getMonth() &&
          currentPaymentDate.getFullYear() === selectedDate.getFullYear()) ||
        (nextPaymentDate &&
          nextPaymentDate.getDate() === selectedDate.getDate() &&
          nextPaymentDate.getMonth() === selectedDate.getMonth() &&
          nextPaymentDate.getFullYear() === selectedDate.getFullYear())

      return isSameDate
    })

    return filtered
  }, [nbreadList, selectedDate])

  useEffect(() => {}, [filteredNbreadList])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  return (
    <main className="flex h-full flex-col">
      <div className="bg-white pl-24 pt-24">
        <DetailHeader />
      </div>
      <Calendar
        currentDate={currentDate}
        onMonthChange={handleMonthChange}
        userId={userId}
        onDateSelect={handleDateSelect}
      />
      <div className="mb-20 flex flex-col gap-8 px-24">
        {loading ? (
          <div />
        ) : filteredNbreadList.length > 0 ? (
          filteredNbreadList.map((nbread) => (
            <NbreadCard
              key={nbread.id}
              nbread={nbread}
              showParticipants={false}
            />
          ))
        ) : (
          <div />
        )}
      </div>
    </main>
  )
}

export default CalendarPage
