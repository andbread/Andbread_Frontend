import NbreadList from '@/components/home/NbreadList'
import Emptylog from '@/components/home/Emptylog'
import { Nbread } from '@/types/nbread'

interface MonthlyNbreadProps {
  nbreadList: Nbread[]
  totalAmount: number
  currentMonth: number
}

const MonthlyNbread = ({
  nbreadList,
  totalAmount,
  currentMonth,
}: MonthlyNbreadProps) => {
  return (
    <section>
      <h2 className="mb-24 text-heading04 font-bold text-gray-800">
        이번 달 엔빵
      </h2>
      {nbreadList.length > 0 ? (
        <>
          <div className="shadow-md mb-8 rounded-lg bg-primary-400 p-36 text-[#333036]">
            <p className="flex items-center text-body03 font-medium">
              {currentMonth}월 엔빵 🍞
            </p>
            <p className="text-[18px] font-bold">
              {totalAmount.toLocaleString()}원
            </p>
          </div>
          <NbreadList nbreadList={nbreadList} />
        </>
      ) : (
        <Emptylog />
      )}
    </section>
  )
}

export default MonthlyNbread
