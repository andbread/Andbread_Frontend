import { User as AuthUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { UserRow } from '@/types/supabase'
import { User } from '@/types/user'

export const TERMS_VERSION = '2026-05-26'
export const PRIVACY_VERSION = '2026-05-26'

const USER_ROW_RETRY_COUNT = 2
const USER_ROW_RETRY_DELAY_MS = 300

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const hasRequiredTermsAgreement = (user: UserRow) =>
  user.terms_agreed && user.privacy_agreed

export const toUserStoreValue = (
  authUser: AuthUser,
  userRow: UserRow,
): User => {
  const provider = authUser.app_metadata.provider as 'kakao' | 'google'

  return {
    id: authUser.id,
    email: userRow.email || authUser.email || '',
    socialType: provider,
    name:
      userRow.name ||
      authUser.user_metadata.full_name ||
      authUser.user_metadata.name ||
      '',
    profileImage:
      userRow.profile_image || authUser.user_metadata.avatar_url || '',
    tag: Number(userRow.tag),
  }
}

export const getCurrentUserRow = async (userId: string) => {
  for (let attempt = 0; attempt <= USER_ROW_RETRY_COUNT; attempt += 1) {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data) {
      return data
    }

    if (attempt < USER_ROW_RETRY_COUNT) {
      await delay(USER_ROW_RETRY_DELAY_MS)
    }
  }

  return null
}

export const agreeRequiredTerms = async (userId: string) => {
  const agreedAt = new Date().toISOString()

  const { error } = await supabase
    .from('user')
    .update({
      terms_agreed: true,
      terms_agreed_at: agreedAt,
      terms_version: TERMS_VERSION,
      privacy_agreed: true,
      privacy_agreed_at: agreedAt,
      privacy_version: PRIVACY_VERSION,
    })
    .eq('id', userId)

  if (error) {
    throw error
  }
}
