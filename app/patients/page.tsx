"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { PrivateRoute } from "@/components/auth/private-route"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { Plus, Loader2, Search, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { ViewToggle } from "@/components/patients/view-toggle"
import { PatientListView } from "@/components/patients/patient-list-view"
import { PatientGridView } from "@/components/patients/patient-grid-view"

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
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name")

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const { toast } = useToast()

  // Load saved view
  useEffect(() => {
    const saved = localStorage.getItem("patients_view")
    if (saved === "grid" || saved === "list") {
      setView(saved)
    }
  }, [])

  // Save chosen view
  const changeView = (newView: "grid" | "list") => {
    setView(newView)
    localStorage.setItem("patients_view", newView)
  }

  // Toast for removed patients (SSR-proof)
  useEffect(() => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    const removed = url.searchParams.get("removed")

    if (removed === "1") {
      setTimeout(() => {
        toast({ title: "Patient removed from your list" })
      }, 30)

      url.searchParams.delete("removed")
      window.history.replaceState({}, "", url.toString())
    }
  }, [toast])

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await patientsApi.getAll()

      // Only active patients
      const activePatients = data.filter((p) => p.active)

      setPatients(activePatients)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPatients()
      return
    }

    try {
      setIsSearching(true)
      setError(null)
      const data = await patientsApi.search(searchQuery.trim())

      const filtered = data.filter((p) => p.active)
      setPatients(filtered)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    loadPatients()
  }

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  const handlePatientUpdated = (updated: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    )
  }

  // Sorting logic
  const sortedPatients = [...patients].sort((a, b) => {
    if (sortBy === "name") {
      return a.fullName.localeCompare(b.fullName)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your patients
          </p>
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

      {/* Search + Sort */}
      <div className="mb-6 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant={sortBy === "name" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("name")}
        >
          Sort Name
        </Button>

        <Button
          variant={sortBy === "createdAt" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("createdAt")}
        >
          Sort Created
        </Button>

        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedPatients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground">No patients found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different search term or clear filters.
          </p>
        </div>
      ) : view === "grid" ? (
        <PatientGridView
          patients={sortedPatients}
          onPatientUpdated={handlePatientUpdated}
        />
      ) : (
        <PatientListView patients={sortedPatients} />
      )}
    </div>
  )
}
