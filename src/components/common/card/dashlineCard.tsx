import Icon, { IconType } from '../icon/icon'

interface DashlineCardProps {
  text: string
  tailwindColor: string
  iconType: IconType
  size: number
  onClick?: () => void
}

const DashlineCard = ({
  text,
  tailwindColor,
  iconType,
  size,
  onClick,
}: DashlineCardProps) => {
  return (
    <div
      className="card-dashline flex flex-row items-center justify-center gap-8 px-32 py-26"
      onClick={onClick}
    >
      <Icon type={iconType} width={size} height={size} fill={tailwindColor} />
      <div className="text-body02">{text}</div>
    </div>
  )
}

export default DashlineCard
