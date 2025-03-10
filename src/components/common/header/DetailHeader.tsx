'use client'

import { useRouter } from 'next/navigation'
import Icon from '../icon/icon'

interface DetailHeaderProps {
  onClickBack?: () => void
}

export default function DetailHeader({ onClickBack }: DetailHeaderProps) {
  const router = useRouter()

  return (
    <header className="h-48 w-full pt-16">
      <div
        className="w-24 cursor-pointer"
        onClick={() => (onClickBack ? onClickBack() : router.back())}
      >
        <Icon type="angleLeft" width={16} height={16} fill="text-gray-600" />
      </div>
    </header>
  )
}
