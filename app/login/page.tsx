"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getErrorMessage } from "@/lib/api/axios-client"
import { FormInput } from "@/components/form-input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

interface FormErrors {
  username?: string
  password?: string
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({ username: "", password: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, authLoading, router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.password) newErrors.password = "Password is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (apiError) setApiError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await login(formData)
      router.push("/dashboard")
    } catch (error) {
      setApiError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* LEFT SECTION: Branding & Image */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        
        {/* Background Image (Therapy/Massage Theme) */}
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                // Imagen de masaje/terapia profesional desde Unsplash
                backgroundImage: "url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop')" 
            }}
        />
        
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-zinc-900/50" />
        
        {/* LOGO (Large & White for Dark Background) */}
        <div className="relative z-20 flex items-center">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              {/* 'Q' más grande y en blanco */}
              <span className="font-black text-white text-5xl mr-0.5">Q</span>
              <div className="flex items-baseline">
                {/* 'iro' en blanco negrita */}
                <span className="font-bold text-white text-3xl tracking-tight">iro</span>
                {/* 'manager' en blanco suave */}
                <span className="font-light text-white/80 text-3xl tracking-tight">manager</span>
              </div>
            </Link>
        </div>

        {/* English Quote */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 border-l-2 border-white/50 pl-6">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;Efficient clinical management not only saves time but improves the quality of care your patients receive every day.&rdquo;
            </p>
            <footer className="text-sm text-white/80 font-light">Qiromanager System v0.3.0</footer>
          </blockquote>
        </div>
      </div>

      {/* RIGHT SECTION: Login Form */}
      <div className="lg:p-8 h-full flex items-center justify-center bg-background">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
          
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-3">
                <FormInput
                    label="Username"
                    name="username"
                    type="text"
                    placeholder="Ex: therapist_jane"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    disabled={isSubmitting}
                    autoComplete="username"
                />
                <FormInput
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                />
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-sm hover:shadow-md transition-all" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}