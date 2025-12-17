import axios, { isAxiosError } from "axios"

// Use environment variable strictly. If missing, it helps to fail fast or log a warning in dev.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_BASE_URL) {
  console.warn("WARNING: NEXT_PUBLIC_API_URL is not defined. API calls may fail.")
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL || "http://localhost:8080", // Keep localhost fallback strictly for local dev convenience
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add JWT token
axiosClient.interceptors.request.use(
  (config) => {
    // Check if running in browser to avoid SSR errors with localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor to handle errors globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        
        // Only redirect if we are not already on the login page to avoid loops
        if (!window.location.pathname.includes("/login")) {
           window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  },
)

// Helper to extract error messages safely
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || "An unexpected error occurred"
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unknown error occurred"
}