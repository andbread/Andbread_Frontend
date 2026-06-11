import DefaultAvatar from '@/assets/avatar.svg'
import { sendFriendRequest } from '@/lib/friend/sendFriendRequest'
import { useEffect, useState } from 'react'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'
interface PlusFriendListItemProps {
  name: string
  status: string
  profile: string
  senderId: string
  receiverId: string
}
export interface sendFriendProps {
  senderId: string
  receiverId: string
  status: string
}
const PlusFriendListItem = ({
  name,
  status,
  profile,
  senderId,
  receiverId,
}: PlusFriendListItemProps) => {
  const [sendStatus, setSendStatus] = useState(status)
  const [color, setColor] = useState('')
  const [cursor, setCursor] = useState('')

  const handleClick = async (status: string) => {
    if (sendStatus == '친구 추가하기') {
      const fetch = await sendFriendRequest({
        senderId,
        receiverId,
        status: 'pending',
      })
      if (fetch) {
        trackEvent(GA_EVENTS.ADD_FRIEND, { receiver_id: receiverId })
      }

      setSendStatus('요청 완료')
      setColor('text-gray-400')
      setCursor('cursor-default')
    }
  }
  useEffect(() => {
    if (status == 'pending') {
      setSendStatus('요청 완료')
      setColor('text-gray-400')
      setCursor('cursor-default')
    }
    else if(status =='친구 추가하기'){
        setSendStatus('친구 추가하기')
      setColor('text-system-blue01')
      setCursor('cursor-pointer')
    }
    else if(status =='rejected') {
        setSendStatus('친구 추가하기')
      setColor('text-system-blue01')
      setCursor('cursor-pointer')
    }
    else {
        setSendStatus('')
      setColor('')
      setCursor('')
    }
  }, [status])

  return (
    <div className="flex w-full flex-row pb-[30px]">
      <div className="flex w-[40%] flex-row items-center gap-[20px]">
        {profile && typeof profile === 'string' && profile !== '' ? (
          <img
            src={profile}
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
export default PlusFriendListItem
