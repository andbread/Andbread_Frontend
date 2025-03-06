import { useEffect, useState } from 'react'
import Icon from '../common/icon/Icon'

import { fetchNbreadData } from '@/lib/nbread/fetchNbreadData'

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일']

interface CalendarProps {
  currentDate: Date
  onMonthChange: (newDate: Date) => void
  userId: string | null
  onDateSelect: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  onMonthChange,
  userId,
  onDateSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [paymentDates, setPaymentDates] = useState<number[]>([])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()

  const prevLastDate = new Date(year, month, 0).getDate()
  const prevDates = Array.from(
    { length: firstDay },
    (_, i) => prevLastDate - firstDay + i + 1,
  )
  const currentDates = Array.from({ length: lastDate }, (_, i) => i + 1)
  const totalDays = prevDates.length + currentDates.length
  const nextDates = Array.from(
    { length: totalDays % 7 ? 7 - (totalDays % 7) : 0 },
    (_, i) => i + 1,
  )

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect(date)
  }

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1)
    onMonthChange(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1)
    onMonthChange(newDate)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    )
  }

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      const data = await fetchNbreadData(userId)
      if (data) {
        const payDates = data
          .filter((item) => item.payment_date !== null)
          .map((item) => {
            const paymentDate = item.payment_date
            if (paymentDate instanceof Date) {
              return paymentDate.getMonth() === month
                ? paymentDate.getDate()
                : null
            }
            if (typeof paymentDate === 'string') {
              const parsedDate = new Date(paymentDate)
              return parsedDate.getMonth() === month
                ? parsedDate.getDate()
                : null
            }
            return null
          })
          .filter((date) => date !== null)
        setPaymentDates(payDates as number[])
      }
    }

    fetchData()
  }, [userId, month])

  return (
    <div className="shadow-card mb-20 h-auto w-full bg-white pt-20">
      <div className="mb-32 flex items-center justify-between">
        <div className="cursor-pointer pl-28">
          <Icon
            type="angleLeft"
            onClick={prevMonth}
            width="12"
            height="12"
            fill={'text-gray-400'}
          />
        </div>
        <h2 className="text-body-04 gray-400">{month + 1}월</h2>
        <div className="cursor-pointer pr-28">
          <Icon
            type="angleRight"
            onClick={nextMonth}
            width="12"
            height="12"
            fill={'text-gray-400'}
          />
        </div>
      </div>

      <div className="text-body-04 mb-24 grid grid-cols-7 px-12 text-center text-gray-400">
        {daysOfWeek.map((day, index) => (
          <div
            key={day}
            className={`p-1 ${index === 6 ? 'text-system-red' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="mb-20 grid grid-cols-7 px-12 text-center">
        {prevDates.map((day, index) => (
          <div key={`prev-${index}`} className="mb-16 p-2 text-gray-400">
            {day}
          </div>
        ))}

        {currentDates.map((day) => (
          <div
            key={day}
            className={`relative mx-auto mb-16 flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full ${
              selectedDate?.getDate() === day &&
              selectedDate?.getMonth() === month
                ? 'bg-secondary-100'
                : isToday(day)
                  ? 'bg-primary-200'
                  : 'hover:bg-secondary-100'
            }`}
            onClick={() => handleDateClick(new Date(year, month, day))}
          >
            {day}
            {paymentDates.includes(day) && (
              <div className="mt-1 h-[6px] w-[6px] rounded-full bg-primary-500"></div>
            )}
          </div>
        ))}

        {nextDates.map((day, index) => (
          <div key={`next-${index}`} className="p-2 text-gray-400">
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar
