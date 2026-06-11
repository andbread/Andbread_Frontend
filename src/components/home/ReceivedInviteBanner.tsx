'use client'

import { useRouter } from 'next/navigation'
import type { PendingInvite } from '@/lib/invite/getPendingInvites'

interface ReceivedInviteBannerProps {
  invites: PendingInvite[]
}

const ReceivedInviteBanner = ({ invites }: ReceivedInviteBannerProps) => {
  const router = useRouter()

  if (invites.length === 0) return null

  const handleClick = () => {
    if (invites.length === 1) {
      router.push(`/invite/${invites[0].inviteToken}`)
      return
    }

    router.push('/invites')
  }

  return (
    <section className="mb-24">
      <button
        type="button"
        onClick={handleClick}
        className="card card-clickable flex w-full items-center justify-between bg-primary-100 px-20 py-18 text-left"
      >
        <div className="flex flex-col gap-4">
          <p className="text-heading05 text-gray-800">
            {invites.length === 1
              ? '받은 초대가 있어요'
              : `받은 초대 ${invites.length}개가 있어요`}
          </p>
          <p className="text-body02 text-gray-500">
            참여할 엔빵을 확인해 주세요.
          </p>
        </div>
        <span className="text-heading05 text-secondary-200">
          {invites.length === 1 ? '초대 확인하기' : '확인하기'}
        </span>
      </button>
    </section>
  )
}

export default ReceivedInviteBanner
