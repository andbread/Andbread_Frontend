export interface Post {
  id: number
  content: string
  userId: string
  userName: string
  userProfileImage: string
  nbreadId : string
  createdAt: string
}
export interface PostInsert {
  content: string
  userId: string
  userName: string
  userProfileImage: string
  nbreadId : string
  createdAt: string
}
