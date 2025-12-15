import { axiosClient } from "./axios-client"

export interface User {
  id: number
  fullName: string
  email: string
  username: string
  role: "ADMIN" | "USER"
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  fullName?: string
  email?: string
  role?: "ADMIN" | "USER"
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await axiosClient.get<User[]>("/api/v1/users")
    return response.data
  },

  getById: async (id: number): Promise<User> => {
    const response = await axiosClient.get<User>(`/api/v1/users/${id}`)
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await axiosClient.get<User>("/api/v1/users/me")
    return response.data
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await axiosClient.put<User>(`/api/v1/users/${id}`, data)
    return response.data
  },

  updateStatus: async (id: number, active: boolean): Promise<void> => {
    await axiosClient.patch(`/api/v1/users/${id}/status`, { active })
  },
}
