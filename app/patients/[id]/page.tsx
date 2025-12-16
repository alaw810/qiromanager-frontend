"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PrivateRoute } from "@/components/auth/private-route"
import { useAuth } from "@/contexts/auth-context"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Edit,
  UserX,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  UserPlus,
} from "lucide-react"

function PatientDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [unassignLoading, setUnassignLoading] = useState(false)
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

  const handleToggleStatus = async () => {
    if (!patient) return
    try {
      setStatusLoading(true)
      await patientsApi.updateStatus(patient.id, !patient.active)
      await loadPatient()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!patient) return
    try {
      setAssignLoading(true)
      await patientsApi.assignToMe(patient.id)
      await loadPatient()
      toast({ title: "Patient added to your list" })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAssignLoading(false)
    }
  }

  const handleUnassignFromMe = async () => {
    if (!patient) return

    const confirmed = window.confirm(
      "Are you sure you want to remove this patient from your list?"
    )
    if (!confirmed) return

    try {
      setUnassignLoading(true)
      await patientsApi.unassignFromMe(patient.id)
      router.push("/patients?removed=1")
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setUnassignLoading(false)
    }
  }

  const isAlreadyAssigned = patient?.therapists?.some(
    (therapist) => therapist.id === user?.id
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Patient not found"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ⭐ CLINICAL PREMIUM HEADER */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between bg-background/40 backdrop-blur-sm p-6 rounded-2xl border border-border/60 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {patient.fullName}
          </h1>
          <p className="text-muted-foreground text-sm">
            Patient Profile · ID #{patient.id}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isAlreadyAssigned && (
            <Button
              variant="secondary"
              onClick={handleAssignToMe}
              disabled={assignLoading}
              className="px-4"
            >
              {assignLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Assign to Me
            </Button>
          )}

          <Link href={`/patients/${patient.id}/edit`}>
            <Button variant="outline" className="px-4">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>

          {isAlreadyAssigned && (
            <Button
              variant="destructive"
              disabled={unassignLoading}
              onClick={handleUnassignFromMe}
              className="px-4"
            >
              {unassignLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              Remove Patient
            </Button>
          )}

          {isAdmin && (
            <Button
              variant={patient.active ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={statusLoading}
              className="px-4"
            >
              {statusLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : patient.active ? (
                <UserX className="mr-2 h-4 w-4" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              {patient.active ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      </div>

      {/* 🔥 ERROR ALERT */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ⭐ PAGE CONTENT */}
      <div className="space-y-6">

        {/* BASIC INFO */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Basic Information</CardTitle>
              <Badge variant={patient.active ? "default" : "secondary"}>
                {patient.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p className="text-base">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            </div>

            {patient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{patient.phone}</p>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{patient.email}</p>
                </div>
              </div>
            )}

            {patient.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-base">{patient.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ASSIGNED THERAPISTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Therapists
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.therapists && patient.therapists.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.therapists.map((therapist) => (
                  <Badge key={therapist.id} variant="secondary" className="px-3 py-1">
                    {therapist.fullName}
                    {therapist.id === user?.id && " (You)"}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No therapists assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* GENERAL NOTES */}
        {patient.generalNotes && (
          <Card>
            <CardHeader>
              <CardTitle>General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {patient.generalNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* SYSTEM INFO */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Created: {new Date(patient.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(patient.updatedAt).toLocaleString()}</p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

export default function PatientDetailsPage() {
  return (
    <PrivateRoute>
      <PatientDetailsContent />
    </PrivateRoute>
  )
}
