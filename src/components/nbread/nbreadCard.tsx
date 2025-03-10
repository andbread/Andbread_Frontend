import { Nbread } from '@/types/nbread'

interface NbreadCardProps {
  nbreadData: Nbread | null
}

const NbreadCard = ({ nbreadData }: NbreadCardProps) => {
  const paymentAmount =
    Math.floor(nbreadData!.amount / nbreadData!.participantCount) || 0

  return (
    <>
      <div className="card min-h-200 px-24 pb-32">
        {nbreadData ? (
          <>
            <div className="pb-4 text-body03 text-gray-600">총 금액</div>
            <div className="text-heading01 text-secondary-200">
              {Number(nbreadData.amount).toLocaleString()}원
            </div>
            <hr className="mt-20 border-gray-100" />
            <div className="flex flex-col gap-16 pt-20">
              <div className="flex flex-row items-center justify-between">
                <div className="w-120 text-body02 text-gray-500">참여 인원</div>
                <div className="text-body02 text-gray-800">
                  {nbreadData.participantCount}명
                </div>
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-120 text-body02 text-gray-500">엔빵 금액</div>
                <div className="text-body02 text-gray-800">
                  {paymentAmount.toLocaleString()}원
                </div>
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-120 text-body02 text-gray-500">
                  정기 결제일
                </div>
                <div className="text-body02 text-gray-800">
                  {nbreadData.paymentPeriod === 'year'
                    ? `매년 ${nbreadData.paymentMonth}월 ${nbreadData.paymentDate}일`
                    : `매월 ${nbreadData.paymentDate}일`}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-body02 text-gray-400">
            엔빵 데이터 저장 중...
          </div>
        )}
      </div>
    </>
  )
}

export default NbreadCard
