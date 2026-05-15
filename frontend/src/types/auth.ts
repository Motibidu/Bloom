export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
  bio?: string
  birthYear: number
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
}
