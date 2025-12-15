"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authApi, type LoginRequest, type RegisterRequest, type AuthResponse } from "@/lib/api/auth-api"
import { useRouter } from "next/navigation"

export interface AuthUser {
  id: number
  username: string
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

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await authApi.login(data)

    // Store in state
    setToken(response.token)
    setUser({
      id: response.id,
      username: response.username,
      role: response.role,
    })

    // Persist to localStorage
    localStorage.setItem("token", response.token)
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: response.id,
        username: response.username,
        role: response.role,
      }),
    )

    return response
  }, [])

  const register = useCallback(async (data: RegisterRequest): Promise<void> => {
    await authApi.register(data)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }, [router])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
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
