/**
 * 항목별 기여도 측정용 조건 정의
 *
 * 각 조건은 "개선 전 코드(PR #144 역적용) + 축 하나"다.
 * 축을 단독으로 떼어낼 수 있어야 그 축의 몫을 귀속할 수 있다.
 *
 *   P0_before  개선 전 원본
 *   P1_C       + 시간 포맷 사전 계산
 *   P2_A       + 컴포넌트 분리 / memo / key를 id로
 *   P3_AC      + 위 둘 다 (A와 C의 중첩분을 재기 위한 조건)
 *   P4_E       + Realtime 구독 가드
 *   P5_B       + 낙관적 업데이트 + 병합
 *   P6_F       + 스크롤 처리 교체
 *   P7_after   개선 후 (전부)
 *
 * 변환은 개선 전 원본 문자열을 정확히 찾아 바꾸는 방식이다.
 * 하나라도 못 찾으면 즉시 실패시킨다. 조용히 빗나간 조건으로 측정하는 것이
 * 측정을 아예 못 하는 것보다 나쁘기 때문이다.
 */

const CHAT_ROOM = 'src/components/chat/ChatRoom.tsx'
const MESSAGE_LIST = 'src/components/chat/MessageList.tsx'
const MESSAGE_ITEM = 'src/components/chat/MessageItem.tsx'
const TYPES = 'src/types/chatMessage.ts'
const GET_MESSAGES = 'src/lib/chatMessage/getChatMessages.tsx'
const INSERT_MESSAGE = 'src/lib/chatMessage/insertChatMessage.tsx'
const FORMAT_UTIL = 'src/utils/formatChatMessageTime.ts'

/* ------------------------------------------------------------------ 공통 조각 */

const FORMAT_UTIL_SOURCE = `export const formatChatMessageTime = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })
`

/** 개선 전 원본의 시간 표시 구문 (내 메시지 / 상대 메시지 두 곳에 동일하게 등장한다) */
const INLINE_TIME = `new Date(chatMessage.createdAt).toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      hour: '2-digit',
                      minute: '2-digit',
                    })`

const INLINE_TIME_INDENTED = `new Date(chatMessage.createdAt).toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        hour: '2-digit',
                        minute: '2-digit',
                      })`

const IS_LAST_IN_MINUTE_GROUP = `  // ✅ 사용자+분 단위 그룹 중 마지막 메시지인지 판단
  const isLastInMinuteGroup = (index: number) => {
    const current = chatMessages[index]
    const next = chatMessages[index + 1]

    const formatTime = (date: string) =>
      new Date(date).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
      })

    const currentTime = formatTime(current.createdAt)
    const nextTime = next ? formatTime(next.createdAt) : null

    if (next && next.userId === current.userId && nextTime === currentTime) {
      return false
    }

    return true
  }
`

/** 개선 전 원본의 메시지 목록 렌더 블록 전체 */
const INLINE_LIST = `        {chatMessages.length === 0 ? (
          <div>아직 메시지가 없어요.</div>
        ) : (
          chatMessages.map((chatMessage, index) =>
            chatMessage.userId === user?.id ? (
              <div key={index} className="flex flex-row justify-end">
                <div className="mb-4 flex items-end text-body03 text-gray-400">
                  {isLastInMinuteGroup(index) &&
                    ${INLINE_TIME}}
                </div>
                <div className="mb-4 ml-8 flex items-center rounded-16 border border-gray-100 bg-primary-500 px-16 py-12 text-body02">
                  {chatMessage.content}
                </div>
              </div>
            ) : (
              <div key={index}>
                {index === 0 ||
                chatMessages[index - 1].userId !==
                  chatMessages[index].userId ? (
                  <div className="flex flex-row items-center justify-start gap-12">
                    <Avatar
                      size="small"
                      profileImageUrl={chatMessage.userProfileImage}
                    />
                    <div className="text-body02">{chatMessage.userName}</div>
                  </div>
                ) : null}
                <div className="ml-32 flex flex-row">
                  <div className="shadow-avatar mb-4 mr-8 rounded-16 border-gray-100 bg-white px-16 py-12 text-body02">
                    {chatMessage.content}
                  </div>
                  <div className="mb-4 flex items-end text-body03 text-gray-400">
                    {isLastInMinuteGroup(index) &&
                      ${INLINE_TIME_INDENTED}}
                  </div>
                </div>
              </div>
            ),
          )
        )}`

const REALTIME_HANDLER = `          const newChatMessage: ChatMessage = {
            id: payload.new.id,
            content: payload.new.content,
            userId: payload.new.user_id,
            userName: payload.new.user_name,
            userProfileImage: payload.new.user_profile_image,
            nbreadId: payload.new.nbread_id,
            createdAt: payload.new.created_at,
          }
          setChatMessages((prev) => [...prev, newChatMessage])`

