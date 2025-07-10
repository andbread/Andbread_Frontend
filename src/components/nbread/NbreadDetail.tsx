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
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import NbreadDeleteModal from '@/components/common/modal/NbreadDeleteModal'
import NbreadInviteModal from '@/components/common/modal/NbreadInviteModal'
import { getNbreadRecords } from '@/lib/nbreadRecord'
import useUserStore from '@/stores/useAuthStore'
import QuitNbreadModal from '@/components/common/modal/QuitNbreadModal'
import Spinner from '@/components/common/spinner/Spinner'
import InviteBottomSheet from '@/components/invite/InviteBottomSheet'

interface nbreadDetailProps {
  nbreadData: Nbread
  setNbreadData: Dispatch<SetStateAction<Nbread | null>>
}

const nbreadDetail = ({ nbreadData, setNbreadData }: nbreadDetailProps) => {
  const userData = useUserStore((state) => state.user)
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
  const [isInviteBottomSheetOpen, setIsInviteBottomSheetOpen] = useState(false)
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
    if (nbreadData === editedNbreadData) return

    await updateNbread(editedNbreadData)
    setNbreadData({ ...editedNbreadData })
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
  const fetchNbreadParticipantData = async () => {
    const nbreadId = params.nbreadId as string

    const participants = await getParticipants(nbreadId)
    const paymentAmount =
      Math.floor(nbreadData!.amount / nbreadData!.participantCount) || 0

    setNbreadData({
      ...nbreadData,
      paymentAmount: paymentAmount,
      participants: participants,
    })
  }

  // 엔빵 탈퇴 처리 함수
  const onSubmitQuitNbread = async () => {
    try {
      await deleteParticipants(userData?.id!, nbreadData!.id)
      setIsQuitNbreadModalOpen(false)
      useToast.success('엔빵 나가기에 성공했어요.')
      router.replace('/')
    } catch (error) {
      useToast.success('엔빵 나가기에 실패했어요.')
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchNbreadParticipantData()
  }, [])

  useEffect(() => {
    const fetchNbreadRecordData = async () => {
      const nbreadRecordsData = await getNbreadRecords(
        nbreadData!.id,
        nbreadData!.currentPaymentDate!,
      )
      setNbreadRecords(nbreadRecordsData)
    }

    const paymentAmount =
      Math.floor(nbreadData!.amount / nbreadData!.participantCount) || 0
    if (nbreadData) {
      reset(nbreadData)
      fetchNbreadRecordData()
    }
  }, [nbreadData])

  useEffect(() => {
    if (nbreadRecords) {
      setIsLoading(false)
    }
  }, [nbreadRecords])

  if (isLoading) {
    return <Spinner isLoading={isLoading} />
  }

  return (
    <main className="h-full">
      <section className="pb-40">
        {nbreadData && (
          <>
            {isEditing ? (
              <NbreadEditCard
                register={register}
                setValue={setValue}
                getValues={getValues}
                defaultNbreadValue={nbreadData}
                handleEditingNbread={handleEditingNbread}
              />
            ) : (
              <NbreadCard
                nbreadData={nbreadData as Nbread}
                userData={userData}
                handleEditingNbread={handleEditingNbread}
              />
            )}
            {nbreadRecords && (
              <NbreadParticipantsList
                nbreadId={nbreadData.id}
                nbreadRecords={nbreadRecords!}
                currentPaymentDate={nbreadData.currentPaymentDate!}
                participants={nbreadData.participants!}
                participantMaxCount={nbreadData.participantCount}
                leaderId={nbreadData.leaderId!}
                isEditing={isEditing}
                paymentAmount={nbreadData.paymentAmount!}
                // onClickInvite={() => setIsNbreadInviteModalOpen(true)}
                onClickInvite={() => setIsInviteBottomSheetOpen(true)}
                updateParticipantData={() => fetchNbreadParticipantData()}
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
        {userData?.id !== nbreadData?.leaderId && (
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
          onSubmit={() => handleDeleteNbread(nbreadData!.id)}
        />
        {/* 친구 초대 버튼 클릭시 초대 링크 공유 모달 임시 주석 처리 */}
        {/* <NbreadInviteModal
          isOpen={isNbreadInviteModalOpen}
          onClose={() => setIsNbreadInviteModalOpen(false)}
          nbreadId={params.nbreadId as string}
        /> */}
        <InviteBottomSheet
          isOpen={isInviteBottomSheetOpen}
          onClose={() => setIsInviteBottomSheetOpen(false)}
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

export default nbreadDetail
