'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DetailHeader from '@/components/common/header/DetailHeader'
import Spinner from '@/components/common/spinner/Spinner'
import { getRelativeTime } from '@/utils/getRelativeTime'
import { getPendingInvites } from '@/lib/invite/getPendingInvites'
import type { PendingInvite } from '@/lib/invite/getPendingInvites'
import useUserStore from '@/stores/useAuthStore'

const ReceivedInvitesPage = () => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchInvites = async () => {
      try {
        const pendingInvites = await getPendingInvites(user.id)
        setInvites(pendingInvites)
      } catch {
        setInvites([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvites()
  }, [user?.id])

  if (isLoading) {
    return <Spinner isLoading />
  }

  return (
    <main className="min-h-svh px-24 pb-40">
      <DetailHeader />
      <h1 className="mb-24 mt-24 text-heading02 text-gray-800">받은 초대</h1>
      {invites.length === 0 ? (
        <div className="flex min-h-320 flex-col items-center justify-center gap-8 text-center">
          <p className="text-heading04 text-gray-700">받은 초대가 없어요.</p>
          <p className="text-body02 text-gray-500">
            새로운 초대가 오면 이곳에서 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {invites.map((invite) => (
            <button
              key={invite.id}
              type="button"
              onClick={() => router.push(`/invite/${invite.inviteToken}`)}
              className="card card-clickable flex w-full items-center justify-between bg-white px-20 py-18 text-left"
            >
              <div className="flex flex-col gap-4">
                <p className="text-heading05 text-gray-800">
                  {invite.nbreadTitle}
                </p>
                <p className="text-body02 text-gray-500">
                  {invite.leaderName}님의 초대
                </p>
              </div>
              <span className="text-body03 text-gray-400">
                {getRelativeTime(invite.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}

export default ReceivedInvitesPage
