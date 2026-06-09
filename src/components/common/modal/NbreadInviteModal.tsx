import Modal from '@/components/common/modal/Modal'
import Icon from '../icon/Icon'
import { useEffect, useRef, useState } from 'react'
import { createLinkInvite } from '@/lib/nbread/insertLink'
import { useToast } from '../toast/Toast'
import useUserStore from '@/stores/useAuthStore'
interface NbreadInviteModalProps {
  isOpen: boolean
  onClose: () => void
  nbreadId: string
}

const NbreadInviteModal = ({
  isOpen,
  onClose,
  nbreadId,
}: NbreadInviteModalProps) => {
  const [inviteLink, setInviteLink] = useState<string>()
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const createdInviteForOpenRef = useRef(false)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    let isActive = true

    const createInvite = async () => {
      if (!isOpen) {
        setInviteLink(undefined)
        createdInviteForOpenRef.current = false
        return
      }

      // Strict Mode의 effect 재실행으로 링크 초대가 중복 생성되지 않도록 한다.
      if (createdInviteForOpenRef.current) return
      createdInviteForOpenRef.current = true

      setIsCreatingInvite(true)
      try {
        const link = await createLinkInvite(nbreadId)
        if (isActive) setInviteLink(link)
      } catch (error) {
        createdInviteForOpenRef.current = false
        console.error('링크 초대 생성 실패:', error)
        if (isActive) {
          useToast.error('초대 링크 생성에 실패했어요. 다시 시도해주세요.')
          onClose()
        }
      } finally {
        if (isActive) setIsCreatingInvite(false)
      }
    }

    createInvite()
    return () => {
      isActive = false
    }
  }, [isOpen, nbreadId, onClose])

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.Kakao) {
      // 이미 초기화된 경우 초기화하지 않도록 처리
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY) // 'NEXT_PUBLIC_KAKAO_APP_KEY' 환경변수 사용
      }
    }
  }, [isOpen])

  const handleKakaoShare = () => {
    if (!inviteLink || !window.Kakao) return
    onClose()
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${user?.name}님이 엔빵으로 초대했어요!`,
        description: '참여하기를 클릭해 초대를 수락해보세요.',
        imageUrl:
          'https://yyisakaqnaoomehqlyjz.supabase.co/storage/v1/object/public/service-image//nbread-service-image-text.png',
        link: {
          mobileWebUrl: inviteLink, // 모바일 웹에서 열릴 URL
          webUrl: inviteLink, // 웹에서 열릴 URL
        },
      },
      buttons: [
        {
          title: '참여하기',
          link: {
            mobileWebUrl: inviteLink,
            webUrl: inviteLink,
          },
        },
      ],
    })
  }

  const handleCopyLink = () => {
    if (inviteLink) {
      onClose()
      // 클립보드에 링크 복사
      navigator.clipboard
        .writeText(inviteLink)
        .then(() => {
          useToast.success('링크가 클립보드에 복사됐어요.')
        })
        .catch((error) => {
          console.error('클립보드 복사 실패:', error)
        })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center p-8">
        <div className="mb-32 flex w-full flex-col gap-8 pl-8">
          <div className="text-heading04 text-gray-800">
            친구 초대 링크가 생성되었어요.
          </div>
          <div className="whitespace-pre-line text-body02 text-gray-800">
            {`친구가 링크를 통해 접속하면\n엔빵 초대가 완료돼요.`}
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 pb-12">
          <button
            onClick={handleCopyLink}
            disabled={isCreatingInvite || !inviteLink}
            className="btn btn-medium text-heading06 bg-system-blue01 text-white hover:bg-system-blue02"
          >
            <div className="flex w-full flex-row items-center justify-start px-20">
              <Icon type="copy" width={14} height={14} fill="text-white" />
              <div className="w-full">초대 링크 복사하기</div>
            </div>
          </button>
          <button
            onClick={handleKakaoShare}
            disabled={isCreatingInvite || !inviteLink}
            className="btn btn-medium text-heading06 bg-system-kakao hover:bg-yellow-400"
          >
            <div className="flex w-full flex-row items-center justify-start px-20">
              <div className="pt-4">
                <Icon type="kakaoLogo" width={18} height={18} fill="black" />
              </div>
              <div className="w-full pt-2">카카오톡 공유하기</div>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default NbreadInviteModal
