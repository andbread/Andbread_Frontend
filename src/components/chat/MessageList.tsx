import { ChatMessage } from '@/types/chatMessage'
import { memo, useMemo } from 'react'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId?: string
}

const formatMessageTime = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messageItems = useMemo(
    () =>
      messages.map((message, index) => {
        const previous = messages[index - 1]
        const next = messages[index + 1]
        const formattedTime = formatMessageTime(message.createdAt)
        const nextFormattedTime = next
          ? formatMessageTime(next.createdAt)
          : null

        return {
          ...message,
          formattedTime,
          isMine: message.userId === currentUserId,
          showSender: !previous || previous.userId !== message.userId,
          showTime:
            !next ||
            next.userId !== message.userId ||
            nextFormattedTime !== formattedTime,
        }
      }),
    [currentUserId, messages],
  )

  if (messageItems.length === 0) {
    return <div>아직 메시지가 없어요.</div>
  }

  return (
    <>
      {messageItems.map((message) => (
        <MessageItem
          key={message.id}
          content={message.content}
          formattedTime={message.formattedTime}
          isMine={message.isMine}
          showSender={message.showSender}
          showTime={message.showTime}
          status={message.status}
          userName={message.userName}
          userProfileImage={message.userProfileImage}
        />
      ))}
    </>
  )
}

export default memo(MessageList)
