import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { supabaseClient } from '../_shared/createClient.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  firebaseClientEmail,
  firebasePrivateKey,
} from '../_shared/environment.ts'
import { getFcmAccessToken } from '../utils/getFCMToken.ts'
import { sendFCMNotification } from '../utils/sendFCMNotification.ts'
import { insertNotificationResult } from '../utils/insertNotificationResult.ts'
import { UpdatePayload } from '../types/types.ts'
import { NbreadRecordsRow } from '../types/database.types.ts'

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: NbreadRecordsRow
  old_record: NbreadRecordsRow
  schema: 'public'
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()

  if (payload.old_record.is_paid === true || payload.record.is_paid === false) {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const nbreadId = payload.record.nbread_id
    const { data: nbreadTitle, error: nbreadTitleError } = await supabaseClient
      .from('nbread')
      .select('title')
      .eq('id', nbreadId)
      .single()

    if (nbreadTitleError || !nbreadTitle) {
      console.error(nbreadTitleError)
      return new Response(
        JSON.stringify({ error: 'Failed to get nbread title' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    const paidUserId = payload.record.user_id
    const { data: paidUserName, error: paidUserNameError } =
      await supabaseClient
        .from('user')
        .select('name')
        .eq('id', paidUserId)
        .single()
    if (paidUserNameError || !paidUserName) {
      console.error(paidUserNameError)
      return new Response(
        JSON.stringify({ error: 'Failed to get paid users name' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    const title = '🍞 엔빵 납부 완료'
    const message = `${paidUserName.name}님이 ${nbreadTitle.title} 납부를 완료했어요`

    // 1. nbread에 참여한 모든 사용자 ID 조회
    const { data: participantData, error: participantError } =
      await supabaseClient
        .from('participant')
        .select('user_id')
        .eq('nbread_id', nbreadId)

    if (participantError || !participantData) {
      console.log(participantError)
      return new Response(
        JSON.stringify({ error: 'Failed to get participants' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }
    // 2. 납부 완료한 유저 제외
    const targetUserIds = participantData
      .map((row) => row.user_id)
      .filter((id) => id !== paidUserId)

    // 3. 해당 user_id들에 대한 FCM 토큰 조회
    const { data: fcmDeviceTokenData, error: fcmDeviceTokenError } =
      await supabaseClient
        .from('fcm_token')
        .select('*')
        .in('user_id', targetUserIds)

    if (
      fcmDeviceTokenError ||
      !fcmDeviceTokenData ||
      fcmDeviceTokenData.length === 0
    ) {
      return new Response(JSON.stringify({ error: 'No FCM tokens found' }), {
        status: 500,
        headers: corsHeaders,
      })
    }
    const fcmDeviceTokens = fcmDeviceTokenData.map((row) => row.fcm_token)

    // 4. FCM 서버에 알림 전송
    const fcmAccessToken = await getFcmAccessToken({
      clientEmail: firebaseClientEmail!,
      privateKey: firebasePrivateKey!,
    })

    const notificationPromises = fcmDeviceTokens.map((deviceToken) =>
      sendFCMNotification(deviceToken, fcmAccessToken, title, message),
    )

    const results = await Promise.all(notificationPromises)

    // 5. FCM 알림 성공 여부에 따라 DB에 알림 저장
    const successTokenSet = new Set(
      results
        .filter((result) => result.status === 'SUCCESS')
        .map((result) => result.fcmToken),
    )

    const notifiedUserMap = new Map<string, string>()

    fcmDeviceTokenData.forEach(({ user_id, fcm_token }) => {
      if (successTokenSet.has(fcm_token) && !notifiedUserMap.has(user_id)) {
        notifiedUserMap.set(user_id, fcm_token)
      }
    })

    notifiedUserMap.forEach((_, user_id) => {
      insertNotificationResult({
        user_id,
        message,
        title,
        url: '',
        is_read: false,
        type: 'payment',
      })
    })
    return new Response(
      JSON.stringify({ message: 'Notification sent successfully' }),
      {
        status: 200,
        headers: corsHeaders,
      },
    )
  } catch (e) {
    console.error('Unexpected error:', e)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
