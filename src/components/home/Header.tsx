'use client'

import { useRouter } from 'next/navigation'
import Icon from '@/components/common/icon/Icon'
import Avatar from '@/components/common/avatar/avatar'
import NbreadTextLogo from '@/assets/logo/nbread-logo-text.svg'
import useUserStore from '@/stores/useAuthStore'

const Header = () => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)

  return (
    <header className="my-16 flex items-start justify-between p-4">
      <div className="cursor-pointer" onClick={() => router.replace('/')}>
        <NbreadTextLogo />
      </div>
      <div className="flex h-full flex-row items-center gap-16">
        <div
          onClick={() => router.push('/calendar')}
          className="mb-2 cursor-pointer"
        >
          <Icon type="calendar" width={24} height={24} fill="text-gray-600" />
        </div>
        <button
          onClick={() => router.push('/mypage')}
          className="cursor-pointer"
        >
          <Avatar
            size="large"
            profileImageUrl={user ? user.profileImage : undefined}
          />
        </button>
      </div>
    </header>
  )
}

export default Header
