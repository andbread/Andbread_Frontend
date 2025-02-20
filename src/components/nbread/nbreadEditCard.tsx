'use client'

import useNbreadStore from '@/stores/useNbreadStore'
import Tabbar from '../common/tabbar/tabbar'
import { Nbread } from '@/types/nbread'
import { useEffect, useState } from 'react'
import {
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'

interface NbreadEditCardProps {
  register: UseFormRegister<Nbread>
  setValue: UseFormSetValue<Nbread>
  getValues: UseFormGetValues<Nbread>
}

const NbreadEditCard = ({
  register,
  setValue,
  getValues,
}: NbreadEditCardProps) => {
  const nbread = useNbreadStore((state) => state.nbread)
  const [amount, setAmount] = useState<number | undefined>(
    nbread ? nbread.amount : 0,
  )
  const [participantCount, setParticipantCount] = useState<number>(
    nbread ? nbread.participantCount : 1,
  )
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(
    nbread ? (nbread.paymentPeriod === 'year' ? 0 : 1) : 0,
  )

  const paymentPeriodTab = ['매년', '매월']
  const paymentPeriodValue = ['year', 'month']

  useEffect(() => {
    const selectedPaymentPeriod = paymentPeriodValue[selectedTabIndex] as
      | 'year'
      | 'month'
    setValue('paymentPeriod', selectedPaymentPeriod)

    if (selectedPaymentPeriod === 'month') {
      setValue('paymentMonth', null)
    }
  }, [selectedTabIndex])

  useEffect(() => {
    const calculatedValue =
      amount && participantCount ? Math.round(amount / participantCount) : 0

    if (getValues('paymentAmount') !== calculatedValue) {
      setValue('paymentAmount', calculatedValue)
    }
  }, [amount, participantCount, getValues, setValue])

  return (
    <>
      <div className="card px-24 pb-32">
        {/* ------------ 총 금액 ------------ */}
        <div className="pb-4 text-body03 text-gray-400">총 금액</div>
        <input
          {...register('amount', {
            onChange: (event) => setAmount(Number(event?.target.value)),
            required: '총 금액은 필수 입력 항목이에요.',
          })}
          type="number"
          className="text-heading02 text-secondary-200"
          placeholder="총 금액을 입력하세요"
        />
        <div className="flex flex-col gap-16 pt-32">
          {/* ------------ 타이틀 ------------ */}
          <div className="flex flex-row items-center justify-between">
            <div className="w-120 text-body02 text-gray-500">타이틀</div>
            <input
              {...register('title', {
                required: '타이틀은 필수 입력 항목이에요.',
              })}
              className="w-200 text-body02 text-gray-800"
              placeholder="타이틀을 입력해주세요"
            />
          </div>
          {/* ------------ 참여 인원 ------------ */}
          <div className="flex flex-row items-center justify-between">
            <div className="w-120 text-body02 text-gray-500">참여 인원</div>
            <select
              className="w-200 text-body02"
              {...register('participantCount', {
                onChange: (event) =>
                  setParticipantCount(Number(event.target.value)),
              })}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}명
                </option>
              ))}
            </select>
          </div>
          {/* ------------ 엔빵 금액 ------------ */}
          <div className="flex flex-row items-center justify-between">
            <div className="w-120 text-body02 text-gray-500">엔빵 금액</div>
            <input
              {...register('paymentAmount')}
              className="w-200 text-body02 text-gray-400"
              placeholder="0"
              disabled={true}
            />
          </div>
          {/* ------------ 결제 주기 ------------ */}
          <div className="flex flex-row items-center justify-between">
            <div className="w-120 text-body02 text-gray-500">결제 주기</div>
            <Tabbar
              tabs={paymentPeriodTab}
              initialValue={selectedTabIndex}
              onTabChange={setSelectedTabIndex}
            />
          </div>
          {/* ------------ 결제월 ------------ */}
          {paymentPeriodTab[selectedTabIndex] === '매년' && (
            <div className="flex flex-row items-center justify-between">
              <div className="w-120 text-body02 text-gray-500">정기 결제월</div>
              <select
                className="w-200 text-body02"
                {...register('paymentMonth')}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}월
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* ------------ 결제일 ------------ */}
          <div className="flex flex-row items-center justify-between">
            <div className="w-120 text-body02 text-gray-500">정기 결제일</div>
            <select className="w-200 text-body02" {...register('paymentDate')}>
              {Array.from({ length: 30 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}일
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  )
}

export default NbreadEditCard
