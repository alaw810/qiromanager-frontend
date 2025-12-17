"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { NavBar } from "@/components/navbar" // Asegúrate de importar la Navbar

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (!isAdmin) {
        router.push("/dashboard") // Si no es admin, fuera
      }
    }
  }, [user, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  // AHORA: Renderizamos la Navbar aquí también para mantener la consistencia
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  )
}