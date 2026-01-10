"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
// Mantenemos tus imports originales para no romper nada
import { authApi, type LoginRequest, type RegisterRequest, type AuthResponse } from "@/lib/api/auth-api"
import { useRouter } from "next/navigation"

export interface AuthUser {
  id: number
  username: string
  fullName: string 
  role: "ADMIN" | "USER"
  // Añadimos campos opcionales que a veces vienen del backend para evitar conflictos futuros
  email?: string
  active?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: LoginRequest) => Promise<AuthResponse>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  // --- CAMBIO 1: AÑADIR LA DEFINICIÓN DE SETUSER ---
  setUser: (user: AuthUser | null) => void 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const handleLogout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    router.push("/login")
  }, [router])

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token")
      
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        setToken(storedToken) 
        // Nota: Si authApi.me() no existe en tu versión actual de auth-api.ts,
        // deberías usar usersApi.getMe() o authApi.getMe() según lo tengas definido.
        // Asumo que te funciona así:
        const userData = await authApi.me()
        
        setUser({
          id: userData.id,
          username: userData.username,
          fullName: userData.fullName || userData.username, 
          role: userData.role
        })
      } catch (error) {
        console.error("Session restoration failed:", error)
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

const login = useCallback(async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await authApi.login(data)

    setToken(response.token)
    
    // Al loguear, guardamos los datos básicos. 
    // El email se cargará luego con 'me()' si recargas, o no hace falta de inmediato.
    const loggedUser: AuthUser = {
      id: response.id,
      username: response.username,
      fullName: response.fullName || response.username,
      role: response.role,
      // ELIMINADO: response.email (porque el backend no lo envía en el login)
    }
    
    setUser(loggedUser)
    localStorage.setItem("token", response.token)
    
    return response
  }, [])

  const register = useCallback(async (data: RegisterRequest): Promise<void> => {
    await authApi.register(data)
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout: handleLogout,
    // --- CAMBIO 2: EXPONER LA FUNCIÓN ---
    setUser, 
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}