import { useEffect, useState } from "react"
import Icon from "../common/icon/Icon"

import { fetchNbreadData } from "@/lib/nbread/fetchNbreadData"

const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"]

interface CalendarProps {
  currentDate: Date
  onMonthChange: (newDate: Date) => void
  userId: string | null
  onDateSelect: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, onMonthChange, userId, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [paymentDates, setPaymentDates] = useState<number[]>([])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()

  const prevLastDate = new Date(year, month, 0).getDate()
  const prevDates = Array.from({ length: firstDay }, (_, i) => prevLastDate - firstDay + i + 1)
  const currentDates = Array.from({ length: lastDate }, (_, i) => i + 1)
  const totalDays = prevDates.length + currentDates.length
  const nextDates = Array.from({ length: totalDays % 7 ? 7 - (totalDays % 7) : 0 }, (_, i) => i + 1)

  

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
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
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
              return paymentDate.getMonth() === month ? paymentDate.getDate() : null
            }
            if (typeof paymentDate === "string") {
              const parsedDate = new Date(paymentDate)
              return parsedDate.getMonth() === month ? parsedDate.getDate() : null
            }
            return null
          })
          .filter((date) => date !== null)
        setPaymentDates(payDates as number[])
      }
    };

    fetchData()
  }, [userId, month])

  return (
    <div className="w-full h-[390px] bg-white pt-[16px] mb-[20px]">
      <div className="flex justify-between items-center mb-[20px]">
        <div className="pl-[24px] cursor-pointer">
          <Icon type="angleLeft" onClick={prevMonth} width="10" height="10" />
        </div>
        <h2 className="text-body-04 gray-400">{month + 1}월</h2>
        <div className="pr-[24px] cursor-pointer">
          <Icon type="angleRight" onClick={nextMonth} width="10" height="10" />
        </div>
      </div>

      <div className="mt-4 mb-[12px] grid grid-cols-7 gap-1 text-center text-body-04 text-gray-400">
        {daysOfWeek.map((day, index) => (
          <div key={day} className={`p-1 ${index === 6 ? "text-system-red" : ""}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-[16px]">
        {prevDates.map((day, index) => (
          <div key={`prev-${index}`} className="p-2 text-gray-400 mb-[16px]">
            {day}
          </div>
        ))}

        {currentDates.map((day) => (
          <div
            key={day}
            className={`relative w-[32px] h-[32px] mx-auto mb-[16px] flex flex-col items-center justify-center cursor-pointer rounded-full ${
              selectedDate?.getDate() === day &&
              selectedDate?.getMonth() === month
                ? "bg-secondary-100"
                : isToday(day)
                ? "bg-primary-200"
                : "hover:bg-secondary-100"
            }`}
            onClick={() => handleDateClick(new Date(year, month, day))}
          >
            {day}
            {paymentDates.includes(day) && (
              <div className="w-[6px] h-[6px] bg-primary-500 rounded-full mt-1"></div>
            )}
          </div>
        ))}

        {nextDates.map((day, index) => (
          <div key={`next-${index}`} className="p-2 text-gray-400 mb-[16px]">
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar
