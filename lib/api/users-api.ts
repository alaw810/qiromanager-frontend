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

// Para cuando un ADMIN edita a otro usuario (sin password)
export interface UpdateUserRequest {
  fullName: string
  email: string
  username: string
  role: "ADMIN" | "USER"
}

// NUEVO: Para cuando el usuario edita SU PROPIO perfil (con password opcional)
export interface UpdateProfileRequest {
  fullName: string
  email: string
  username: string
  password?: string // Opcional: solo se envía si el usuario quiere cambiarla
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    // Si tu axiosClient ya tiene /api/v1 en la baseURL, quita /api/v1 de aquí.
    // Si no, déjalo como está. Asumo que está funcionando así:
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

  // Admin actualiza a otro usuario
  update: async (id: number, user: UpdateUserRequest): Promise<User> => {
    const response = await axiosClient.put<User>(`/api/v1/users/${id}`, user)
    return response.data
  },

  updateStatus: async (id: number, active: boolean): Promise<void> => {
    await axiosClient.patch(`/api/v1/users/${id}/status`, { active })
  },
  
  // Obtener datos del usuario logueado
  getMe: async (): Promise<User> => {
    const response = await axiosClient.get<User>("/api/v1/users/me")
    return response.data
  },

  // NUEVO: Actualizar perfil propio (incluyendo contraseña)
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await axiosClient.put<User>("/api/v1/users/me", data)
    return response.data
  }
}