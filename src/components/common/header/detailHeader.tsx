'use client'

import { useRouter } from 'next/navigation'
import Icon from '../icon/icon'

export default function DetailHeader() {
  const router = useRouter()

  return (
    <header className="h-48 w-full pt-16">
      <div onClick={() => router.back()}>
        <Icon
          type="angleLeft"
          width={16}
          height={16}
          fill="text-gray-600"
        ></Icon>
      </div>
    </header>
  )
}
