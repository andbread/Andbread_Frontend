import type { SupabaseClient } from '@supabase/supabase-js'

export const deleteNbread = async (
  client: SupabaseClient,
  nbreadId: string,
) => {
  const { error } = await client.from('nbread').delete().eq('id', nbreadId)

  if (error) {
    console.error('Error deleting nbread:', error)
    throw error
  }
}
