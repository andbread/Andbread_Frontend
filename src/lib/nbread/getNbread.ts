import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'
import { NbreadRow } from '@/types/supabase'
import { PostgrestError } from '@supabase/supabase-js'

type GetNbreadType = { data: NbreadRow | null; error: PostgrestError | null }

export const getNbread = async (nbreadId: string) => {
  try {
    const { data, error }: GetNbreadType = await supabase
      .from('nbread')
      .select('*')
      .eq('id', nbreadId)
      .single()

    if (error || !data) {
      console.error('Error select nbread:', error)
      throw error
    }

    const nbread: Nbread = {
      id: data.id,
      title: data.title,
      participantCount: data.participant_count,
      amount: data.amount,
      paymentDate: data.payment_date,
      paymentMonth: data.payment_month,
      paymentPeriod: data.payment_period as 'year' | 'month',
      leaderId: data.leader_id,
      participants: null,
    }

    return nbread
  } catch (error) {
    console.error('Error fetching nbread:', error)
    throw error
  }
}
