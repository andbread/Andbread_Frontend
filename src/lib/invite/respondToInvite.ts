import { supabase } from '@/lib/supabaseClient'
import { captureAppError } from '@/lib/sentry/sentry'

export type InviteResponse = 'accepted' | 'rejected'

interface InviteResponseResult {
  invite_id: string
  nbread_id: string
  status: InviteResponse
  outcome: 'joined' | 'already_participant' | 'rejected'
}

export const respondToInvite = async (
  inviteToken: string,
  response: InviteResponse,
) => {
  const { data, error } = await supabase.rpc('respond_to_nbread_invite', {
    p_invite_token: inviteToken,
    p_response: response,
  })

  if (error) {
    captureAppError(error, {
      action: `invite.${response}`,
    })
    throw error
  }

  return data as unknown as InviteResponseResult
}
