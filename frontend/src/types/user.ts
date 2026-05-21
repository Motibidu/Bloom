export interface User {
  id: number
  email: string
  nickname: string
  bio?: string
  canWriteFeed: boolean
  profileImageUrl?: string
}
