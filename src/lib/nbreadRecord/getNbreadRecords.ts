import { supabase } from '@/lib/supabaseClient'
import { Nbread, NbreadRecord } from '@/types/nbread'

export const getNbreadRecords = async (
  nbreadId: string,
  currentPaymentDate: string,
) => {
  const translatedCurrentPaymentDate = new Date(currentPaymentDate)
    .toISOString()
    .split('T')[0]

  try {
    const { data, error } = await supabase
      .from('nbread_records')
      .select('*')
      .eq('nbread_id', nbreadId)
      .eq('payment_date', translatedCurrentPaymentDate) // payment-date가 currentPaymentDate와 동일한 row만 불러오기

    if (error) {
      console.error('Error fetching nbread record:', error)
      throw error
    }

    const renamedNbreadData: NbreadRecord[] = data.map((item) => ({
      userId: item.user_id,
      nbreadId: item.nbread_id,
      paymentDate: item.payment_date,
      isPaid: item.is_paid,
    }))

    return renamedNbreadData
  } catch (error) {
    console.error('Error fetching nbread record:', error)
    throw error
  }
}
