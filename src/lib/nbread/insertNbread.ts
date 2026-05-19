import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'
import { captureAppError } from '@/lib/sentry'

export const insertNbread = async (nbread: Nbread) => {
  try {
    const { data, error } = await supabase
      .from('nbread')
      .insert({
        title: nbread.title,
        participant_count: nbread.participantCount,
        amount: nbread.amount,
        payment_period: nbread.paymentPeriod,
        payment_date: nbread.paymentDate,
        payment_month: nbread.paymentMonth,
        leader_id: nbread.leaderId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting nbread:', error)
      throw error
    }

    return data.id
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.insert',
      tags: { leaderId: nbread.leaderId ?? undefined },
      extra: {
        paymentPeriod: nbread.paymentPeriod,
        participantCount: nbread.participantCount,
      },
    })
    throw error
  }
}
