import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'

export const updateNbread = async (nbread: Nbread) => {
  try {
    const { data, error } = await supabase
      .from('nbread')
      .update({
        title: nbread.title,
        participant_count: nbread.participantCount,
        amount: nbread.amount,
        payment_period: nbread.paymentPeriod,
        payment_date: nbread.paymentDate,
        payment_month: nbread.paymentMonth,
        leader_id: nbread.leaderId,
      })
      .eq('id', nbread.id)

    if (error) {
      console.error('Error updating nbread:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating nbread:', error)
    throw error
  }
}