const SEND_MESSAGES = `  const sendChatMessages = async (content: string) => {
    if (!params.nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }
    const nbreadId = params.nbreadId as string
    await insertChatMessage(user!, nbreadId, content)
    setTimeout(() => {
      setScrollState(true)
    }, 100)
  }`

const SCROLL_EFFECTS = `  useEffect(() => {
    if (scrollState) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
      setScrollState(false)
    }
  }, [chatMessages])

  const scrollToBottom = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  useEffect(() => {
    if (scrollState) {
      scrollToBottom()
      setScrollState(false)
    }
  }, [chatMessages])`

const SUBSCRIBE_EFFECT = `  useEffect(() => {
    subscribeChatRoom()
  }, [nbreadId])`

/* ------------------------------------------------------------------ 축 C */

/** C: 시간 포맷을 데이터 진입 시점에 1회 계산해 둔다 */
const axisC = (listExtracted = false) => ({
  write: {
    [FORMAT_UTIL]: FORMAT_UTIL_SOURCE,
  },
  edit: {
    [TYPES]: [
      {
        from: `  createdAt: string
}`,
        to: `  createdAt: string
  formattedTime: string
}`,
      },
    ],
    [GET_MESSAGES]: [
      {
        from: `import { ChatMessage } from '@/types/chatMessage'`,
        to: `import { ChatMessage } from '@/types/chatMessage'
import { formatChatMessageTime } from '@/utils/formatChatMessageTime'`,
      },
      {
        from: `      createdAt: item.created_at,
    }))`,
        to: `      createdAt: item.created_at,
      formattedTime: formatChatMessageTime(item.created_at),
    }))`,
      },
    ],
    [CHAT_ROOM]: [
      {
        from: `import { supabase } from '@/lib/supabaseClient'`,
        to: `import { supabase } from '@/lib/supabaseClient'
import { formatChatMessageTime } from '@/utils/formatChatMessageTime'`,
      },
      {
        from: `            createdAt: payload.new.created_at,
          }`,
        to: `            createdAt: payload.new.created_at,
            formattedTime: formatChatMessageTime(payload.new.created_at),
          }`,
      },
      ...(listExtracted ? [] : [{
        from: `    const formatTime = (date: string) =>
      new Date(date).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
      })

    const currentTime = formatTime(current.createdAt)
    const nextTime = next ? formatTime(next.createdAt) : null`,
        to: `    const currentTime = current.formattedTime
    const nextTime = next ? next.formattedTime : null`,
      }]),
      ...(listExtracted
        ? []
        : [
            { from: INLINE_TIME, to: `chatMessage.formattedTime` },
            { from: INLINE_TIME_INDENTED, to: `chatMessage.formattedTime` },
          ]),
    ],
  },
})

/* ------------------------------------------------------------------ 축 A */

/**
 * A: 컴포넌트 분리 + memo + key를 id로.
 * C를 끌어들이지 않도록, 시간 포맷은 여전히 렌더 중에 계산한다.
 */
const messageItemSource = (withFormattedTime, withMemo = true) => `import Avatar from '@/components/common/avatar/avatar'
${withMemo ? "import { memo } from 'react'\n" : ''}${
  withFormattedTime
    ? ''
    : `
const formatTime = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })
`
}
interface MessageItemProps {
  content: string
  ${withFormattedTime ? 'formattedTime: string' : 'createdAt: string'}
  isMine: boolean
  showSender: boolean
  showTime: boolean
  userName: string
  userProfileImage: string
}

const MessageItem = ({
  content,
  ${withFormattedTime ? 'formattedTime' : 'createdAt'},
  isMine,
  showSender,
  showTime,
  userName,
  userProfileImage,
}: MessageItemProps) => {
  const time = ${withFormattedTime ? 'formattedTime' : 'formatTime(createdAt)'}

  if (isMine) {
    return (
      <div className="flex flex-row justify-end">
        <div className="mb-4 flex items-end text-body03 text-gray-400">
          {showTime && time}
        </div>
        <div className="mb-4 ml-8 flex items-center rounded-16 border border-gray-100 bg-primary-500 px-16 py-12 text-body02">
          {content}
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
          {showTime && time}
        </div>
      </div>
    </div>
  )
}

export default ${withMemo ? 'memo(MessageItem)' : 'MessageItem'}
`

const messageListSource = (withFormattedTime, withMemo = true) => `import { ChatMessage } from '@/types/chatMessage'
${withMemo ? "import { memo } from 'react'\n" : ''}import MessageItem from './MessageItem'
${
  withFormattedTime
    ? ''
    : `
