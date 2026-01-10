"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Menu, 
  X, 
  User, 
  FileText // <-- NUEVO ICONO
} from "lucide-react"
import { useState } from "react"

/**
 * Clinical UI Navigation Bar
 * Clean, modern, soft blue, calm healthcare aesthetic
 */
export function NavBar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isAuthenticated) return null

  return (
    <nav className="border-b border-border bg-primary/5 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-semibold text-primary tracking-tight flex items-center gap-2">
              {/* Opcional: Icono junto al logo */}
              Qiromanager
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:gap-4 lg:gap-6">
            <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavLink href="/patients" icon={User} label="Patients" />
            {/* NUEVO BOTÓN: Clinical Records Hub */}
            <NavLink href="/dashboard/records" icon={FileText} label="Clinical Records" />
            
            {isAdmin && <NavLink href="/users" icon={Users} label="Users" />}

            {/* Profile + Logout */}
            <div className="ml-4 flex items-center gap-3 border-l border-border pl-4">
              <Link 
                href="/dashboard/profile" // Actualizado a la ruta correcta si la moviste
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                {/* Avatar circular simple con inicial */}
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline">{user?.username}</span>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden bg-background/95 backdrop-blur animate-in slide-in-from-top-5">
            <div className="flex flex-col gap-2">

              <MobileLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
              <MobileLink href="/patients" icon={User} label="Patients" onClick={() => setMobileMenuOpen(false)} />
              {/* NUEVO BOTÓN MOVIL */}
              <MobileLink href="/dashboard/records" icon={FileText} label="Clinical Records" onClick={() => setMobileMenuOpen(false)} />
              
              {isAdmin && (
                <MobileLink href="/users" icon={Users} label="Users" onClick={() => setMobileMenuOpen(false)} />
              )}

              {/* Mobile Footer */}
              <div className="mt-3 border-t border-border pt-3">
                <Link 
                  href="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary mb-2"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  My Profile
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

/* ------------ REUSABLE COMPONENTS ---------------- */

function NavLink({ href, icon: Icon, label }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium 
                 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function MobileLink({ href, icon: Icon, label, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium 
                 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}