"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { statsApi, type DashboardStats } from "@/lib/api/stats-api"
import { PrivateRoute } from "@/components/auth/private-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
    Users, UserCheck, Activity, UserPlus, ArrowRight, 
    CalendarDays, TrendingUp, ShieldCheck, Stethoscope, FileText,
    Archive 
} from "lucide-react"
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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])

  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardStats, allPatients] = await Promise.all([
          statsApi.getStats(),
          patientsApi.getAll({ assignedToMe: !isAdmin }) 
        ])

        setStats(dashboardStats)
        
        // Ordenar por ID descendente y coger 5
        const sorted = [...allPatients].sort((a, b) => b.id - a.id).slice(0, 5)
        setRecentPatients(sorted)
        
      } catch (error) {
        console.error("Failed to load dashboard data", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, isAdmin])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const inactivePatients = (stats?.totalPatients || 0) - (stats?.activePatients || 0)

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in-50">
      
      {/* Header Personalizado por Rol */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
             <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {greeting}, {user?.fullName?.split(" ")[0]}
             </h1>
             {isAdmin && <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-md">ADMIN</span>}
          </div>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Overview of the entire clinic performance." 
              : "Here is your personal activity summary."}
          </p>
        </div>
      </div>

      {/* --- VISTA DE ADMINISTRADOR --- */}
      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total System Patients */}
            <StatCard 
                title="Total Patients" 
                value={stats?.totalPatients} 
                subtitle="Registered in system"
                icon={<Users className="h-4 w-4 text-blue-600" />}
                colorClass="border-l-blue-500"
                bgIconClass="bg-blue-50"
            />
            {/* Active System Patients */}
            <StatCard 
                title="Active Patients" 
                value={stats?.activePatients} 
                subtitle="Currently active"
                icon={<Activity className="h-4 w-4 text-green-600" />}
                colorClass="border-l-green-500"
                bgIconClass="bg-green-50"
            />
            {/* Total System Sessions */}
            <StatCard 
                title="Total Sessions" 
                value={stats?.sessionsThisMonth} 
                subtitle="Performed this month (Global)"
                icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
                colorClass="border-l-orange-500"
                bgIconClass="bg-orange-50"
            />
             {/* Inactive Cases (Calculated) */}
             <StatCard 
                title="Inactive Cases" 
                value={inactivePatients} 
                subtitle="Patients currently inactive"
                icon={<Archive className="h-4 w-4 text-gray-600" />}
                colorClass="border-l-gray-500"
                bgIconClass="bg-gray-100"
            />
        </div>
      ) : (
      
      /* --- VISTA DE TERAPEUTA (USER) --- */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {/* My Assigned Patients */}
             <StatCard 
                title="My Patients" 
                value={stats?.myAssignedPatients} 
                subtitle="Assigned to you"
                icon={<UserCheck className="h-4 w-4 text-indigo-600" />}
                colorClass="border-l-indigo-500"
                bgIconClass="bg-indigo-50"
            />
            {/* My Sessions */}
            <StatCard 
                title="My Sessions" 
                value={stats?.sessionsThisMonth} 
                subtitle="Performed by you this month"
                icon={<Stethoscope className="h-4 w-4 text-teal-600" />}
                colorClass="border-l-teal-500"
                bgIconClass="bg-teal-50"
            />
             {/* Active Patients (Global Context - Opcional) */}
             <StatCard 
                title="Active Clinic Patients" 
                value={stats?.activePatients} 
                subtitle="Total active in clinic"
                icon={<Activity className="h-4 w-4 text-gray-600" />}
                colorClass="border-l-gray-300"
                bgIconClass="bg-gray-50"
            />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Patients List */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>{isAdmin ? "Recent Registrations" : "My Recent Patients"}</CardTitle>
            <CardDescription>
              {isAdmin ? "Latest patients added to the database." : "Patients assigned to you recently or created by you."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                   <Users className="h-8 w-8 mb-2 opacity-20" />
                   <p>No patients found.</p>
                </div>
              ) : (
                recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarFallback className="bg-primary/5 text-primary font-medium">
                          {patient.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <Link href={`/patients/${patient.id}`} className="block">
                          <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                            {patient.fullName}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">{patient.email || "No email provided"}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${patient.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {patient.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <Link href="/patients">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                  View All Patients <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Info - MANTENIDA INTENCIONALMENTE */}
        <div className="col-span-3 space-y-6">
            <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequent tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
                <Link href="/patients/new">
                    <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:border-primary/50 hover:bg-primary/5">
                    <UserPlus className="mr-3 h-5 w-5 text-primary" /> 
                    <div className="flex flex-col items-start">
                        <span className="font-medium">Register Patient</span>
                        <span className="text-xs text-muted-foreground">Add a new record</span>
                    </div>
                    </Button>
                </Link>
                <Link href="/patients">
                    <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:border-primary/50 hover:bg-primary/5">
                    <CalendarDays className="mr-3 h-5 w-5 text-primary" /> 
                    <div className="flex flex-col items-start">
                        <span className="font-medium">Schedule Session</span>
                        <span className="text-xs text-muted-foreground">Find a patient to log session</span>
                    </div>
                    </Button>
                </Link>
                <Link href="/profile">
                   <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:border-primary/50 hover:bg-primary/5">
                    <UserCheck className="mr-3 h-5 w-5 text-primary" /> 
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Update My Profile</span>
                    </div>
                   </Button>
                </Link>
            </CardContent>
            </Card>

            <Card className="bg-primary/5 border-none shadow-none">
                <CardHeader>
                    <CardTitle className="text-primary text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5"/> Did you know?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        You can drag and drop PDF files directly into a patient's clinical history to upload medical reports instantly.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

// Componente Helper para tarjetas
function StatCard({ title, value, subtitle, icon, colorClass, bgIconClass }: any) {
    return (
        <Card className={`border-l-4 ${colorClass} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`h-8 w-8 rounded-full ${bgIconClass} flex items-center justify-center`}>
              {icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </CardContent>
        </Card>
    )
}