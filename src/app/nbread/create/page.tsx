'use client'

import DetailHeader from '@/components/common/header/detailHeader'
import NbreadEditCard from '@/components/nbread/nbreadEditCard'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Nbread } from '@/types/nbread'
import classNames from 'classnames'
import { useEffect } from 'react'
import useNbreadStore from '@/stores/useNbreadStore'
import useUserStore from '@/stores/useAuthStore'

const Page = () => {
  const router = useRouter()
  const userData = useUserStore((state) => state.user)
  const { setNbread } = useNbreadStore()
  const nbreadFormData = useNbreadStore((state) => state.nbread)
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<Nbread>({ mode: 'onChange' })

  const onSubmit = (data: Nbread) => {
    data.leaderId = userData!.id
    data.participants = [{ user: userData!, isLeader: true }]

    setNbread(data)
    router.push('/nbread/preview')
  }

  useEffect(() => {
    if (nbreadFormData !== null) {
      reset(nbreadFormData)
    }
  }, [])

  return (
    <main className="flex h-full flex-col justify-between p-24">
      <section>
        <DetailHeader />
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
    </main>
  )
}

export default Page
