'use client'

import NbreadDetail from '@/components/nbread/NbreadDetail'
import DetailHeader from '@/components/common/header/DetailHeader'
import { useToast } from '@/components/common/toast/Toast'
import { getNbread } from '@/lib/nbread'
import { getParticipants } from '@/lib/participant'
import { Nbread, NbreadRecord } from '@/types/nbread'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getNbreadRecords } from '@/lib/nbreadRecord'
import useUserStore from '@/stores/useAuthStore'
import Spinner from '@/components/common/spinner/Spinner'
import Tabbar from '@/components/common/tabbar/tabbar'
import ChatRoom from '@/components/chat/ChatRoom'
import Community from '@/components/community/Community'

const Page = () => {
  const [nbread, setNbread] = useState<Nbread | null>(null)
  const [nbreadRecords, setNbreadRecords] = useState<NbreadRecord[] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const params = useParams()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<number>(0)

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<Nbread>({ mode: 'onChange' })

  // 엔빵 및 참여자 정보를 DB로부터 불러오는 함수
  const fetchNbreadData = async () => {
    const nbreadId = params.nbreadId as string

    const [nbreadData, participants] = await Promise.all([
      getNbread(nbreadId),
      getParticipants(nbreadId),
    ])

    const paymentAmount =
      Math.floor(nbreadData!.amount / nbreadData!.participantCount) || 0

    setNbread({ ...nbreadData, paymentAmount, participants })
  }

  useEffect(() => {
    setIsLoading(true)

    if (!params.nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }

    fetchNbreadData()
  }, [])

  useEffect(() => {
    const fetchNbreadRecordData = async () => {
      const nbreadRecordsData = await getNbreadRecords(
        nbread!.id,
        nbread!.currentPaymentDate!,
      )
      setNbreadRecords(nbreadRecordsData)
    }

    if (nbread) {
      reset(nbread)
      fetchNbreadRecordData()
    }
  }, [nbread])

  useEffect(() => {
    if (nbreadRecords) {
      setIsLoading(false)
    }
  }, [nbreadRecords])

  if (isLoading || nbread == null) {
    return <Spinner isLoading={isLoading} />
  }

  const nbreadTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <NbreadDetail nbreadData={nbread} setNbreadData={setNbread} />
      case 1:
        return <Community />
      case 2:
        return <ChatRoom />
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="pl-24 pt-24">
        <DetailHeader />
      </div>
      <div className="flex flex-col overflow-y-hidden px-24">
        <header>
          {nbread && (
            <div className="flex flex-row items-center justify-between pb-12 pt-24">
              <h2>{isEditing ? '엔빵 수정하기' : nbread?.title}</h2>
            </div>
          )}
        </header>

        <Tabbar
          tabs={['엔빵 정보', '게시판', '채팅방']}
          initialValue={0}
          onTabChange={setSelectedTab}
        />
      </div>
      <div className="h-16" />
      <div className="h-full w-full px-24 pt-4">{nbreadTabContent()}</div>
    </div>
  )
}

export default Page
