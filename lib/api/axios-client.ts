import axios, { isAxiosError } from "axios"

// 1. Configuración robusta de la URL base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

// 2. Crear instancia LIMPIA (Sin headers globales peligrosos)
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  // IMPORTANTE: No definas 'Content-Type' aquí. Deja que axios lo decida por petición.
  headers: {
    "Accept": "application/json",
  },
})

// 3. Interceptor de Request: Inyectar Token
axiosClient.interceptors.request.use(
  (config) => {
    // Aseguramos que corra en el navegador
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 4. Interceptor de Response: Manejo de errores
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Si es 401 (Unauthorized), limpiar sesión y redirigir
    // PERO: Evitamos bucles infinitos si ya estamos en login
    if (status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("token")
        // Opcional: localStorage.removeItem("user")
        window.location.href = "/login?expired=true"
      }
    }
    return Promise.reject(error)
  }
)

// Helper para extraer mensajes de error limpios
export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    // Prioridad: Mensaje del backend > Mensaje HTTP genérico
    return error.response?.data?.message || error.response?.data?.error || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unknown error occurred"
}