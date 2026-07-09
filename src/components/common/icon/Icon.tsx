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
import Search from '@/assets/icons/search.svg'
import MenuDots from '@/assets/icons/menu-dots.svg'
import Profile from '@/assets/icons/profile.svg'
import Alarm from '@/assets/icons/alarm.svg'

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
  search: Search,
  menuDots: MenuDots,
  profile: Profile,
  alarm: Alarm,
} as const

// iconMap의 key를 type으로 변경
export type IconType = keyof typeof iconMap

interface IconProps {
  type: IconType
  width: number | string
  height: number | string
  fill?: string
  ariaHidden?: boolean
  ariaLabel?: string
  onClick?: () => void
}

const Icon = ({
  type,
  width,
  height,
  fill = '',
  ariaHidden,
  ariaLabel,
  onClick,
}: IconProps) => {
  const SelectedIcon = iconMap[type]

  return (
    <SelectedIcon
      width={width}
      height={height}
      className={`fill-current ${fill}`}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : ariaLabel || type}
      viewBox="0 0 24 24"
      onClick={onClick}
    />
  )
}

export default Icon
