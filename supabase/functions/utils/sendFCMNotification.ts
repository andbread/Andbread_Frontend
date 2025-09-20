import { firebaseProjectID } from '../_shared/environment.ts'
import { supabaseClient } from '../_shared/createClient.ts'

export const sendFCMNotification = async (
  fcmToken: string,
  accessToken: string,
  msgTitle: string,
  msgBody: string,
): Promise<{ fcmToken: string; status: string }> => {
  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${firebaseProjectID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: msgTitle,
              body: msgBody,
            },
          },
        }),
      },
    )

    const resData = await res.json()

    if (res.status < 200 || 299 < res.status) {
      const errorCode =
        resData.error?.details?.[0]?.errorCode ||
        resData.error?.status ||
        'UNKNOWN_ERROR'
      console.error('Error sending FCM message:', errorCode)

      if (errorCode === 'UNREGISTERED') {
        await deleteUnregisteredToken(fcmToken)
      }
      return { fcmToken, status: errorCode }
    } else {
      return { fcmToken, status: 'SUCCESS' }
    }
  } catch (error) {
    console.error('Error sending FCM message:', error)
    return { fcmToken, status: 'SEND_ERROR' }
  }
}

const deleteUnregisteredToken = async (unregisteredToken: string) => {
  try {
    await supabaseClient
      .from('fcm_token')
      .delete()
      .eq('fcm_token', unregisteredToken)
  } catch (error) {
    console.error('Error deleting unregistered FCM token:', error)
  }
}
