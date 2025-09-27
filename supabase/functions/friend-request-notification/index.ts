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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }
  let payload
  try {
    payload = await req.json()
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({
        error: 'Invalid payload',
      }),
      {
        status: 400,
        headers: corsHeaders,
      },
    )
  }
  try {
    // 1. 친구 요청자 및 응답자 정보 저장
    const senderId = payload.record.sender_id
    const receiverId = payload.record.receiver_id
    const { data: senderNameData, error: senderNameError } =
      await supabaseClient
        .from('user')
        .select('name')
        .eq('id', senderId)
        .single()
    if (senderNameError || !senderNameData) {
      return new Response(
        JSON.stringify({
          error: 'Failed to get sender name',
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // 2. 친구 요청 메시지 생성
    const senderName = senderNameData.name
    const title = `🍞 ${senderName}님의 친구 요청`
    const message = `${senderName}님이 친구 요청을 보냈어요.`
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
    const notificationPromises = fcmDeviceTokens.map((token) =>
      sendFCMNotification(token, fcmAccessToken, title, message),
    )

    const results = await Promise.all(notificationPromises)

    // 5. 알림 발송 결과를 서버에 저장
    await Promise.all(
      results
        .filter((result) => result.status === 'SUCCESS')
        .map((_, idx) =>
          insertNotificationResult({
            user_id: fcmDeviceTokenData[idx].user_id,
            message: message,
            title: title,
            is_read: false,
            type: 'friend_request',
            data: {
              sender_id: senderId,
              sender_name: senderName,
            },
          }),
        ),
    )
    return new Response(
      JSON.stringify({
        message: 'Notification sent successfully',
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    )
  } catch (e) {
    console.error('Unexpected error:', e)
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
})
