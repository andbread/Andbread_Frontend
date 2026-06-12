import DefaultAvatar from '@/assets/avatar.svg'
import Avatar from '../common/avatar/avatar'
import { sendInviteRequest } from '@/lib/invite/sendInviteRequest'
import { useEffect } from 'react'
import { useState } from 'react'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'
interface InviteUserData {
  avatar: string | null
  name: string
  status: string
  nbreadId: string
  invitedUserId: string
  onRefresh?: () => void
}
const InviteUserListItem = ({
  avatar,
  name,
  status,
  nbreadId,
  invitedUserId,
  onRefresh,
}: InviteUserData) => {
  const [sendStatus, setSendStatus] = useState(status)
  const [color, setColor] = useState('')
  const [cursor, setCursor] = useState('')
  // const getInviteUserStatus = (status: string) => {
  //   switch (status) {
  //     case '초대 하기':
  //       return { color: 'text-system-blue01', cursor: 'cursor-pointer' }
  //     case '참여 중':
  //       return { color: 'text-gray-400', cursor: null }
  //     case '초대 완료':
  //       return { color: 'text-gray-400', cursor: null }
  //     default:
  //       return { color: 'text-black', cursor: 'cursor-pointer' }
  //   }
  // }
  useEffect(() => {
    if (status == '초대 완료') {
      setSendStatus('초대 완료')
      setColor('text-gray-400')
      setCursor('cursor-default')
    } else if (status == '초대 하기') {
      setSendStatus('초대 하기')
      setColor('text-system-blue01')
      setCursor('cursor-pointer')
    } else if (status == 'rejected') {
      setSendStatus('초대 하기')
      setColor('text-system-blue01')
      setCursor('cursor-pointer')
    } else {
      setSendStatus('')
      setColor('')
      setCursor('')
    }
  }, [status])
  // const { color, cursor } = getInviteUserStatus(status)

  const handleClick = async (status: string) => {
    if (status == '초대 하기' || status == 'rejected') {
      const fetchInvite = await sendInviteRequest(nbreadId, invitedUserId)
      if (fetchInvite) {
        trackEvent(GA_EVENTS.INVITE_MEMBER, {
          group_id: nbreadId,
          invited_user_id: invitedUserId,
        })
      }
      setSendStatus('요청 완료')
      setColor('text-gray-400')
      setCursor('cursor-default')
      if (onRefresh) onRefresh()
    }
  }
  return (
    <div className="flex w-full flex-row pb-[30px]">
      <div className="flex w-[40%] flex-row items-center gap-[20px]">
        {/* <Avatar size='large' profileImageUrl={avatar}/> */}
        {avatar && typeof avatar === 'string' && avatar !== '' ? (
          <img
            src={avatar}
            alt={name}
            className="h-32 w-32 rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar className="h-32 w-32" />
        )}
        <p className="text-body01">{name}</p>
      </div>
      <div className="flex w-[60%] items-center justify-end">
        <p
          className={`${color} text-body01 ${cursor}`}
          onClick={() => handleClick(status)}
        >
          {sendStatus}
        </p>
      </div>
    </div>
  )
}
export default InviteUserListItem
