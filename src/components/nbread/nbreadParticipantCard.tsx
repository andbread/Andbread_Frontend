import Avatar from '../common/avatar/avatar'
import Checkbox from '../common/checkbox/checkbox'
import Icon from '../common/icon/icon'

interface NbreadParticipantCardProps {
  profileImageUrl?: string
  isNbreadLeader: boolean
  name: string
  paymentAmount?: number
  hasCheckbox?: boolean
  isChecked?: boolean
  isCheckboxDisabled?: boolean
  onClickCheckbox?: () => void
  hasDelete?: boolean
  onClickDelete?: () => void
}

const NbreadParticipantCard = (props: NbreadParticipantCardProps) => {
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
          isChecked={props.isChecked}
          onClick={() => props.onClickCheckbox && props.onClickCheckbox()}
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
