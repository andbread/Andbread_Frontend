import { Nbread } from '@/types/nbread'
import { useRouter } from 'next/navigation'

interface MyNbreadListProps {
  nbreadList: Nbread[]
}

const MyNbreadList = ({ nbreadList }: MyNbreadListProps) => {
  const router = useRouter()

  const handleListClick = (nbreadId: string) => {
    router.push(`/nbread/${nbreadId}`)
  }

  return (
    <div className="mb-12 mt-8 flex flex-col gap-8">
      {nbreadList.map((nbread, index) => (
        <div
          key={index}
          className="card card-clickable flex items-center justify-between rounded-lg bg-white p-24"
          onClick={() => handleListClick(nbread.id)}
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
              {nbread.participants?.length}명 참여 중
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyNbreadList
