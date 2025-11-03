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
import { NbreadInviteRow } from '../types/database.types.ts'

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: NbreadInviteRow
  old_record: NbreadInviteRow
  schema: 'public'
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()

  if (payload.old_record.state === 'accepted') {
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
    const invitedUserId = payload.record.invited_user_id
    const nbreadId = payload.record.nbread_id

    // 초대받은 유저의 이름을 불러옴
    const { data: invitedUserNameData, error: invitedUserNameDataError } =
      await supabaseClient
        .from('user')
        .select('name')
        .eq('id', invitedUserId)
        .single()
    if (invitedUserNameDataError || !invitedUserNameData) {
      console.error(invitedUserNameDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to get invited user name' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // 해당 엔빵의 이름을 불러옴
    const { data: nbreadNameData, error: nbreadNameDataError } =
      await supabaseClient
        .from('nbread')
        .select('title')
        .eq('id', nbreadId)
        .single()
    if (nbreadNameDataError || !nbreadNameData) {
      console.error(nbreadNameDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to get nbread name' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // 알림 데이터 생성
    const title = '🍞 엔빵 초대 수락'
    const message = `${invitedUserNameData.name}님이 ${nbreadNameData.title}에 참여했어요`

    // 1. nbread에 참여한 모든 사용자 ID 조회
    const { data: participantsData, error: participantsDataError } =
      await supabaseClient
        .from('participant')
        .select('user_id')
        .eq('nbread_id', nbreadId)
    if (participantsDataError || !participantsData) {
      console.error(participantsDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to get participants' }),
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // 2. 초대를 수락한 유저 제외
    const targetUserIds = participantsData
      .map((row) => row.user_id)
      .filter((id) => id !== invitedUserId)

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
        is_read: false,
        type: 'invite_accept',
        data: {
          nbreadId: nbreadId,
        },
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
