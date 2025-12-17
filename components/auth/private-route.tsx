"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { NavBar } from "@/components/navbar" // <--- Importamos la Navbar aquí

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Renderizamos la estructura de la app autenticada: Navbar + Contenido
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  )
}