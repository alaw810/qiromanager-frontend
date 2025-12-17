"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { PrivateRoute } from "@/components/auth/private-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, Activity, UserPlus, ArrowRight, CalendarDays } from "lucide-react"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardPage() {
  return (
    <PrivateRoute>
      <DashboardContent />
    </PrivateRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    myPatients: 0,
    recentPatients: [] as Patient[]
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const patients = await patientsApi.getAll()
        
        const myPatientsCount = patients.filter(p => 
          p.active && p.therapists?.some(t => t.id === user?.id)
        ).length

        const sortedPatients = [...patients].sort((a, b) => b.id - a.id)
        
        setStats({
          totalPatients: patients.length,
          activePatients: patients.filter(p => p.active).length,
          myPatients: myPatientsCount,
          recentPatients: sortedPatients.slice(0, 5)
        })
        
      } catch (error) {
        console.error("Failed to load dashboard data", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in-50">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          {/* CAMBIO: Usamos user.fullName, y si no existe (por seguridad) el username */}
          <h1 className="text-3xl font-bold tracking-tight">{greeting}, {user?.fullName || user?.username}</h1>
          <p className="text-muted-foreground">Here's what's happening in your clinic today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/patients/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> New Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Registered in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">Currently active patients</p>
          </CardContent>
        </Card>

        {/* CAMBIO: Eliminadas las clases bg-primary/5 y colores especiales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Patients</CardTitle>
            {/* CAMBIO: Icono ahora es gris (text-muted-foreground) como los demás */}
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* CAMBIO: Texto ahora es normal, no azul */}
            <div className="text-2xl font-bold">{stats.myPatients}</div>
            <p className="text-xs text-muted-foreground">Assigned to you directly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Appointments today (Soon)</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Patients Column */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>
              Latest patients added to the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.recentPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No patients found.</p>
              ) : (
                stats.recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                          <Link href={`/patients/${patient.id}`}>{patient.fullName}</Link>
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.email || "No email"}</p>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${patient.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {patient.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6">
              <Link href="/patients">
                <Button variant="outline" className="w-full">
                  View All Patients <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Column */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Common tasks and links</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
             <Link href="/patients/new">
                <Button variant="ghost" className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" /> Register New Patient
                </Button>
             </Link>
             <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <UserCheck className="mr-2 h-4 w-4" /> Update My Profile
                </Button>
             </Link>
             <Button variant="ghost" className="w-full justify-start" disabled>
                <CalendarDays className="mr-2 h-4 w-4" /> Calendar (Coming Soon)
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}