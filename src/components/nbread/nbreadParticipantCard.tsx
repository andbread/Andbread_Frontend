import { updateNbreadRecord } from '@/lib/nbreadRecord'
import Avatar from '../common/avatar/avatar'
import Checkbox from '../common/checkbox/checkbox'
import Icon from '../common/icon/Icon'
import { useToast } from '../common/toast/Toast'
import useUserStore from '@/stores/useAuthStore'
import { useRef, useState } from 'react'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'

interface NbreadParticipantCardProps {
  nbreadId?: string
  participantId?: string
  startDate?: string
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
  const [isUpdating, setIsUpdating] = useState(false)
  // state는 다음 렌더 전까지 반영되지 않으므로 같은 틈의 연속 클릭은 ref로 막는다.
  const isUpdatingRef = useRef(false)

  const handleClickCheckbox = async () => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    setIsUpdating(true)

    try {
      await updateNbreadRecord(
        props.nbreadId!,
        props.participantId!,
        !isChecked,
        props.startDate!,
      )
      if (!isChecked) {
        trackEvent(GA_EVENTS.COMPLETE_PAYMENT, {
          group_id: props.nbreadId,
          participant_id: props.participantId,
        })
      }

      useToast.success('완료 여부가 업데이트되었어요.')
      setIsChecked((prev) => !prev)
    } catch {
      // Sentry 보고는 updateNbreadRecord가 하므로 여기서는 사용자에게 알리기만 한다.
      useToast.error('완료 여부 업데이트에 실패했어요. 다시 시도해주세요.')
    } finally {
      // 성공과 실패 모두 요청이 끝나면 바로 다시 누를 수 있다.
      isUpdatingRef.current = false
      setIsUpdating(false)
    }
  }

  return (
    <div
      className="card flex flex-row items-center justify-between"
      data-testid="participant-card"
    >
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
          disabled={props.isCheckboxDisabled || isUpdating}
          isChecked={isChecked}
          onChange={() => handleClickCheckbox()}
          testId="participant-payment-toggle"
        />
      )}
      {props.hasDelete && (
        <div className="cursor-pointer">
          <Icon
            type="cross"
            width={16}
            height={16}
            fill="text-gray-500"
            onClick={props.onClickDelete}
          />
        </div>
      )}
    </div>
  )
}

export default NbreadParticipantCard
