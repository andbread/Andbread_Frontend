'use client'

import Avatar from '../../components/common/avatar/avatar'
import useUserStore from '@/stores/useAuthStore'

const MyInfo = () => {
  const { user } = useUserStore()

  return (
    <div className="card">
      <div className="flex items-center gap-20 py-4">
        <div className="flex-shrink-0">
          <Avatar profileImageUrl={user?.profileImage} size="large" />
        </div>
        <div className="flex-shrink-0 justify-between">
          <p className="mb-4 text-heading04 text-gray-800">
            {user?.name || '이름 없음'}
          </p>
          <p className="whitespace-nowrap text-body03 text-gray-600">
            {user?.socialType?.toUpperCase() || '소셜 로그인'} 계정
            <span className="ml-12 whitespace-nowrap text-body03 text-gray-400">
              {user?.email || '이메일 없음'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default MyInfo
