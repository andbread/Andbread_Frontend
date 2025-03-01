'use client'

import DetailHeader from '@/components/common/header/detailHeader'
import Tab from '@/components/common/tab/tab'
import { useToast } from '@/components/common/toast/Toast'
import NbreadCard from '@/components/nbread/nbreadCard'
import NbreadEditCard from '@/components/nbread/nbreadEditCard'
import NbreadParticipantsList from '@/components/nbread/nbreadParticipantsList'
import { deleteNbread, getNbread, updateNbread } from '@/lib/nbread'
import { getParticipants } from '@/lib/participant'
import { Nbread } from '@/types/nbread'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import NbreadDeleteModal from '@/components/common/Modal/NbreadDeleteModal'
import NbreadInviteModal from '@/components/common/Modal/NbreadInviteModal'

const Page = () => {
  const [nbread, setNbread] = useState<Nbread | null>(null)
  const [isNbreadDeleteModalOpen, setIsNbreadDeleteModalOpen] =
    useState<boolean>(false)
  const [isNbreadInviteModalOpen, setIsNbreadInviteModalOpen] =
    useState<boolean>(false)

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

  // handleSubmit 콜백함수
  const onSubmit = async (editedNbreadData: Nbread) => {
    if (nbread === editedNbreadData) return

    await updateNbread(editedNbreadData)
    setNbread({ ...editedNbreadData })
    useToast.success('엔빵 정보가 수정되었어요.')
  }

  // 수정하기/저장하기 버튼 클릭 시 이벤트 핸들러 함수
  const handleEditingNbread = () => {
    if (isEditing) {
      handleSubmit(onSubmit)()
    }
    setIsEditing(!isEditing)
  }

  // 엔빵 삭제하기 버튼 클릭 시 이벤트 핸들러 함수
  const handleDeleteNbread = async (nbreadId: string) => {
    try {
      await deleteNbread(nbreadId)
      setIsNbreadDeleteModalOpen(false)
      useToast.success('엔빵이 삭제되었어요.')
      router.push('/home')
    } catch (error) {
      console.error(error)
      useToast.error('엔빵 삭제에 실패했어요. 다시 시도해주세요.')
    }
  }

  // TODO 친구 초대하기 버튼 클릭 시 이벤트 핸들러 함수 작성 필요
  const handleClickInviteCard = () => {
    setIsNbreadInviteModalOpen(true)
  }

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
                  onClick={() => handleEditingNbread()}
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
              nbreadId={nbread.id}
              currentPaymentDate={nbread.currentPaymentDate!}
              participants={nbread.participants!}
              participantMaxCount={nbread.participantCount}
              leaderId={nbread.leaderId!}
              isEditing={isEditing}
              paymentAmount={nbread.paymentAmount!}
              onClick={() => handleClickInviteCard()}
            />
          </>
        )}
        {isEditing && (
          <button
            className="btn btn-large btn-warning"
            onClick={() => setIsNbreadDeleteModalOpen(true)}
          >
            엔빵 삭제하기
          </button>
        )}
        <NbreadDeleteModal
          isOpen={isNbreadDeleteModalOpen}
          onClose={() => setIsNbreadDeleteModalOpen(false)}
          onSubmit={() => handleDeleteNbread(nbread!.id)}
        />
        <NbreadInviteModal
          isOpen={isNbreadInviteModalOpen}
          onClose={() => setIsNbreadInviteModalOpen(false)}
          // TODO onSubmit 시 초대 링크 클립보드 복사 기능 구현 필요
          onSubmit={() => console.log('친구 초대 링크 생성')}
        />
      </section>
    </main>
  )
}

export default Page
