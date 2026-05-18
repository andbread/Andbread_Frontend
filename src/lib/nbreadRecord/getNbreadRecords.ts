import { supabase } from '@/lib/supabaseClient'
import { Nbread, NbreadRecord } from '@/types/nbread'

export const getNbreadRecords = async (
  nbreadId: string,
  startDate: string,
) => {
  const translatedStartDate = new Date(startDate)
    .toISOString()
    .split('T')[0]

  try {
    const { data, error } = await supabase
      .from('nbread_records')
      .select('*')
      .eq('nbread_id', nbreadId)
      .eq('payment_date', translatedStartDate)

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
