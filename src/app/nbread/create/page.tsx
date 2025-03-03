'use client'

import DetailHeader from '@/components/common/header/detailHeader'
import NbreadEditCard from '@/components/nbread/nbreadEditCard'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Nbread } from '@/types/nbread'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import useNbreadStore from '@/stores/useNbreadStore'
import useUserStore from '@/stores/useAuthStore'
import Icon from '@/components/common/icon/Icon'
import ExitEditConfirmModal from '@/components/common/modal/ExitEditConfirmModal'

const Page = () => {
  const router = useRouter()
  const userData = useUserStore((state) => state.user)
  const { setNbread } = useNbreadStore()
  const nbread = useNbreadStore((state) => state.nbread)
  const [isExitEditConfirmModalOpen, setIsExitEditConfirmModalOpen] =
    useState<boolean>(false)

  const nbreadFormData = useNbreadStore((state) => state.nbread)
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm<Nbread>({ mode: 'onChange' })

  const onSubmit = (data: Nbread) => {
    data.leaderId = userData!.id
    data.participants = [{ user: userData!, isLeader: true }]

    setNbread(data)
    router.push('/nbread/preview')
  }

  const handleClickBack = () => {
    if (!nbread && isDirty) {
      setIsExitEditConfirmModalOpen(true)
    } else {
      router.back()
    }
  }

  useEffect(() => {
    if (nbreadFormData !== null) {
      reset(nbreadFormData)
    }
  }, [])

  return (
    <main className="flex h-full flex-col justify-between p-24">
      <section>
        <DetailHeader onClickBack={() => handleClickBack()} />
        <h3 className="pb-12 pt-20">엔빵 만들기 🍞</h3>
        <NbreadEditCard
          register={register}
          setValue={setValue}
          getValues={getValues}
          defaultNbreadValue={nbreadFormData || undefined}
        />
      </section>
      <button
        className={classNames('btn btn-large mb-20', {
          'btn-disabled': !isValid,
          'btn-primary': isValid,
        })}
        onClick={() => handleSubmit(onSubmit)()}
        disabled={!isValid}
      >
        저장하기
      </button>
      <ExitEditConfirmModal
        isOpen={isExitEditConfirmModalOpen}
        onClose={() => setIsExitEditConfirmModalOpen(false)}
        onSubmit={() => router.back()}
      />
    </main>
  )
}

export default Page
