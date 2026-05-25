export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
  bio?: string
  name?: string
  birthYear: number
  birthMonth?: number
  birthDay?: number
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  needsNicknameSetup?: boolean
}
