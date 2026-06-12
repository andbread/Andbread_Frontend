import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'

export async function testSendPaymentNotification() {
  const session = await supabase.auth.getSession()
  const accessToken = session.data.session?.access_token

  try {
    await axios.post(
      '/api/payment-notification',
      {
        nbreadId: '1752dd4f-7a7e-4709-9b08-ab5a7255d3dd',
        nbreadTitle: '라프텔',
        paidUserId: '444f290a-0ff8-4b7a-baf8-f9a513513f45',
        paidUserName: '신혜민',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`,
        },
      },
    )

  } catch (error) {
    console.error('[알림 전송 실패]', error)
  }
}
