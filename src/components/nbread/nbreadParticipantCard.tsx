import Avatar from '../common/avatar/avatar'

interface NbreadParticipantCardProps {
  profileImageUrl?: string
  isNbreadLeader: boolean
  name: string
  paymentAmount?: string
  hasCheckbox?: boolean
  isChecked?: boolean
  isCheckable?: boolean
  handleClickCheckbox?: () => void
  hasDelete?: boolean
  handleClickDelete?: () => void
}

const NbreadParticipantCard = (props: NbreadParticipantCardProps) => {
  return (
    <div className="card align-center flex flex-row items-center gap-16">
      <div className="w-40">
        <Avatar
          profileImageUrl={props.profileImageUrl}
          size="large"
          isNbreadLeader={props.isNbreadLeader}
        />
      </div>
      <div className="text-body01 text-gray-800">{props.name}</div>
    </div>
  )
}

export default NbreadParticipantCard
