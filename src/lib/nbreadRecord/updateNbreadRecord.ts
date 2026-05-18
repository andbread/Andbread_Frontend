import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'
import { captureAppError } from '@/lib/sentry'

export const updateNbreadRecord = async (
  nbreadId: string,
  userId: string,
  isPaid: boolean,
  startDate: string,
) => {
  const translatedStartDate = new Date(startDate).toISOString().split('T')[0]

  try {
    const { data, error } = await supabase
      .from('nbread_records')
      .update({
        is_paid: isPaid,
      })
      .eq('nbread_id', nbreadId)
      .eq('user_id', userId)
      .eq('payment_date', translatedStartDate)

    if (error) {
      console.error('Error updating nbread record:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating nbread record:', error)
    captureAppError(error, {
      action: 'nbread_record.update',
      tags: {
        nbreadId,
        userId,
        isPaid,
      },
      extra: {
        paymentDate: translatedStartDate,
      },
    })
    throw error
  }
}
