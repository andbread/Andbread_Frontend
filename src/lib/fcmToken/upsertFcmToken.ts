import { supabase } from '@/lib/supabaseClient'
import { captureAppError } from '@/lib/sentry'

export const upsertFcmToken = async (userId: string, fcmToken: string) => {
  try {
    const { data, error } = await supabase.from('fcm_token').upsert(
      {
        user_id: userId,
        fcm_token: fcmToken,
      },
      { onConflict: 'fcm_token' },
    )

    if (error) {
      console.error('Error upserting fcm token:', error)
      throw error
    }

    return data
  } catch (error) {
    captureAppError(error, {
      action: 'fcm_token.upsert',
      tags: { userId },
    })
    throw error
  }
}
