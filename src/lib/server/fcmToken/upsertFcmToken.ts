import type { SupabaseClient } from '@supabase/supabase-js'

export const upsertFcmToken = async (
  client: SupabaseClient,
  userId: string,
  fcmToken: string,
) => {
  const { error } = await client.from('fcm_token').upsert(
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
}
