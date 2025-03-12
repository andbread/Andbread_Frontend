'use client'

import DetailHeader from '@/components/common/header/DetailHeader'
import Tab from '@/components/common/tab/tab'
import { useToast } from '@/components/common/toast/Toast'
import NbreadCard from '@/components/nbread/nbreadCard'
import NbreadEditCard from '@/components/nbread/nbreadEditCard'
import NbreadParticipantsList from '@/components/nbread/nbreadParticipantsList'
import { deleteNbread, getNbread, updateNbread } from '@/lib/nbread'
import { deleteParticipants, getParticipants } from '@/lib/participant'
import { Nbread, NbreadRecord } from '@/types/nbread'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import NbreadDeleteModal from '@/components/common/modal/NbreadDeleteModal'
import NbreadInviteModal from '@/components/common/modal/NbreadInviteModal'
import { getNbreadRecords } from '@/lib/nbreadRecord'
import useUserStore from '@/stores/useAuthStore'
import QuitNbreadModal from '@/components/common/modal/QuitNbreadModal'
import Spinner from '@/components/common/spinner/Spinner'

const Page = () => {
  const userData = useUserStore((state) => state.user)
  const [nbread, setNbread] = useState<Nbread | null>(null)
  const [nbreadRecords, setNbreadRecords] = useState<NbreadRecord[] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNbreadDeleteModalOpen, setIsNbreadDeleteModalOpen] =
    useState<boolean>(false)
  const [isNbreadInviteModalOpen, setIsNbreadInviteModalOpen] =
    useState<boolean>(false)
  const [isQuitNbreadModalOpen, setIsQuitNbreadModalOpen] =
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
      router.push('/')
    } catch (error) {
      console.error(error)
      useToast.error('엔빵 삭제에 실패했어요. 다시 시도해주세요.')
    }
  }

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

  // 엔빵 탈퇴 처리 함수
  const onSubmitQuitNbread = async () => {
    try {
      await deleteParticipants(userData?.id!, nbread!.id)
      setIsQuitNbreadModalOpen(false)
      useToast.success('엔빵 나가기에 성공했어요.')
      router.replace('/')
    } catch (error) {
      useToast.success('엔빵 나가기에 실패했어요.')
    }
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

  if (isLoading) {
    return <Spinner isLoading={isLoading} />
  }

  return (
    <main className="h-full p-24">
      <section>
        <DetailHeader />
        {nbread && (
          <>
            <div className="flex flex-row items-center justify-between pb-12 pt-24">
              <h2 className="">
                {isEditing ? '엔빵 수정하기' : nbread?.title}
              </h2>
              <div className="h-20">
                {userData?.id === nbread.leaderId && (
                  <Tab
                    content={isEditing ? '저장하기' : '수정하기'}
                    size="large"
                    isClicked={isEditing}
                    onClick={() => handleEditingNbread()}
                  />
                )}
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
            {nbreadRecords && (
              <NbreadParticipantsList
                nbreadId={nbread.id}
                nbreadRecords={nbreadRecords!}
                currentPaymentDate={nbread.currentPaymentDate!}
                participants={nbread.participants!}
                participantMaxCount={nbread.participantCount}
                leaderId={nbread.leaderId!}
                isEditing={isEditing}
                paymentAmount={nbread.paymentAmount!}
                onClickInvite={() => setIsNbreadInviteModalOpen(true)}
                updateParticipantData={() => fetchNbreadData()}
              />
            )}
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
        {userData?.id !== nbread?.leaderId && (
          <button
            className="btn btn-large btn-warning"
            onClick={() => setIsQuitNbreadModalOpen(true)}
          >
            엔빵 나가기
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
          nbreadId={params.nbreadId as string}
        />
        <QuitNbreadModal
          isOpen={isQuitNbreadModalOpen}
          onClose={() => setIsQuitNbreadModalOpen(false)}
          onSubmit={() => onSubmitQuitNbread()}
        />
      </section>
    </main>
  )
}

export default Page
