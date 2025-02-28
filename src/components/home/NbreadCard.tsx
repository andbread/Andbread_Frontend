import Avatar from '@/components/common/avatar/avatar'
import { Nbread } from '@/types/nbread'

interface NbreadCardProps {
  nbread: Nbread
}

const NbreadCard = ({ nbread }: NbreadCardProps) => {
  const participants = nbread.participants

  return (
    <div className="shadow flex items-center justify-between rounded-lg bg-white p-24">
      <div className="pl-10">
        <p className="mb-4 text-body02 font-bold">{nbread.title}</p>
        <p className="text-body03 text-gray-500">
          {Math.floor(nbread.amount / nbread.participantCount).toLocaleString()}
          원 /{nbread.paymentPeriod === 'year' ? ' 매년' : ' 매월'}
        </p>
      </div>
      <div className="mr-12 flex w-[100px] flex-col items-end">
        {/* ✅ 참여자 Avatar 아이콘 */}
        <div className="mb-2 flex w-full justify-end">
          {participants &&
            participants!.map((participant, idx) => (
              <div key={idx} className="relative -ml-6">
                <Avatar
                  size="large"
                  profileImageUrl={participant.user.profileImage}
                />
              </div>
            ))}
        </div>
        {/* 참여 인원 상태 */}
        <p className="text-body04 text-secondary-300">
          미완료 0 / {nbread.participantCount}
        </p>
      </div>
    </div>
  )
}

export default NbreadCard
