import Avatar from '@/components/common/avatar/avatar'
import { memo } from 'react'

interface MessageItemProps {
  content: string
  formattedTime: string
  isMine: boolean
  showSender: boolean
  showTime: boolean
  status?: 'sending' | 'failed'
  userName: string
  userProfileImage: string | null
}

const MessageItem = ({
  content,
  formattedTime,
  isMine,
  showSender,
  showTime,
  status,
  userName,
  userProfileImage,
}: MessageItemProps) => {
  if (isMine) {
    return (
      <div className="flex flex-row justify-end">
        <div className="mb-4 flex items-end text-body03 text-gray-400">
          {showTime && formattedTime}
        </div>
        <div
          className={`mb-4 ml-8 flex items-center rounded-16 border border-gray-100 bg-primary-500 px-16 py-12 text-body02 ${
            status === 'failed' ? 'opacity-60' : ''
          }`}
        >
          {content}
          {status === 'failed' && (
            <span className="ml-8 text-body03 text-gray-500">실패</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {showSender && (
        <div className="flex flex-row items-center justify-start gap-12">
          <Avatar size="small" profileImageUrl={userProfileImage} />
          <div className="text-body02">{userName}</div>
        </div>
      )}
      <div className="ml-32 flex flex-row">
        <div className="shadow-avatar mb-4 mr-8 rounded-16 border-gray-100 bg-white px-16 py-12 text-body02">
          {content}
        </div>
        <div className="mb-4 flex items-end text-body03 text-gray-400">
          {showTime && formattedTime}
        </div>
      </div>
    </div>
  )
}

export default memo(MessageItem)
