import { supabase } from '@/lib/supabaseClient'

export const upsertSubscribe = async (
  userId: string,
  endpoint: string,
  keys: Record<string, string>,
) => {
  try {
    const { data, error } = await supabase.from('push_subscription').upsert(
      {
        user_id: userId,
        endpoint,
        keys,
      },
      { onConflict: 'endpoint' },
    )

    if (error) {
      console.error('Error inserting push subscribe:', error)
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}
