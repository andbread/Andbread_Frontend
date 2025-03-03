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
          className="card card-clickable flex cursor-pointer flex-row items-end justify-between bg-white p-24"
          onClick={() => handleListClick(nbread.id)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-body01">{nbread.title}</p>
            <p className="text-body02 text-gray-500">
              {Math.floor(
                nbread.amount / nbread.participantCount,
              ).toLocaleString()}
              원 /{nbread.paymentPeriod === 'year' ? ' 매년' : ' 매월'}
            </p>
          </div>
          <p className="text-body02 text-secondary-200">
            {nbread.participants?.length}명 참여 중
          </p>
        </div>
      ))}
    </div>
  )
}

export default MyNbreadList
