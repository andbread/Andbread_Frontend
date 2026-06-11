export interface User {
  id: string
  name: string
  socialType: 'kakao' | 'google'
  profileImage: string | null
  email: string
  tag: number
}
export interface LoginProvider {
  provider: 'kakao' | 'google'
}
