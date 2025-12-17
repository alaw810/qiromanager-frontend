"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { AdminRoute } from "@/components/auth/admin-route" // Asegúrate de que este componente existe
import { usersApi, type User } from "@/lib/api/users-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, UserCog, Shield, ShieldAlert, CheckCircle2, XCircle } from "lucide-react"
import { UsersListSkeleton } from "@/components/users/users-loading-skeleton"

export default function UsersPage() {
  return (
    <AdminRoute>
      <UsersPageContent />
    </AdminRoute>
  )
}

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
        </div>
        <UsersListSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in-50">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage therapist access and roles.
          </p>
        </div>
        {/* Aquí podrías poner un botón de "Invite User" si tuvieras esa función */}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-75">User Details</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No users found in the system.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.fullName || user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {user.role === "ADMIN" ? (
                      <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Shield className="w-3 h-3 mr-1" /> User
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {user.active ? (
                      <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </div>
                    ) : (
                      <div className="flex items-center text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full w-fit">
                        <XCircle className="w-3 h-3 mr-1" /> Inactive
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Link href={`/users/${user.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit Permissions">
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}