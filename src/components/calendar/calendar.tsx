"use client"; 

import { useState } from "react";
import Icon from "../common/icon/icon";

const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 이전 달의 마지막 날짜
  const prevLastDate = new Date(year, month, 0).getDate();

  // 이전 달 날짜 채우기
  const prevDates = Array.from({ length: firstDay }, (_, i) => prevLastDate - firstDay + i + 1);

  // 현재 달 날짜 채우기
  const currentDates = Array.from({ length: lastDate }, (_, i) => i + 1);

  // 다음 달 날짜 채우기 (5행 또는 6행이 되도록 조정)
  const totalDays = prevDates.length + currentDates.length;
  const nextDates = Array.from({ length: totalDays % 7 ? 7 - (totalDays % 7) : 0 }, (_, i) => i + 1);

  // 날짜 선택 핸들러
  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return; // 현재 달 이외의 날짜는 선택 불가
    setSelectedDate(new Date(year, month, day));
  };

  // 이전 달 이동
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // 다음 달 이동
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 오늘 날짜 스타일링
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div>
    <div className="w-full h-[390px] bg-white pt-[20px]">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-[20px]">
        <div className="pl-[24px] cursor-pointer">
          <Icon type="angleLeft" onClick={prevMonth} width="10" height="10" />
        </div>
        <h2 className="text-body-04 gray-400">{month + 1}월</h2>
        <div className="pr-[24px] cursor-pointer">
          <Icon type="angleRight" onClick={nextMonth} width="10" height="10" />
        </div>
      </div>
  
      {/* 요일 헤더 */}
      <div className="mt-4 mb-[12px] grid grid-cols-7 gap-1 text-center text-body-04 text-gray-400">
        {daysOfWeek.map((day, index) => (
          <div key={day} className={`p-1 ${index === 6 ? "text-system-red" : ""}`}>
            {day}
          </div>
        ))}
      </div>
  
      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-1 text-center mb-[16px]">
        {/* 이전 달 날짜 */}
        {prevDates.map((day, index) => (
          <div key={`prev-${index}`} className="p-2 text-gray-400 mb-[16px]">{day}</div>
        ))}
        
        {/* 현재 달 날짜 */}
        {currentDates.map((day) => (
          <div
            key={day}
            className={`w-[32px] h-[32px] mx-auto mb-[16px] flex justify-center items-center cursor-pointer rounded-full ${
              selectedDate?.getDate() === day && selectedDate?.getMonth() === month
                ? "bg-secondary-100"
                : isToday(day)
                ? "bg-primary-200"
                : "hover:bg-secondary-100"
            }`}
            onClick={() => handleDateClick(day, true)}
          >
            {day}
          </div>
        ))}
        {/* 다음 달 날짜 */}
        {nextDates.map((day, index) => (
          <div key={`next-${index}`} className="p-2 text-gray-400 mb-[16px]">{day}</div>
        ))}
      </div>
    </div>
  </div>  
  );
};

export default Calendar;
