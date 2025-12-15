"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PatientForm } from "@/components/patient-form"
import { PrivateRoute } from "@/components/auth/private-route"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { Loader2 } from "lucide-react"

function EditPatientPageContent() {
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const patientId = Number(params.id)

  useEffect(() => {
    loadPatient()
  }, [patientId])

  const loadPatient = async () => {
    try {
      setLoading(true)
      const data = await patientsApi.getById(patientId)
      setPatient(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Patient not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Edit Patient</h1>
        <p className="mt-2 text-muted-foreground">Update patient information</p>
      </div>
      <PatientForm patient={patient} mode="edit" />
    </div>
  )
}

export default function EditPatientPage() {
  return (
    <PrivateRoute>
      <EditPatientPageContent />
    </PrivateRoute>
  )
}
