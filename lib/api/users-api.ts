import { axiosClient } from "./axios-client"

export interface User {
  id: number
  fullName: string
  email: string
  username: string
  role: "ADMIN" | "USER"
  active: boolean
  createdAt: string
}

export interface CreateUserRequest {
  fullName: string
  email: string
  username: string
  role: "ADMIN" | "USER"
}

export interface UpdateUserRequest {
  fullName: string
  email: string
  username: string // <--- AÑADIDO: Esto solucionará el error 2353
  role: "ADMIN" | "USER"
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

  create: async (user: CreateUserRequest): Promise<User> => {
    const response = await axiosClient.post<User>("/api/v1/users", user)
    return response.data
  },

  update: async (id: number, user: UpdateUserRequest): Promise<User> => {
    const response = await axiosClient.put<User>(`/api/v1/users/${id}`, user)
    return response.data
  },

  updateStatus: async (id: number, active: boolean): Promise<void> => {
    await axiosClient.patch(`/api/v1/users/${id}/status`, { active })
  },
  
  // Mantenemos getMe aquí por compatibilidad si se usa directamente,
  // aunque AuthContext usa el de auth-api.
  getMe: async (): Promise<User> => {
    const response = await axiosClient.get<User>("/api/v1/users/me")
    return response.data
  }
}