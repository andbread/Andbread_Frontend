import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { Nbread } from '@/types/nbread'
import { NbreadRow } from '@/types/supabase'

type GetNbreadType = { data: NbreadRow | null; error: PostgrestError | null }

export const getNbread = async (
  client: SupabaseClient,
  nbreadId: string,
): Promise<Nbread> => {
  const { data, error }: GetNbreadType = await client
    .from('nbread')
    .select('*')
    .eq('id', nbreadId)
    .single()

  if (error || !data) {
    console.error('Error select nbread:', error)
    throw error ?? new Error('Error select nbread')
  }

  return {
    id: data.id,
    title: data.title,
    participantCount: data.participant_count,
    amount: data.amount,
    paymentDate: data.payment_date,
    paymentMonth: data.payment_month,
    paymentPeriod: data.payment_period as 'year' | 'month',
    leaderId: data.leader_id,
    participants: null,
    startDate: data.start_date,
    endDate: data.end_date,
    paidCount: null,
  }
}
