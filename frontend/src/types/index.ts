export type Category =
  | 'WALK'
  | 'COOKING'
  | 'READING'
  | 'GARDENING'
  | 'EXERCISE'
  | 'MEETING'
  | 'OTHER'

export interface CheckIn {
  id: number
  userId: number
  nickname: string
  category: Category
  title: string
  description: string
  photoUrls?: string[]
  likeCount: number
  likedByMe: boolean
  myReactionType: string | null
  reactionCounts: Record<string, number>
  commentCount: number
  viewCount: number
  createdAt: string
}

export interface Comment {
  id: number
  userId: number
  nickname: string
  content: string
  createdAt: string
}

export interface TodayFeedResponse {
  checkins: CheckIn[]
  sameCategoryUserCount: number
}

export interface CalendarDayEntry {
  date: string
  categories: Category[]
}

export interface CategoryStats {
  category: Category
  count: number
}

export interface PhotoUploadUrlRequest {
  filename: string
  contentType: string
}

export interface PhotoUploadUrlResponse {
  uploadUrl: string
  objectKey: string
  expiresIn: number
}
