'use client'

import Avatar from '@/components/common/avatar/avatar'
import { useToast } from '@/components/common/toast/Toast'
import { getChatMessages } from '@/lib/chatMessage/getChatMessages'
import { useRouter, useParams } from 'next/navigation'
import { ChatMessage } from '@/types/chatMessage'
import { useEffect, useState } from 'react'
import useUserStore from '@/stores/useAuthStore'
import { insertChatMessage } from '@/lib/chatMessage/insertChatMessage'
import { supabase } from '@/lib/supabaseClient'

const Page = () => {
  const params = useParams()
  const router = useRouter()
  const user = useUserStore((state) => state.user)

  const [nbreadId, setNbreadId] = useState<string>('')
  const [inputText, setInputText] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [hasFetched, setHasFetched] = useState<boolean>(false)

  // DB로부터 해당 엔빵의 메시지 내역을 불러옴
  const fetchChatMessages = async (nbreadId: string) => {
    const data = await getChatMessages(nbreadId)
    setChatMessages(data)
    setHasFetched(true)
  }

  // 채팅방에 새로운 메시지를 전송
  const sendChatMessages = async (content: string) => {
    if (!params.nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }
    const nbreadId = params.nbreadId as string
    await insertChatMessage(user!, nbreadId, content)
  }

  // 해당 엔빵의 채팅방을 구독
  const subscribeChatRoom = async () => {
    // 1. 채널 생성 및 구독
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
          // 2. 새로운 메시지 도착 시 state 업데이트
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
          console.log('payload:', payload)
        },
      )
      .subscribe()

    // 3. 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel)
    }
  }

  // 컴포넌트 초기화 시 기존 메시지 내역을 불러옴
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
      return
    }
  }, [])

  // nbreadId가 변경될 때마다 해당 엔빵의 채팅방을 구독
  useEffect(() => {
    subscribeChatRoom()
  }, [nbreadId])

  if (!hasFetched) {
    return <div>메시지 로딩 중</div>
  }

  return (
    <div>
      <div>채팅방</div>
      <div>
        {chatMessages.length === 0 ? (
          <div>아직 메시지가 없어요.</div>
        ) : (
          chatMessages.map((chatMessage, index) => (
            <div key={index} className="flex flex-row justify-start gap-16">
              <Avatar
                size="small"
                profileImageUrl={chatMessage.userProfileImage}
              />
              <div>{chatMessage.userName}</div>
              <div>{chatMessage.content}</div>
            </div>
          ))
        )}
      </div>
      <input
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
  )
}

export default Page
