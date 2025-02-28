import { Nbread } from '@/types/nbread'

interface MyNbreadListProps {
  nbreadList: Nbread[]
}

const MyNbreadList = ({ nbreadList }: MyNbreadListProps) => {
  return (
    <div className="mb-12 mt-8 flex flex-col gap-4">
      {nbreadList.map((nbread, index) => (
        <div
          key={index}
          className="shadow flex items-center justify-between rounded-lg bg-white p-24"
        >
          <div className="pl-10">
            <p className="mb-4 text-body02 font-bold text-gray-800">
              {nbread.title}
            </p>
            <p className="text-body03 text-gray-500">
              {Math.floor(
                nbread.amount / nbread.participantCount,
              ).toLocaleString()}
              원 /{nbread.paymentPeriod === 'year' ? ' 매년' : ' 매월'}
            </p>
          </div>
          <div className="mr-12 flex min-h-[30px] flex-col justify-end">
            <p className="mt-auto text-body03 text-secondary-200">
              {nbread.participantCount}명 참여 중
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyNbreadList
