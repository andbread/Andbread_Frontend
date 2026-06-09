'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginConfirmModal from '@/components/common/modal/LoginConfirmModal'
import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'
import Spinner from '@/components/common/spinner/Spinner'
import { useToast } from '@/components/common/toast/Toast'
import InviteResponseModal from '@/components/invite/InviteResponseModal'
import { hasAuthenticatedSession } from '@/lib/auth'
import {
  getInviteByToken,
  InviteDetails,
  InviteStatus,
} from '@/lib/invite/getInviteByToken'
import { InviteResponse, respondToInvite } from '@/lib/invite/respondToInvite'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'

interface InvitePageClientProps {
  token: string
}

const statusMessage: Record<
  Exclude<InviteStatus, 'pending'>,
  { title: string; description: string }
> = {
  accepted: {
    title: '이미 수락한 초대예요.',
    description: '참여 중인 엔빵을 확인해 주세요.',
  },
  rejected: {
    title: '거절한 초대예요.',
    description: '이 초대는 다시 수락할 수 없어요.',
  },
  expired: {
    title: '만료된 초대예요.',
    description: '새로운 초대 링크를 요청해 주세요.',
  },
}

const InvitePageClient = ({ token }: InvitePageClientProps) => {
  const router = useRouter()
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedResponse, setSelectedResponse] =
    useState<InviteResponse | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const initializeInvitePage = async () => {
      try {
        const [inviteData, hasSession] = await Promise.all([
          getInviteByToken(token),
          hasAuthenticatedSession(),
        ])

        if (!isMounted) return

        setInvite(inviteData)
        setIsAuthenticated(hasSession)
        setIsLoginModalOpen(!hasSession)
      } catch {
        if (isMounted) setLoadFailed(true)
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setIsAuthLoading(false)
        }
      }
    }

    initializeInvitePage()

    return () => {
      isMounted = false
    }
  }, [token])

  const selectResponse = (response: InviteResponse) => {
    // 비로그인 사용자는 초대 응답 대신 로그인 안내 모달로 유도한다.
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }

    setSelectedResponse(response)
  }

  const handleResponse = async () => {
    if (!selectedResponse || !invite || !isAuthenticated) return

    setIsSubmitting(true)

    try {
      const result = await respondToInvite(token, selectedResponse)

      if (selectedResponse === 'accepted') {
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
      } else if (message.includes('INVITE_NOT_PENDING')) {
        useToast.error('이미 처리된 초대예요.')
      } else {
        useToast.error('초대 처리에 실패했어요.')
      }
      setSelectedResponse(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isAuthLoading) {
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

    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-24 px-24 text-center">
        <h1>{message.title}</h1>
        <p className="text-gray-600">{message.description}</p>
        <button
          className="btn btn-primary btn-medium"
          onClick={() =>
            router.replace(
              invite.status === 'accepted' ? `/nbread/${invite.nbreadId}` : '/',
            )
          }
        >
          {invite.status === 'accepted' ? '엔빵 확인하기' : '홈으로 가기'}
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
          onClick={() => selectResponse('accepted')}
        >
          초대 수락하기
        </button>
        <button
          className="btn btn-large btn-secondary"
          onClick={() => selectResponse('rejected')}
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
      <LoginConfirmModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmit={() => {
          const redirectPath = `/invite/${token}`
          router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
        }}
      />
    </main>
  )
}

export default InvitePageClient
