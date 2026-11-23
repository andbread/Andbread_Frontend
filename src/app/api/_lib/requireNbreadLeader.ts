import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fail } from './response'

type NbreadLeaderResult = { ok: true } | { ok: false; response: NextResponse }

export const requireNbreadLeader = async (
  client: SupabaseClient,
  nbreadId: string,
  userId: string,
): Promise<NbreadLeaderResult> => {
  const { data, error } = await client
    .from('nbread')
    .select('leader_id')
    .eq('id', nbreadId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return { ok: false, response: fail(404, '엔빵을 찾을 수 없습니다.') }
  }

  if (data.leader_id !== userId) {
    return { ok: false, response: fail(403, '그룹장만 할 수 있습니다.') }
  }

  return { ok: true }
}
