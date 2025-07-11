'use client'

import Avatar from '@/components/common/avatar/avatar'
import { useToast } from '@/components/common/toast/Toast'
import { getChatMessages } from '@/lib/chatMessage/getChatMessages'
import { useRouter, useParams } from 'next/navigation'
import { ChatMessage } from '@/types/chatMessage'
import { useEffect, useState, useRef } from 'react'
import useUserStore from '@/stores/useAuthStore'
import { insertChatMessage } from '@/lib/chatMessage/insertChatMessage'
import { supabase } from '@/lib/supabaseClient'
import Spinner from '../common/spinner/Spinner'

const ChatRoom = () => {
  const params = useParams()
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [nbreadId, setNbreadId] = useState<string>('')
  const [inputText, setInputText] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [hasFetched, setHasFetched] = useState<boolean>(false)
  const [scrollState, setScrollState] = useState(false)

  const fetchChatMessages = async (nbreadId: string) => {
    const data = await getChatMessages(nbreadId)
    const sortedData = data.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    setChatMessages(sortedData)
    setHasFetched(true)
  }

  const sendChatMessages = async (content: string) => {
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
  }

  useEffect(() => {
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
  }, [chatMessages])

  const subscribeChatRoom = async () => {
    const channel = supabase
      .channel(`${nbreadId}`)
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
            userId: payload.new.user_id,
            userName: payload.new.user_name,
            userProfileImage: payload.new.user_profile_image,
            nbreadId: payload.new.nbread_id,
            createdAt: payload.new.created_at,
          }
          setChatMessages((prev) => [...prev, newChatMessage])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  useEffect(() => {
    if (!params.nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }

    try {
      const nbreadId = params.nbreadId as string
      setNbreadId(nbreadId)
      fetchChatMessages(nbreadId)
    } catch (error) {
      useToast.error('메시지 내역을 불러오는 데 실패했어요.')
      router.back()
    }
  }, [])

  useEffect(() => {
    subscribeChatRoom()
  }, [nbreadId])

  // ✅ 사용자+분 단위 그룹 중 마지막 메시지인지 판단
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

  if (!hasFetched) {
    return <Spinner isLoading={true} />
  }

  return (
    <div
      ref={scrollContainerRef}
      className="mt-4 h-screen w-full overflow-y-auto px-24"
    >
      <div className="flex w-full flex-col justify-between">
        {chatMessages.length === 0 ? (
          <div>아직 메시지가 없어요.</div>
        ) : (
          chatMessages.map((chatMessage, index) =>
            chatMessage.userId === user?.id ? (
              <div key={index} className="flex flex-row justify-end">
                <div className="mb-4 flex items-end text-body03 text-gray-400">
                  {isLastInMinuteGroup(index) &&
                    new Date(chatMessage.createdAt).toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
                      new Date(chatMessage.createdAt).toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </div>
                </div>
              </div>
            ),
          )
        )}
        <div ref={bottomRef}></div>
      </div>
      {/* 채팅 메시지 하단 여백 추가 (input에 가려지지 않도록) */}
      <div className="h-92" />

      <div className="absolute bottom-0 left-0 h-80 w-full bg-gray-50">
        <input
          className="mx-20 h-48 w-[calc(100%-40px)] rounded-8 bg-gray-200 px-20"
          placeholder="메세지를 입력하세요"
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyPress={(event) => {
            if (event.key === 'Enter' && inputText.trim() !== '') {
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
