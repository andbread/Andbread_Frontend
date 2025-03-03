import Avatar from '@/components/common/avatar/avatar'
import { Nbread } from '@/types/nbread'
import { useRouter } from 'next/navigation'

interface NbreadCardProps {
  nbread: Nbread
  showParticipants?: boolean
}

const NbreadCard = ({ nbread, showParticipants = true }: NbreadCardProps) => {
  const router = useRouter()
  const participants = nbread.participants

  const handleCardClick = () => {
    router.push(`/nbread/${nbread.id}`)
  }

  return (
    <div
      className="card card-clickable flex items-center justify-between bg-white px-24 py-20"
      onClick={() => handleCardClick()}
    >
      <div className="flex flex-col items-start gap-2">
        <p className="mb-4 text-body01">{nbread.title}</p>
        <p className="text-body02 text-gray-500">
          {Math.floor(nbread.amount / nbread.participantCount).toLocaleString()}
          원 /{nbread.paymentPeriod === 'year' ? ' 매년' : ' 매월'}
        </p>
      </div>
      <div className="flex w-100 flex-col items-end">
        {/* ✅ 참여자 Avatar 아이콘 */}
        <div className="mb-8 flex w-full justify-end">
          {participants &&
            participants.map((participant, idx) => (
              <div key={idx} className="relative -ml-4">
                <Avatar
                  size="large"
                  profileImageUrl={participant.user.profileImage}
                />
              </div>
            ))}
        </div>
        {showParticipants &&
          (nbread.paidCount === participants?.length ? (
            <p className="text-body03 text-gray-300">
              {`완료 ${nbread.paidCount} / ${participants?.length}`}
            </p>
          ) : (
            <p className="text-body03 text-secondary-300">{`미완료 ${nbread.paidCount} / ${participants?.length}`}</p>
          ))}
      </div>
    </div>
  )
}

export default NbreadCard
