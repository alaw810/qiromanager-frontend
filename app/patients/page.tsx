"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { PatientCard } from "@/components/patient-card"
import { PrivateRoute } from "@/components/auth/private-route"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { Plus, Loader2, Search, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function PatientsPageContent() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const { toast } = useToast()

  // ⭐ INFALLIBLE TOAST HANDLER: works with SSR/CSR/full reloads
  useEffect(() => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    const removed = url.searchParams.get("removed")

    if (removed === "1") {
      setTimeout(() => {
        toast({
          title: "Patient removed from your list",
        })
      }, 30)

      // Clean the URL so the toast doesn't repeat on refresh
      url.searchParams.delete("removed")
      window.history.replaceState({}, "", url.toString())
    }
  }, [toast])

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await patientsApi.getAll()
      setPatients(data)
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
      setPatients(data)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handlePatientUpdated = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="mt-2 text-muted-foreground">Manage your patients</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Patient
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
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
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            {searchQuery ? "No patients found" : "No patients yet"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different search term or clear the search."
              : "Get started by creating your first patient."}
          </p>
          {!searchQuery && (
            <Link href="/patients/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Patient
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onPatientUpdated={handlePatientUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PatientsPage() {
  return (
    <PrivateRoute>
      <PatientsPageContent />
    </PrivateRoute>
  )
}
