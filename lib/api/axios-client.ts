import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to attach JWT token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    // Detect if this error came from login/register
    const isAuthRequest =
      url.includes("/api/v1/auth/login") ||
      url.includes("/api/v1/auth/register");

    if (status === 401 && !isAuthRequest) {
      // Token expired or invalid – ONLY redirect if it's not a login attempt
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (status === 403) {
      // Access denied – redirect only if not an auth route
      if (!isAuthRequest && typeof window !== "undefined") {
        window.location.href = "/access-denied";
      }
    }

    return Promise.reject(error);
  },
);


export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError
    if (apiError?.message) {
      return apiError.message
    }
    return error.message || "An unexpected error occurred"
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}
