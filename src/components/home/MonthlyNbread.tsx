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
      <h3 className="mb-16 font-bold text-gray-800">이번 달 엔빵</h3>
      {nbreadList.length > 0 ? (
        <>
          <div className="card mb-8 flex flex-col gap-8 bg-primary-400 p-24">
            <p className="text-body02">{currentMonth}월 엔빵 🍞</p>
            <h2>{totalAmount.toLocaleString()}원</h2>
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
