import { JWT } from 'npm:google-auth-library@9'

let cachedFcmAccessToken: string | null = null
let fcmTokenExpirationTime: number | null = null

export const getFcmAccessToken = async ({
  clientEmail,
  privateKey,
}: {
  clientEmail: string
  privateKey: string
}): Promise<string> => {
  const now = Date.now()
  if (
    cachedFcmAccessToken &&
    fcmTokenExpirationTime &&
    now < fcmTokenExpirationTime
  ) {
    return cachedFcmAccessToken
  }

  const jwtClient = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })

  const tokens = await jwtClient.authorize()

  cachedFcmAccessToken = tokens.access_token!
  fcmTokenExpirationTime = tokens.expiry_date!
  if (tokens.access_token) {
    return tokens.access_token!
  } else {
    throw Error
  }
}