const formatTime = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })
`
}
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
          ${
            withFormattedTime
              ? 'next.formattedTime !== message.formattedTime'
              : 'formatTime(next.createdAt) !== formatTime(message.createdAt)'
          }

        return (
          <MessageItem
            key={message.id}
            content={message.content}
            ${
              withFormattedTime
                ? 'formattedTime={message.formattedTime}'
                : 'createdAt={message.createdAt}'
            }
            isMine={message.userId === currentUserId}
            showSender={!previous || previous.userId !== message.userId}
            showTime={showTime}
            userName={message.userName}
            userProfileImage={message.userProfileImage}
          />
        )
      })}
    </>
  )
}

export default ${withMemo ? 'memo(MessageList)' : 'MessageList'}
`

const axisA = (withFormattedTime, withMemo = true) => ({
  write: {
    [MESSAGE_ITEM]: messageItemSource(withFormattedTime, withMemo),
    [MESSAGE_LIST]: messageListSource(withFormattedTime, withMemo),
  },
  edit: {
    [CHAT_ROOM]: [
      {
        from: `import Avatar from '@/components/common/avatar/avatar'
`,
        to: ``,
      },
      {
        from: `import Spinner from '../common/spinner/Spinner'`,
        to: `import Spinner from '../common/spinner/Spinner'
import MessageList from './MessageList'`,
      },
      { from: IS_LAST_IN_MINUTE_GROUP, to: `` },
      {
        from: INLINE_LIST,
        to: `        <MessageList messages={chatMessages} currentUserId={user?.id} />`,
      },
    ],
  },
})

/* ------------------------------------------------------------------ 축 E */

/** E: 빈 문자열 상태로 채널에 접속하는 것을 막는 가드 한 줄 */
const axisE = {
  write: {},
  edit: {
    [CHAT_ROOM]: [
      {
        from: SUBSCRIBE_EFFECT,
        to: `  useEffect(() => {
    if (!nbreadId) {
      return
    }

    subscribeChatRoom()
  }, [nbreadId])`,
      },
    ],
  },
}

/* ------------------------------------------------------------------ 축 B */

/** B: 낙관적 업데이트 + 에코 중복 병합 */
const axisB = {
  write: {},
  edit: {
    [TYPES]: [
      {
        from: `  createdAt: string
}`,
        to: `  createdAt: string
  status?: 'sending' | 'failed'
}`,
      },
    ],
    [INSERT_MESSAGE]: [
      {
        from: `import { User } from '@/types/user'`,
        to: `import { ChatMessage } from '@/types/chatMessage'
import { User } from '@/types/user'`,
      },
      {
        from: `  content: string,
) => {`,
        to: `  content: string,
): Promise<ChatMessage> => {`,
      },
      { from: `      .select('id')`, to: `      .select('*')` },
      {
        from: `    if (error) {
      console.error('Error inserting chat messages:', error)
      throw error
    }

    return data.id`,
        to: `    if (error || !data) {
      console.error('Error inserting chat messages:', error)
      throw error
    }

    return {
      id: data.id,
      content: data.content,
      nbreadId: data.nbread_id,
      userId: data.user_id,
      userName: data.user_name,
      userProfileImage: data.user_profile_image,
      createdAt: data.created_at,
    }`,
      },
    ],
    [CHAT_ROOM]: [
      {
        from: `const ChatRoom = () => {`,
        to: `const isMatchingOptimisticMessage = (
  optimisticMessage: ChatMessage,
  realMessage: ChatMessage,
) => {
  const createdAtDiff = Math.abs(
    Date.parse(realMessage.createdAt) - Date.parse(optimisticMessage.createdAt),
  )

  return (
    optimisticMessage.id.startsWith('temp-') &&
    optimisticMessage.userId === realMessage.userId &&
    optimisticMessage.nbreadId === realMessage.nbreadId &&
    optimisticMessage.content === realMessage.content &&
    createdAtDiff < 60_000
  )
}

const mergeIncomingMessage = (
  messages: ChatMessage[],
  incomingMessage: ChatMessage,
) => {
  if (messages.some((message) => message.id === incomingMessage.id)) {
    return messages
  }

  const optimisticIndex = messages.findIndex((message) =>
    isMatchingOptimisticMessage(message, incomingMessage),
  )

  if (optimisticIndex >= 0) {
    return messages.map((message, index) =>
      index === optimisticIndex ? incomingMessage : message,
    )
  }

  return [...messages, incomingMessage]
}

const ChatRoom = () => {`,
      },
      {
        from: SEND_MESSAGES,
        to: `  const sendChatMessages = async (content: string) => {
    if (!params.nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }
    const nbreadId = params.nbreadId as string

    const tempId = \`temp-\${Date.now()}\`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content,
      userId: user!.id,
      userName: user!.name,
      userProfileImage: user!.profileImage as string,
      nbreadId,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }

    setChatMessages((prev) => [...prev, optimisticMessage])

    try {
      const savedMessage = await insertChatMessage(user!, nbreadId, content)

      setChatMessages((prev) =>
        mergeIncomingMessage(
          prev.filter((message) => message.id !== tempId),
          savedMessage,
        ),
      )
    } catch {
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === tempId ? { ...message, status: 'failed' } : message,
        ),
      )
      useToast.error('메시지 전송에 실패했어요.')
    }

    setTimeout(() => {
      setScrollState(true)
    }, 100)
  }`,
      },
      {
        from: `          setChatMessages((prev) => [...prev, newChatMessage])`,
        to: `          setChatMessages((prev) =>
            mergeIncomingMessage(prev, newChatMessage),
          )`,
      },
    ],
  },
}

