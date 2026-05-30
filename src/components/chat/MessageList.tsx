import { ChatMessage } from '@/types/chatMessage'
import { memo } from 'react'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId?: string
}

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  if (messages.length === 0) {
    return <div>아직 메시지가 없어요.</div>
  }

  return (
    <>
      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const next = messages[index + 1]
        const showTime =
          !next ||
          next.userId !== message.userId ||
          next.formattedTime !== message.formattedTime

        return (
          <MessageItem
            key={message.id}
            content={message.content}
            formattedTime={message.formattedTime}
            isMine={message.userId === currentUserId}
            showSender={!previous || previous.userId !== message.userId}
            showTime={showTime}
            status={message.status}
            userName={message.userName}
            userProfileImage={message.userProfileImage}
          />
        )
      })}
    </>
  )
}

export default memo(MessageList)
