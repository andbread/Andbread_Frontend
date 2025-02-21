export interface User {
  id: string
  name: string
  socialType: 'kakao' | 'google'
  profileImage: string | null
  email: string
}
