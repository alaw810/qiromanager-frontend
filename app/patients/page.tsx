"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation" // Importamos hooks de navegación modernos
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { PrivateRoute } from "@/components/auth/private-route"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { Plus, Search, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { ViewToggle } from "@/components/patients/view-toggle"
import { PatientListView } from "@/components/patients/patient-list-view"
import { PatientGridView } from "@/components/patients/patient-grid-view"
import { PatientGridSkeleton, PatientListSkeleton } from "@/components/patients/patients-loading-skeletons"

export default function PatientsPage() {
  return (
    <PrivateRoute>
      <PatientsPageContent />
    </PrivateRoute>
  )
}

function PatientsPageContent() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // 1. Cargar preferencia de vista
  useEffect(() => {
    const saved = localStorage.getItem("patients_view")
    if (saved === "grid" || saved === "list") {
      setView(saved)
    }
  }, [])

  const changeView = (newView: "grid" | "list") => {
    setView(newView)
    localStorage.setItem("patients_view", newView)
  }

  // 2. Manejo de Toasts (ej. al borrar paciente)
  useEffect(() => {
    if (searchParams.get("removed") === "1") {
      // Pequeño delay para asegurar que el toast manager esté listo
      setTimeout(() => toast({ title: "Patient deleted successfully" }), 0)
      
      // Limpiamos la URL sin recargar
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete("removed")
      router.replace(`/patients?${newParams.toString()}`)
    }
  }, [searchParams, toast, router])

  // 3. Carga de Pacientes (Centralizada)
  const fetchPatients = useCallback(async (query: string = "") => {
    setLoading(true)
    setError(null)
    try {
      let data: Patient[]
      
      if (query.trim()) {
        data = await patientsApi.search(query.trim())
      } else {
        data = await patientsApi.getAll()
      }

      // Por defecto mostramos solo activos si es la lista general
      // (Podrías añadir un toggle "Show Inactive" en el futuro)
      const activePatients = data.filter((p) => p.active)
      setPatients(activePatients)
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al inicio
  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Manejador de búsqueda
  const handleSearch = () => {
    fetchPatients(searchQuery)
  }

  const clearSearch = () => {
    setSearchQuery("")
    fetchPatients("")
  }

  const handlePatientUpdated = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage your clinic's patient records.</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={changeView} />
          <Link href="/patients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Button variant="secondary" onClick={handleSearch} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      <div className="min-h-75">
        {loading ? (
          // MOSTRAMOS SKELETONS SEGÚN LA VISTA
          view === "grid" ? <PatientGridSkeleton /> : <PatientListSkeleton />
        ) : patients.length === 0 ? (
          // ESTADO VACÍO
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center animate-in fade-in-50">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No patients found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              We couldn't find any active patients matching your search criteria.
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={clearSearch}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          // LISTA REAL
          view === "grid" ? (
            <PatientGridView patients={patients} onPatientUpdated={handlePatientUpdated} />
          ) : (
            <PatientListView patients={patients} />
          )
        )}
      </div>
    </div>
  )
}