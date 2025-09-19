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
import { FriendRequerstRow } from '../types/database.types.ts'

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: FriendRequerstRow
  old_record: FriendRequerstRow
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
    const senderId = payload.record.sender_id
    const receiverId = payload.record.receiver_id
    const { data: senderNameData, error: senderNameError } =
      await supabaseClient
        .from('user')
        .select('name')
        .eq('sender_id', id)
        .single()

    if (senderNameError || !senderNameData) {
      console.error(senderNameError)
      return new Response(
        JSON.stringify({ error: 'Failed to get sender name' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    const title = `🍞 ${senderNameData}님의 친구 요청`
    const message = `${senderNameData}님이 친구 요청을 보냈어요.`

    // 1. 친구 요청을 받은 유저의 fcm 토큰 조회
    const { data: fcmDeviceTokenData, error: fcmDeviceTokenError } =
      await supabaseClient
        .from('fcm_token')
        .select('*')
        .eq('receiver_id', receiverId)

    if (fcmDeviceTokenError || !fcmDeviceTokenData) {
      return new Response(JSON.stringify({ error: 'No FCM tokens found' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    // 2. FCM 서버에 알림 전송
    const fcmAccessToken = await getFcmAccessToken({
      clientEmail: firebaseClientEmail!,
      privateKey: firebasePrivateKey!,
    })

    const result = sendFCMNotification(
      fcmDeviceTokenData,
      fcmAccessToken,
      title,
      message,
    )

    // 3. FCM 알림 성공 여부에 따라 DB에 알림 저장
    if (result.status === 'SUCCESS') {
      await insertNotificationResult({
        user_id: receiverId,
        message,
        title,
        is_read: false,
        type: 'friend_request',
      })
    }

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
