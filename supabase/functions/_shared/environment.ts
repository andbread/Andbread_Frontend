export const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')
export const firebasePrivateKey = Deno.env
  .get('FIREBASE_PRIVATE_KEY')!
  .replace(/\\n/g, '\n')
export const firebaseProjectID = Deno.env.get('FIREBASE_PROJECT_ID')
