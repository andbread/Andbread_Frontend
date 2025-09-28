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
import { FriendRequestRow } from '../types/database.types.ts'

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: FriendRequestRow
  old_record: FriendRequestRow
  schema: 'public'
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()

  if (payload.old_record.status === 'accepted') {
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
    const receiverId = payload.record.receiver_id
    const { data: receiverNameData, error: receiverNameDataError } =
      await supabaseClient
        .from('user')
        .select('name')
        .eq('id', receiverId)
        .single()
    if (receiverNameDataError || !receiverNameData) {
      console.error(receiverNameDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to get receiver name' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // 2. status에 따라 친구 요청 수락 / 거절 메시지 생성
    const requestAccepted = payload.record.status === 'accepted' ? true : false
    const title = requestAccepted ? '🍞 친구 요청 수락' : '🍞 친구 요청 거절'
    const message = requestAccepted
      ? `${receiverNameData.name}님이 친구 요청을 수락했어요`
      : `${receiverNameData.name}님이 친구 요청을 거절했어요`

    const { data: fcmDeviceTokenData, error: fcmDeviceTokenError } =
      await supabaseClient
        .from('fcm_token')
        .select('*')
        .eq('user_id', receiverId)

    if (fcmDeviceTokenError || !fcmDeviceTokenData) {
      return new Response(
        JSON.stringify({
          error: 'No FCM tokens found',
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // 3. 친구 요청 응답자의 FCM 토큰 조회
    const fcmAccessToken = await getFcmAccessToken({
      clientEmail: firebaseClientEmail!,
      privateKey: firebasePrivateKey,
    })

    const fcmDeviceTokens = fcmDeviceTokenData.map((row) => row.fcm_token)

    // 4. 친구 요청 응답자에 대해 FCM 알림 발송
    const notificationPromises = fcmDeviceTokens.map((token: string) =>
      sendFCMNotification(token, fcmAccessToken, title, message),
    )

    const results = await Promise.all(notificationPromises)

    // 5. 알림 발송 결과를 서버에 저장
    await Promise.all(
      results
        .filter((result: FriendRequestRow) => result.status === 'SUCCESS')
        .map((_: FriendRequestRow, idx: number) =>
          insertNotificationResult({
            user_id: fcmDeviceTokenData[idx].user_id,
            message: message,
            title: title,
            is_read: false,
            type: 'friend_response',
            data: {
              response: payload.record.status,
              receiver_id: receiverId,
              sender_name: receiverNameData.name,
            },
          }),
        ),
    )
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
