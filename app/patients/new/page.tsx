"use client"

import { PatientForm } from "@/components/patient-form"
import { PrivateRoute } from "@/components/auth/private-route"

function NewPatientPageContent() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">New Patient</h1>
        <p className="mt-2 text-muted-foreground">Add a new patient to the system</p>
      </div>
      <PatientForm mode="create" />
    </div>
  )
}

export default function NewPatientPage() {
  return (
    <PrivateRoute>
      <NewPatientPageContent />
    </PrivateRoute>
  )
}