/* ------------------------------------------------------------------ 축 F */

/** F: scrollState 상태와 setTimeout(100)을 requestAnimationFrame으로 교체 */
const axisF = {
  write: {},
  edit: {
    [CHAT_ROOM]: [
      {
        from: `  const [scrollState, setScrollState] = useState(false)
`,
        to: ``,
      },
      {
        from: `    await insertChatMessage(user!, nbreadId, content)
    setTimeout(() => {
      setScrollState(true)
    }, 100)`,
        to: `    await insertChatMessage(user!, nbreadId, content)`,
      },
      {
        from: SCROLL_EFFECTS,
        to: `  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: 'end' })

      const container = scrollContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [chatMessages.length])`,
      },
    ],
  },
}

/* ------------------------------------------------------------------ 조건 목록 */

export const CONDITIONS = [
  { key: 'P0_before', port: 3000, axes: [], label: '개선 전 원본' },
  { key: 'P1_C', port: 3003, axes: [axisC(false)], label: '시간 포맷 사전 계산' },
  {
    key: 'P2_A',
    port: 3004,
    axes: [axisA(false)],
    label: '컴포넌트 분리와 메모이제이션',
  },
  {
    key: 'P3_AC',
    port: 3005,
    axes: [axisA(true), axisC(true)],
    label: '분리·메모이제이션 + 시간 포맷 (중첩분 측정용)',
  },
  { key: 'P4_E', port: 3002, axes: [axisE], label: 'Realtime 구독 정상화' },
  { key: 'P5_B', port: 3006, axes: [axisB], label: '낙관적 업데이트' },
  { key: 'P6_F', port: 3007, axes: [axisF], label: '스크롤 처리 교체' },
  { key: 'P7_after', port: 3001, axes: null, label: '개선 후 (전부)' },
]

/* --------------------------------------------- React Compiler 비교 실험용 축 */

const NEXT_CONFIG = 'next.config.ts'

/**
 * React Compiler를 켠다.
 *
 * Next 15.5에서는 `experimental` 아래에 있다. 공식 문서는 Next 16 기준이라
 * 최상위에 적혀 있으므로 그대로 따라 쓰면 무시된다.
 */
export const axisReactCompiler = {
  write: {},
  edit: {
    [NEXT_CONFIG]: [
      {
        from: `const nextConfig: NextConfig = {
  eslint: {`,
        to: `const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },

  eslint: {`,
      },
    ],
  },
}

export { axisA }

/**
 * 손으로 건 memo와 컴파일러를 비교한다.
 *
 *   K0  개선 전 원본, 컴파일러 끔          → P0_before 빌드 재사용 (:3000)
 *   K1  개선 전 원본 + 컴파일러            → 코드를 한 줄도 고치지 않고 켜기만 한다
 *   K2  분리 + key, memo 없음 + 컴파일러   → 컴파일러가 memo를 대신하는지
 *   K3  분리 + key + 손으로 memo, 컴파일러 끔 → P2_A 빌드 재사용 (:3004)
 *
 * 컴파일러는 컴포넌트를 쪼개주지 않는다. 메모이제이션은 컴포넌트 경계에서
 * 일어나므로, 공정하게 비교하려면 분리는 해주고 memo만 빼야 한다. 그것이 K2다.
 */
export const COMPILER_CONDITIONS = [
  { key: 'P0_before', port: 3000, axes: [], label: '개선 전 원본 (컴파일러 없음)', reuse: true },
  { key: 'K1_compiler', port: 3008, axes: [axisReactCompiler], label: '개선 전 원본 + 컴파일러' },
  {
    key: 'K2_split_compiler',
    port: 3009,
    axes: [axisA(false, false), axisReactCompiler],
    label: '분리만 + 컴파일러 (memo 없음)',
  },
  { key: 'P2_A', port: 3004, axes: [axisA(false)], label: '분리 + 손으로 memo (컴파일러 없음)', reuse: true },
]
