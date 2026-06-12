'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/common/toast/Toast'
import { clearLegacyAuthStorage } from '@/lib/authStorage'
import { getSafeRedirectPath } from '@/lib/authRedirect'
import useUserStore from '@/stores/useAuthStore'
import {
  agreeRequiredTerms,
  getCurrentUserRow,
  hasRequiredTermsAgreement,
  toUserStoreValue,
} from '@/lib/termsAgreement'

export const useTermsAgreementPage = (next: string | null) => {
  const router = useRouter()
  const redirectPath = getSafeRedirectPath(next)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const storeUser = useUserStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)

  const isAllChecked = termsChecked && privacyChecked

  useEffect(() => {
    const checkAgreementState = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          router.replace('/login')
          return
        }

        const userRow = await getCurrentUserRow(data.user.id)

        if (!userRow) {
          useToast.error('사용자 정보를 찾을 수 없어요. 다시 로그인해주세요.')
          router.replace('/login')
          return
        }

        if (!storeUser) {
          setUser(toUserStoreValue(data.user, userRow))
        }

        if (hasRequiredTermsAgreement(userRow)) {
          router.replace(redirectPath)
          return
        }
      } catch (error) {
        console.error('Error checking terms agreement state:', error)
        useToast.error('약관 동의 상태를 확인하지 못했어요.')
        router.replace('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAgreementState()
  }, [redirectPath, router, setUser, storeUser])

  const toggleAll = useCallback(() => {
    const nextChecked = !isAllChecked
    setTermsChecked(nextChecked)
    setPrivacyChecked(nextChecked)
  }, [isAllChecked])

  const submitAgreement = useCallback(async () => {
    if (!isAllChecked || !storeUser || isSubmitting) return

    try {
      setIsSubmitting(true)
      await agreeRequiredTerms(storeUser.id)
      useToast.success('약관 동의가 완료됐어요.')
      router.replace(redirectPath)
    } catch (error) {
      console.error('Error submitting terms agreement:', error)
      useToast.error('약관 동의 저장에 실패했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }, [isAllChecked, isSubmitting, redirectPath, router, storeUser])

  const logoutAndGoLogin = useCallback(async () => {
    await supabase.auth.signOut()
    clearUser()
    clearLegacyAuthStorage()
    router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`)
  }, [clearUser, redirectPath, router])

  return {
    isLoading,
    isSubmitting,
    termsChecked,
    privacyChecked,
    isAllChecked,
    isExitModalOpen,
    setTermsChecked,
    setPrivacyChecked,
    setIsExitModalOpen,
    toggleAll,
    submitAgreement,
    logoutAndGoLogin,
  }
}
