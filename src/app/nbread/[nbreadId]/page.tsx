'use client'

import DetailHeader from '@/components/common/header/detailHeader'
import Tab from '@/components/common/tab/tab'
import { useToast } from '@/components/common/toast/Toast'
import NbreadCard from '@/components/nbread/nbreadCard'
import NbreadEditCard from '@/components/nbread/nbreadEditCard'
import NbreadParticipantsList from '@/components/nbread/nbreadParticipantsList'
import { getNbread } from '@/lib/nbread/getNbread'
import { getParticipants } from '@/lib/participant/getParticipants'
import { Nbread } from '@/types/nbread'
import { User } from '@/types/user'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const Page = () => {
  const [nbread, setNbread] = useState<Nbread | null>(null)
  const params = useParams()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<Nbread>({ mode: 'onChange' })

  useEffect(() => {
    if (!params.nbreadId) {
      useToast.error('잘못된 URL 주소입니다. 다시 시도해주세요.')
      router.back()
      return
    }

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

    fetchNbreadData()
  }, [])

  useEffect(() => {
    if (nbread) {
      console.log(nbread)
      reset(nbread)
    }
  }, [nbread])

  return (
    <main className="h-full-y-auto relative p-24">
      <section>
        <DetailHeader />
        {nbread && (
          <>
            <div className="flex flex-row items-center justify-between pb-12 pt-24">
              <h2 className="">
                {isEditing ? '엔빵 수정하기' : nbread?.title}
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
                defaultNbreadValue={nbread}
              />
            ) : (
              <NbreadCard nbreadData={nbread as Nbread} />
            )}
            <NbreadParticipantsList
              participants={nbread.participants!}
              participantMaxCount={nbread.participantCount}
              leaderId={nbread.leaderId!}
              isEditing={isEditing}
              paymentAmount={nbread.paymentAmount!}
            />
          </>
        )}
      </section>
    </main>
  )
}

export default Page
