"use client"

import type { Patient } from "@/lib/api/patients-api"
import { PatientCard } from "@/components/patient-card"

interface PatientGridViewProps {
  patients: Patient[]
  onPatientUpdated?: (p: Patient) => void
}

export function PatientGridView({ patients, onPatientUpdated }: PatientGridViewProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onPatientUpdated={onPatientUpdated} />
      ))}
    </div>
  )
}
