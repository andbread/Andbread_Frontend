'use client'

import { useToast } from '@/components/common/toast/Toast'
import { getChatMessages } from '@/lib/chatMessage/getChatMessages'
import { insertChatMessage } from '@/lib/chatMessage/insertChatMessage'
import { supabase } from '@/lib/supabaseClient'
import useUserStore from '@/stores/useAuthStore'
import { ChatMessage } from '@/types/chatMessage'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Spinner from '../common/spinner/Spinner'
import MessageList from './MessageList'

const sortMessagesByCreatedAt = (messages: ChatMessage[]) =>
  [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

const isMatchingOptimisticMessage = (
  optimisticMessage: ChatMessage,
  realMessage: ChatMessage,
) => {
  const optimisticCreatedAt = Date.parse(optimisticMessage.createdAt)
  const realCreatedAt = Date.parse(realMessage.createdAt)
  const createdAtDiff = Math.abs(realCreatedAt - optimisticCreatedAt)

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

  return sortMessagesByCreatedAt([...messages, incomingMessage])
}

const ChatRoom = () => {
  const params = useParams()
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [inputText, setInputText] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [hasFetched, setHasFetched] = useState<boolean>(false)

  const nbreadId = useMemo(() => {
    const routeNbreadId = params.nbreadId
    return typeof routeNbreadId === 'string' ? routeNbreadId : ''
  }, [params.nbreadId])

  const fetchChatMessages = useCallback(async (targetNbreadId: string) => {
    const data = await getChatMessages(targetNbreadId)
    setChatMessages(sortMessagesByCreatedAt(data))
    setHasFetched(true)
  }, [])

  const sendChatMessages = useCallback(
    async (content: string) => {
      if (!nbreadId || !user) {
        useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
        router.back()
        return
      }

      const tempId = `temp-${Date.now()}`
      const optimisticMessage: ChatMessage = {
        id: tempId,
        content,
        userId: user.id,
        userName: user.name,
        userProfileImage: user.profileImage,
        nbreadId,
        createdAt: new Date().toISOString(),
        status: 'sending',
      }

      setChatMessages((prev) => [...prev, optimisticMessage])

      try {
        const savedMessage = await insertChatMessage(user, nbreadId, content)

        setChatMessages((prev) => {
          const withoutTemp = prev.filter((message) => message.id !== tempId)
          return mergeIncomingMessage(withoutTemp, savedMessage)
        })
      } catch {
        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === tempId ? { ...message, status: 'failed' } : message,
          ),
        )
        useToast.error('메시지 전송에 실패했어요.')
      }
    },
    [nbreadId, router, user],
  )

  useEffect(() => {
    if (!nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }

    fetchChatMessages(nbreadId).catch(() => {
      useToast.error('메시지 내역을 불러오는 데 실패했어요.')
      router.back()
    })
  }, [fetchChatMessages, nbreadId, router])

  useEffect(() => {
    if (!nbreadId) {
      return
    }

    const channel = supabase
      .channel(nbreadId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `nbread_id=eq.${nbreadId}`,
        },
        (payload) => {
          const newChatMessage: ChatMessage = {
            id: payload.new.id,
            content: payload.new.content,
            userId: payload.new.user_id ?? '',
            userName: payload.new.user_name,
            userProfileImage: payload.new.user_profile_image,
            nbreadId: payload.new.nbread_id,
            createdAt: payload.new.created_at,
          }

          setChatMessages((prev) => mergeIncomingMessage(prev, newChatMessage))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [nbreadId])

  useEffect(() => {
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
  }, [chatMessages.length])

  if (!hasFetched) {
    return <Spinner isLoading={true} />
  }

  return (
    <div
      ref={scrollContainerRef}
      className="mt-4 h-screen w-full overflow-y-auto px-24"
    >
      <div className="flex w-full flex-col justify-between">
        <MessageList messages={chatMessages} currentUserId={user?.id} />
        <div ref={bottomRef}></div>
      </div>
      <div className="h-92" />

      <div className="absolute bottom-0 left-0 h-80 w-full bg-gray-50">
        <input
          className="mx-20 h-48 w-[calc(100%-40px)] rounded-8 bg-gray-200 px-20"
          placeholder="메세지를 입력하세요"
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              return
            }

            if (event.key === 'Enter' && inputText.trim() !== '') {
              event.preventDefault()
              sendChatMessages(inputText)
              setInputText('')
            }
          }}
        />
      </div>
    </div>
  )
}

export default ChatRoom
