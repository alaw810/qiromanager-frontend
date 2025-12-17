"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authApi, type LoginRequest, type RegisterRequest, type AuthResponse } from "@/lib/api/auth-api"
import { useRouter, usePathname } from "next/navigation"

export interface AuthUser {
  id: number
  username: string
  fullName: string // <--- AÑADIDO
  role: "ADMIN" | "USER"
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
        const userData = await authApi.me()
        
        // Guardamos todos los datos, incluido el fullName
        setUser({
          id: userData.id,
          username: userData.username,
          fullName: userData.fullName || userData.username, // Fallback por seguridad
          role: userData.role,
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
    setUser({
      id: response.id,
      username: response.username,
      fullName: response.fullName || response.username, // <--- AÑADIDO
      role: response.role,
    })

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