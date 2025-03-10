'use client'

import DetailHeader from '@/components/common/header/DetailHeader'
import DashlineCard from '@/components/common/card/dashlineCard'
import NbreadCard from '@/components/nbread/nbreadCard'
import NbreadParticipantCard from '@/components/nbread/nbreadParticipantCard'
import useNbreadStore from '@/stores/useNbreadStore'
import { Nbread } from '@/types/nbread'
import { insertNbread } from '@/lib/nbread'
import { insertParticipant } from '@/lib/participant'
import { useToast } from '@/components/common/toast/Toast'
import { useRouter } from 'next/navigation'
import useUserStore from '@/stores/useAuthStore'
import { useEffect, useState } from 'react'
import Spinner from '@/components/common/spinner/Spinner'

const Page = () => {
  const nbreadData = useNbreadStore((state) => state.nbread)
  const userData = useUserStore((state) => state.user)
  const { clearNbread } = useNbreadStore()
  const router = useRouter()

  const [previewNbreadData, setPreviewNbreadData] = useState<Nbread | null>(
    null,
  )
  const [savedNbreadData, setSavedNbreadData] = useState<Nbread | null>(null)

  useEffect(() => {
    if (!nbreadData) {
      useToast.error('먼저 엔빵 폼을 작성해주세요.')
      router.push('/nbread/create')
    } else {
      setPreviewNbreadData(nbreadData)
    }
  }, [])

  useEffect(() => {
    if (!previewNbreadData && savedNbreadData) {
      setPreviewNbreadData(savedNbreadData)
    }
  }, [previewNbreadData, savedNbreadData])

  const handleClickSubmitButton = async () => {
    if (nbreadData && nbreadData.participants) {
      try {
        const newNbreadId = await insertNbread(nbreadData!)
        await insertParticipant(nbreadData.participants[0], newNbreadId)

        setSavedNbreadData(previewNbreadData)
        clearNbread()
        setPreviewNbreadData(null)
        useToast.success('엔빵 만들기에 성공했어요.')
        router.push('/home')
      } catch (error) {
        useToast.error('엔빵 만들기에 실패했어요. 다시 시도해주세요.')
        console.error(error)
        router.push('/nbread/create')
      }
    }
  }

  if (!previewNbreadData) {
    return <Spinner isLoading={true} />
  }

  return (
    <main className="h-full-y-auto relative p-24">
      <section>
        <DetailHeader />
        <div className="pb-4 pt-20 text-body03 text-gray-400">
          작성한 엔빵의 미리보기에요.
        </div>
        <h2 className="pb-12 pt-4">{previewNbreadData?.title}</h2>
        {<NbreadCard nbreadData={previewNbreadData as Nbread} />}
        <div className="mb-12 mt-40 text-body02 text-gray-500">참여한 사람</div>
        <div className="mb-40 flex flex-col gap-8">
          <NbreadParticipantCard
            isNbreadLeader={true}
            name={userData!.name}
            profileImageUrl={userData!.profileImage}
          />
          <DashlineCard
            text="친구는 엔빵을 만든 후 초대할 수 있어요."
            iconType="warning"
            size={12}
            tailwindColor="text-gray-00"
          />
        </div>
        <button
          className="btn btn-large btn-primary mb-20"
          onClick={() => handleClickSubmitButton()}
        >
          엔빵 만들기 🍞
        </button>
      </section>
    </main>
  )
}
export default Page
