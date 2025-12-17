import { axiosClient } from "./axios-client"

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  id: number
  username: string
  role: "ADMIN" | "USER"
  token: string
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>("/api/v1/auth/login", data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await axiosClient.post("/api/v1/auth/register", data)
  },

  me: async (): Promise<Omit<AuthResponse, "token">> => {
    const response = await axiosClient.get("/api/v1/users/me")
    return response.data
  },
}