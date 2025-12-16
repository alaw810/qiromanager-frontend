"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Users, Menu, X, User } from "lucide-react"
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
    <nav className="border-b border-border bg-primary/5 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-semibold text-primary tracking-tight">
              Qiromanager
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavLink href="/patients" icon={User} label="Patients" />
            {isAdmin && <NavLink href="/users" icon={Users} label="Users" />}

            {/* Profile + Logout */}
            <div className="ml-4 flex items-center gap-3 border-l border-border pl-4">
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={logout}
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
          <div className="border-t border-border py-4 md:hidden bg-background/95 backdrop-blur">
            <div className="flex flex-col gap-2">

              <MobileLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
              <MobileLink href="/patients" icon={User} label="Patients" onClick={() => setMobileMenuOpen(false)} />
              {isAdmin && (
                <MobileLink href="/users" icon={Users} label="Users" onClick={() => setMobileMenuOpen(false)} />
              )}

              {/* Mobile Footer */}
              <div className="mt-3 border-t border-border pt-3">
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Logged in as {user?.username}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-primary"
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
                 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
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
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium 
                 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
