import AngleLeft from '@/assets/icons/angle-left.svg'
import AngleRight from '@/assets/icons/angle-right.svg'
import Badge from '@/assets/icons/badge.svg'
import Calendar from '@/assets/icons/calendar.svg'
import Check from '@/assets/icons/check.svg'
import Copy from '@/assets/icons/copy.svg'
import CrossFill from '@/assets/icons/cross-fill.svg'
import Cross from '@/assets/icons/cross.svg'
import GoogleLogo from '@/assets/icons/login-google.svg'
import KakaoLogo from '@/assets/icons/login-kakao.svg'
import Plus from '@/assets/icons/plus.svg'
import Warning from '@/assets/icons/warning.svg'

const iconMap = {
  angleLeft: AngleLeft,
  angleRight: AngleRight,
  badge: Badge,
  calendar: Calendar,
  check: Check,
  copy: Copy,
  crossFill: CrossFill,
  cross: Cross,
  googleLogo: GoogleLogo,
  kakaoLogo: KakaoLogo,
  plus: Plus,
  warning: Warning,
} as const

// iconMap의 key를 type으로 변경
export type IconType = keyof typeof iconMap

interface IconProps {
  type: IconType
  width: number | string
  height: number | string
  fill?: string
}

const Icon = ({ type, width, height, fill = '' }: IconProps) => {
  const SelectedIcon = iconMap[type]

  return (
    <SelectedIcon
      width={width}
      height={height}
      className={`fill-current ${fill}`}
      aria-label={type}
      viewBox="0 0 24 24"
    />
  )
}

export default Icon
