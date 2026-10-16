'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'
import Spinner from '@/components/common/spinner/Spinner'
import { useToast } from '@/components/common/toast/Toast'
import InviteNoticeModal from '@/components/invite/InviteNoticeModal'
import InviteResponseModal from '@/components/invite/InviteResponseModal'
import { hasAuthenticatedSession } from '@/lib/auth'
import {
  getInviteByToken,
  InviteDetails,
  InviteStatus,
} from '@/lib/invite/getInviteByToken'
import { InviteResponse, respondToInvite } from '@/lib/invite/respondToInvite'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'
import useUserStore from '@/stores/useAuthStore'

interface InvitePageClientProps {
  token: string
}

interface InviteNotice {
  title: string
  description: string
  buttonLabel: string
  destination: string
}

type CompletedInviteStatus = Exclude<InviteStatus, 'pending'>

const statusMessage: Record<
  CompletedInviteStatus,
  {
    title: string
    description: string
    buttonLabel: string
    getDestination: (nbreadId: string) => string
  }
> = {
  accepted: {
    title: '이미 수락한 초대예요.',
    description: '참여 중인 엔빵을 확인해 주세요.',
    buttonLabel: '엔빵 확인하기',
    getDestination: (nbreadId) => `/nbread/${nbreadId}`,
  },
  rejected: {
    title: '이미 거절한 초대예요.',
    description: '이 초대는 다시 수락할 수 없어요.',
    buttonLabel: '홈으로 가기',
    getDestination: () => '/',
  },
  expired: {
    title: '이미 만료된 초대예요.',
    description: '방장에게 다시 초대를 요청해주세요.',
    buttonLabel: '홈으로 가기',
    getDestination: () => '/',
  },
}

const getStatusNotice = (
  status: CompletedInviteStatus,
  nbreadId: string,
): InviteNotice => {
  const message = statusMessage[status]

  return {
    title: message.title,
    description: message.description,
    buttonLabel: message.buttonLabel,
    destination: message.getDestination(nbreadId),
  }
}

const InvitePageClient = ({ token }: InvitePageClientProps) => {
  const router = useRouter()
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedResponse, setSelectedResponse] =
    useState<InviteResponse | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [notice, setNotice] = useState<InviteNotice | null>(null)

  useEffect(() => {
    let isMounted = true

    const initializeInvitePage = async () => {
      try {
        // 비로그인 사용자에게는 초대 내용을 노출하지 않으므로 조회보다 세션 확인이 먼저다.
        const hasSession = await hasAuthenticatedSession()

        if (!isMounted) return

        if (!hasSession) {
          // 세션은 없는데 localStorage의 user-store만 남아 있으면
          // LoginRedirectGuard가 로그인 화면에서 /home으로 되돌려 초대 복귀가 끊긴다.
          useUserStore.getState().clearUser()
          // 로그인 후 초대 화면으로 돌아오게 한다. push를 쓰면 뒤로 가기가
          // 초대 화면으로 돌아와 같은 판정을 반복하므로 replace를 쓴다.
          const redirectPath = `/invite/${token}`
          router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`)
          // 이동하는 동안 초대 화면이 그려지지 않도록 로딩 상태를 유지한다.
          return
        }

        const inviteData = await getInviteByToken(token)

        if (!isMounted) return

        setInvite(inviteData)
        setIsLoading(false)
      } catch {
        if (isMounted) {
          setLoadFailed(true)
          setIsLoading(false)
        }
      }
    }

    initializeInvitePage()

    return () => {
      isMounted = false
    }
  }, [token, router])

  const handleResponse = async () => {
    if (!selectedResponse || !invite) return

    setIsSubmitting(true)

    try {
      const result = await respondToInvite(token, selectedResponse)

      if (selectedResponse === 'accepted') {
        if (result.outcome === 'already_participant') {
          // 중복 participant를 생성하지 않고 기존 엔빵으로 이동하도록 안내한다.
          setSelectedResponse(null)
          setNotice({
            title: '이미 참여 중인 엔빵이에요.',
            description: '참여 중인 엔빵 정보를 바로 확인할 수 있어요.',
            buttonLabel: '엔빵 확인하기',
            destination: `/nbread/${result.nbread_id}`,
          })
          return
        }

        trackEvent(GA_EVENTS.ACCEPT_INVITE, { group_id: result.nbread_id })
        useToast.success('엔빵 참여가 완료됐어요.')
        router.replace(`/nbread/${result.nbread_id}`)
        return
      }

      setInvite({ ...invite, status: 'rejected' })
      useToast.success('엔빵 초대를 거절했어요.')
      setSelectedResponse(null)
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : ''

      if (message.includes('LOGIN_REQUIRED')) {
        useToast.error('로그인이 필요해요.')
      } else if (message.includes('INVITE_TARGET_MISMATCH')) {
        useToast.error('초대받은 계정으로 로그인해 주세요.')
      } else if (message.includes('INVITE_ALREADY_ACCEPTED')) {
        setNotice(getStatusNotice('accepted', invite.nbreadId))
      } else if (message.includes('INVITE_ALREADY_REJECTED')) {
        setNotice(getStatusNotice('rejected', invite.nbreadId))
      } else if (message.includes('INVITE_EXPIRED')) {
        setNotice(getStatusNotice('expired', invite.nbreadId))
      } else {
        useToast.error('초대 처리에 실패했어요.')
      }
      setSelectedResponse(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <Spinner isLoading />
  }

  if (loadFailed || !invite) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-24 px-24 text-center">
        <h1>초대 정보를 찾을 수 없어요.</h1>
        <p className="text-gray-600">초대 링크가 올바른지 확인해 주세요.</p>
        <button
          className="btn btn-primary btn-medium"
          onClick={() => router.replace('/')}
        >
          홈으로 가기
        </button>
      </main>
    )
  }

  if (invite.status !== 'pending') {
    const message = statusMessage[invite.status]
    const destination = message.getDestination(invite.nbreadId)

    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-24 px-24 text-center">
        <h1>{message.title}</h1>
        <p className="text-gray-600">{message.description}</p>
        <button
          className="btn btn-primary btn-medium"
          onClick={() => router.replace(destination)}
        >
          {message.buttonLabel}
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col justify-between px-24 pb-64 pt-108">
      <div className="text-heading01">
        <span>{invite.leaderName}</span>님이 당신을
        <br />
        <span className="text-secondary-100">{invite.nbreadTitle}</span>에
        초대했어요
      </div>
      <div className="flex w-full items-center justify-center">
        <NbreadsImage isFloating />
      </div>
      <div className="flex flex-col gap-12">
        <button
          className="btn btn-large btn-primary"
          onClick={() => setSelectedResponse('accepted')}
        >
          초대 수락하기
        </button>
        <button
          className="btn btn-large btn-secondary"
          onClick={() => setSelectedResponse('rejected')}
        >
          거절하기
        </button>
      </div>
      <InviteResponseModal
        response={selectedResponse}
        nbreadTitle={invite.nbreadTitle}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) setSelectedResponse(null)
        }}
        onSubmit={handleResponse}
      />
      <InviteNoticeModal
        isOpen={notice !== null}
        title={notice?.title ?? ''}
        description={notice?.description ?? ''}
        buttonLabel={notice?.buttonLabel ?? ''}
        onClose={() => setNotice(null)}
        onSubmit={() => {
          if (!notice) return
          router.replace(notice.destination)
          setNotice(null)
        }}
      />
    </main>
  )
}

export default InvitePageClient
