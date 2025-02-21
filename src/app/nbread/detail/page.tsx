'use client'

import DetailHeader from '@/components/common/header/detailHeader'
import Tab from '@/components/common/tab/tab'
import NbreadCard from '@/components/nbread/nbreadCard'
import NbreadEditCard from '@/components/nbread/nbreadEditCard'
import NbreadParticipantsList from '@/components/nbread/nbreadParticipantsList'
import { Nbread } from '@/types/nbread'
import { User } from '@/types/user'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// TODO 기능 구현 후 더미데이터 삭제
const dummyUser: User = {
  id: '1',
  name: '신혜민',
  socialType: 'kakao',
  profileImage: null,
  email: 'shinhm1@naver.com',
}

const nbreadDummyData: Nbread = {
  id: '1',
  title: '나의 인도 가좍',
  participantCount: 5,
  amount: 80000,
  paymentAmount: 80000 / 5,
  paymentPeriod: 'year',
  paymentMonth: 8,
  paymentDate: 1,
  leaderId: '1',
  participants: [{ user: dummyUser, isLeader: true }],
}

const Page = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const {
    register,
    setValue,
    getValues,
    // handleSubmit,
    reset,
    // formState: { isValid },
  } = useForm<Nbread>({ mode: 'onChange' })

  useEffect(() => {
    reset(nbreadDummyData)
  }, [])

  return (
    <main className="h-full-y-auto relative p-24">
      <section>
        <DetailHeader />
        <div className="flex flex-row items-center justify-between pb-12 pt-24">
          <h2 className="">
            {isEditing ? '엔빵 수정하기' : nbreadDummyData?.title}
          </h2>
          <div className="h-20">
            <Tab
              content={isEditing ? '저장하기' : '수정하기'}
              size="large"
              isClicked={isEditing}
              onClick={() => setIsEditing(!isEditing)}
            />
          </div>
        </div>
        {isEditing ? (
          <NbreadEditCard
            register={register}
            setValue={setValue}
            getValues={getValues}
            defaultNbreadValue={nbreadDummyData}
          />
        ) : (
          <NbreadCard nbreadData={nbreadDummyData as Nbread} />
        )}
        <NbreadParticipantsList
          participants={nbreadDummyData.participants!}
          participantMaxCount={nbreadDummyData.participantCount}
          leaderId={nbreadDummyData.leaderId!}
          isEditing={isEditing}
          paymentAmount={nbreadDummyData.paymentAmount}
        />
      </section>
    </main>
  )
}

export default Page
