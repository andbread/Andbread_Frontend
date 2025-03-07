'use client'
import Modal from '../common/modal/Modal'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation' // useRouter 훅을 가져옵니다.
import { getUser } from '@/lib/auth'
import useUserStore from '@/stores/useAuthStore'
import { insertParticipant } from '@/lib/participant'

interface InviteAcceptProps {
  isOpen: boolean
  onClose: () => void
}

const InviteAcceptModal = ({ isOpen, onClose }: InviteAcceptProps) => {
  const [groupId, setGroupId] = useState<string | null>(null)
  const [isUser, setIsUser] = useState(false)
  const [accessToken, setAccessToken] = useState<string>()
  const setUser = useUserStore((state) => state.setUser)
  const [inviteAcceptModalData, setInviteAcceptModalData] = useState<{
    title: string
    subTitle: string
    buttonTitle: string
  }>({
    title: '',
    subTitle: '',
    buttonTitle: '',
  })

  const router = useRouter() // useRouter 훅을 사용하여 라우터를 가져옵니다.

  const inviteAcceptData = (
    title: string,
    subTitle: string,
    buttonTitle: string,
  ) => ({
    title: title,
    subTitle: subTitle,
    buttonTitle: buttonTitle,
  })

  // 로그인 상태를 확인하는 useEffect
  useEffect(() => {
    const accessTokenData = sessionStorage.getItem('access_token')
    if (!accessTokenData) {
      setInviteAcceptModalData(
        inviteAcceptData(
          '로그인이 필요해요.',
          '엔빵에 참여하려면 로그인이 필요해요.',
          '로그인하러 가기',
        ),
      )
    } else {
      setAccessToken(accessTokenData)
      setIsUser(true)
    }
  }, [])

  // 유저 정보가 있고, 모달이 열려 있을 때만 API 요청 실행
  useEffect(() => {
    if (!isOpen || !isUser || !accessToken) return // 모달이 열려야 하고, 유저가 있어야 API 요청을 진행

    const fetchData = async () => {
      const data = await getUser(accessToken)

      if (data.data.user) {
        const provider = data.data.user.app_metadata.provider as
          | 'kakao'
          | 'google'

        const userInfo = {
          id: data.data.user.id,
          email: data.data.user.email || '',
          socialType: provider,
          name: data.data.user.user_metadata.full_name || '',
          profileImage: data.data.user.user_metadata.avatar_url || '',
        }
        setUser(userInfo)
        const user = { user: userInfo, isLeader: false }
        setGroupId(sessionStorage.getItem('group_id'))
        if (groupId) {
          const data = await insertParticipant(user, groupId)

          if (data) {
            setInviteAcceptModalData(
              inviteAcceptData(data.title, data.subTitle, data.buttonTitle),
            )
          }
        }
      }
    }
    fetchData()
  }, [isOpen, isUser, accessToken, groupId])

  const handleLoginRedirect = () => {
    router.replace('/login')
  }

  const handleHomeRedirect = () => {
    sessionStorage.removeItem('group_id')
    router.replace('/home')
  }

  const handleNbreadRedirect = () => {
    sessionStorage.removeItem('group_id')
    router.replace(`/nbread/${groupId}`)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex w-full flex-col items-center p-12">
        <div className="mb-24 flex w-full flex-col gap-8">
          <p className="text-heading05 text-gray-800">
            {inviteAcceptModalData.title}
          </p>
          <p className="text-body02 text-gray-800">
            {inviteAcceptModalData.subTitle}
          </p>
        </div>

        <button
          onClick={
            inviteAcceptModalData.buttonTitle === '로그인하러 가기'
              ? handleLoginRedirect
              : inviteAcceptModalData.buttonTitle === '엔빵 확인하러 가기'
                ? handleNbreadRedirect
                : handleHomeRedirect
          }
          className="btn btn-medium btn-primary"
        >
          {inviteAcceptModalData.buttonTitle}
        </button>
      </div>
    </Modal>
  )
}

export default InviteAcceptModal
