import { updateNbreadRecord } from '@/lib/nbreadRecord'
import Avatar from '../common/avatar/avatar'
import Checkbox from '../common/checkbox/checkbox'
import Icon from '../common/icon/Icon'
import { useToast } from '../common/toast/Toast'
import useUserStore from '@/stores/useAuthStore'
import { useRef, useState } from 'react'

interface NbreadParticipantCardProps {
  nbreadId?: string
  participantId: string
  currentPaymentDate?: string
  profileImageUrl?: string | null
  isNbreadLeader: boolean
  name: string
  paymentAmount?: number
  hasCheckbox?: boolean
  isChecked?: boolean
  isCheckboxDisabled?: boolean
  hasDelete?: boolean
  onClickDelete?: () => void
}

const NbreadParticipantCard = (props: NbreadParticipantCardProps) => {
  const [isChecked, setIsChecked] = useState<boolean>(props.isChecked || false)
  const userData = useUserStore((state) => state.user)
  const isThrottling = useRef(false)

  const handleClickCheckbox = async () => {
    if (isThrottling.current) return
    isThrottling.current = true // ✅ 실행 중 상태 설정

    try {
      await updateNbreadRecord(
        props.nbreadId!,
        props.participantId,
        !isChecked,
        props.currentPaymentDate!,
      )

      useToast.success('완료 여부 업데이트에 성공했어요.')
      setIsChecked((prev) => !prev)
    } catch (error) {
      useToast.error('완료 여부 업데이트에 실패했어요. 다시 시도해주세요.')
    }

    setTimeout(() => {
      isThrottling.current = false // ✅ 3초 후 다시 실행 가능하도록 초기화
    }, 3000)
  }

  return (
    <div className="card flex flex-row items-center justify-between">
      <div className="align-center flex flex-row items-center gap-16">
        <div className="w-40">
          <Avatar
            profileImageUrl={props.profileImageUrl}
            size="large"
            isNbreadLeader={props.isNbreadLeader}
          />
        </div>
        <div className="text-body01 text-gray-800">{props.name}</div>
        {props.hasCheckbox && (
          <div className="text-body02 text-gray-400">{`${props.paymentAmount?.toLocaleString()}원`}</div>
        )}
      </div>
      {props.hasCheckbox && (
        <Checkbox
          disabled={props.isCheckboxDisabled}
          isChecked={isChecked}
          onChange={() => handleClickCheckbox()}
        />
      )}
      {props.hasDelete && (
        <Icon
          type="cross"
          width={16}
          height={16}
          fill="text-gray-500"
          onClick={props.onClickDelete}
        />
      )}
    </div>
  )
}

export default NbreadParticipantCard
