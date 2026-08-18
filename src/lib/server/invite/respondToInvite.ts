import type { SupabaseClient } from '@supabase/supabase-js'

export type InviteResponse = 'accepted' | 'rejected'

export interface InviteResponseResult {
  invite_id: string
  nbread_id: string
  status: InviteResponse
  outcome: 'joined' | 'already_participant' | 'rejected'
}

/**
 * respond_to_nbread_invite RPC를 그대로 호출한다.
 * 함수의 보안 속성은 건드리지 않는다.
 */
export const respondToInvite = async (
  client: SupabaseClient,
  inviteToken: string,
  response: InviteResponse,
): Promise<InviteResponseResult> => {
  const { data, error } = await client.rpc('respond_to_nbread_invite', {
    p_invite_token: inviteToken,
    p_response: response,
  })

  if (error) {
    throw error
  }

  return data as unknown as InviteResponseResult
}
