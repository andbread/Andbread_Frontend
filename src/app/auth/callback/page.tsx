'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import useUserStore from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import Spinner from '@/components/common/spinner/Spinner'

// NProgress 스피너 비활성화
NProgress.configure({ showSpinner: false })

const CallbackPage = () => {
  const [loading, setLoading] = useState(true)
  const setUser = useUserStore((state) => state.setUser)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        NProgress.start() // 로딩 시작

        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Error fetching user data:', error.message)
          return
        }

        if (data.user) {
          const provider = data.user.app_metadata.provider as 'kakao' | 'google'

          const userInfo = {
            id: data.user.id,
            email: data.user.email || '',
            socialType: provider,
            name: data.user.user_metadata.full_name || '',
            profileImage: data.user.user_metadata.avatar_url || '',
          }
          setUser(userInfo) // 사용자 정보 세션 스토리지에 저장
          setTimeout(() => {
            setLoading(false)
            router.replace('/home')
          }, 1000)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        NProgress.done() // 로딩 완료
      }
    }

    fetchUserData()
  }, [router, setUser])

  return <Spinner isLoading={loading} />
}

export default CallbackPage
