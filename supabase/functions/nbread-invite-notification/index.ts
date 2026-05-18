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
import { filterNotificationEnabledUsers } from '../utils/filterNotificationEnabledUsers.ts'

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: NbreadInviteRow
  schema: 'public'
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()

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

    const invitedUserId = payload.record.invited_user_id

    const title = '🍞 엔빵 초대 알림'
    const message = `${nbreadTitle.title}에서 초대가 도착했어요`
    const enabledTargetUserIds = await filterNotificationEnabledUsers(
      [invitedUserId],
      'invite_enabled',
    )

    if (enabledTargetUserIds.length === 0) {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // 1. 초대된 user_id에 대한 FCM 토큰 조회
    const { data: fcmDeviceTokenData, error: fcmDeviceTokenError } =
      await supabaseClient
        .from('fcm_token')
        .select('*')
        .in('user_id', enabledTargetUserIds)

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

    // 2. FCM 서버에 알림 전송
    const fcmAccessToken = await getFcmAccessToken({
      clientEmail: firebaseClientEmail!,
      privateKey: firebasePrivateKey!,
    })

    const notificationPromises = fcmDeviceTokens.map((deviceToken) =>
      sendFCMNotification(deviceToken, fcmAccessToken, title, message),
    )

    const results = await Promise.all(notificationPromises)

    // 3. FCM 알림 성공 여부에 따라 DB에 알림 저장
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
        type: 'invite',
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
