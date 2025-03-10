import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'

export const updateNbreadRecord = async (
  nbreadId: string,
  userId: string,
  isPaid: boolean,
  currentPaymentDate: string,
) => {
  const translatedCurrentPaymentDate = new Date(currentPaymentDate)
    .toISOString()
    .split('T')[0]

  try {
    const { data, error } = await supabase
      .from('nbread_records')
      .update({
        is_paid: isPaid,
      })
      .eq('nbread_id', nbreadId)
      .eq('user_id', userId)
      .eq('payment_date', translatedCurrentPaymentDate) // payment-date가 currentPaymentDate와 동일한 row만 업데이트(가장 최신 row만 업데이트)

    if (error) {
      console.error('Error updating nbread record:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating nbread record:', error)
    throw error
  }
}
