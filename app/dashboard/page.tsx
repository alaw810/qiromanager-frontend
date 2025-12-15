"use client"

import { useEffect, useState } from "react"
import { PrivateRoute } from "@/components/auth/private-route"
import { useAuth } from "@/contexts/auth-context"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  UserCircle,
  User,
  Heart,
  FilePlus,
  UserPlus,
  Loader2,
} from "lucide-react"

import Link from "next/link"

import { usersApi, type User as UserModel } from "@/lib/api/users-api"
import { patientsApi, type Patient } from "@/lib/api/patients-api"

/* -------------------------------------------------------------------------- */
/*                DASHBOARD FOR THERAPISTS (ROLE_USER)                        */
/* -------------------------------------------------------------------------- */

function TherapistDashboard({ user }: any) {
  const stats = [
    { title: "Welcome", value: user?.username || "User", icon: LayoutDashboard, description: "Your dashboard" },
    { title: "Role", value: user?.role || "USER", icon: Users, description: "Your access level" },
    { title: "Status", value: "Active", icon: Activity, description: "Account status" },
    { title: "Settings", value: "Configured", icon: Settings, description: "System ready" },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back, {user?.username}! Here's an overview of your account.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                View your profile and settings
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Explore available features
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-medium">{user?.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-medium">{user?.username}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {user?.role}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------------------- */
/*                DASHBOARD FOR ADMIN (ROLE_ADMIN)                            */
/* -------------------------------------------------------------------------- */

function AdminDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserModel[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setError(null)
    try {
      const [usersData, patientsData] = await Promise.all([
        usersApi.getAll(),
        patientsApi.getAll(),
      ])
      setUsers(usersData)
      setPatients(patientsData)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const activePatients = patients.filter((p) => p.active)
  const inactivePatients = patients.filter((p) => !p.active)

  const latestUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  const latestPatients = [...patients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-10">Welcome back, {user?.username}! Here's your system overview.</p>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard title="Total Users" value={users.length} icon={Users} />
        <StatCard title="Patients" value={patients.length} icon={UserCircle} />
        <StatCard title="Active Patients" value={activePatients.length} icon={Activity} />
        <StatCard title="Inactive Patients" value={inactivePatients.length} icon={User} />
      </div>

      {/* Quick Actions */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Shortcuts for common admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/users"><Button variant="outline" className="gap-2"><Users className="h-4 w-4" />Manage Users</Button></Link>
          <Link href="/patients"><Button variant="outline" className="gap-2"><Heart className="h-4 w-4" />Manage Patients</Button></Link>
          <Link href="/patients/new"><Button variant="secondary" className="gap-2"><FilePlus className="h-4 w-4" />Create Patient</Button></Link>
          <Link href="/profile"><Button className="gap-2"><UserCircle className="h-4 w-4" />Profile Settings</Button></Link>
        </CardContent>
      </Card>

      {/* Latest Users */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Latest Users</CardTitle>
          <CardDescription>Recently registered accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {latestUsers.length === 0 ? (
            <p className="text-muted-foreground">No users yet.</p>
          ) : (
            <ul className="space-y-2">
              {latestUsers.map((u) => (
                <li key={u.id} className="flex justify-between text-sm">
                  <span>{u.fullName} ({u.username})</span>
                  <span className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Latest Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Patients</CardTitle>
          <CardDescription>Recently added patient records</CardDescription>
        </CardHeader>
        <CardContent>
          {latestPatients.length === 0 ? (
            <p className="text-muted-foreground">No patients yet.</p>
          ) : (
            <ul className="space-y-2">
              {latestPatients.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.fullName}</span>
                  <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*                                WRAPPER PAGE                                */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { isAdmin, user } = useAuth()

  return (
    <PrivateRoute>
      {isAdmin ? <AdminDashboard /> : <TherapistDashboard user={user} />}
    </PrivateRoute>
  )
}
