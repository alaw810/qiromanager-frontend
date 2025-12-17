"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  ArrowLeft
} from "lucide-react"
import { PatientDetailSkeleton } from "@/components/patients/patient-detail-skeleton"

function PatientDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  
  // Estado para el diálogo de confirmación
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false)
  const [unassignLoading, setUnassignLoading] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // Aseguramos que id es número
  const patientId = Number(params.id)

  const loadPatient = useCallback(async () => {
    try {
      setLoading(true)
      const data = await patientsApi.getById(patientId)
      setPatient(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (!isNaN(patientId)) {
      loadPatient()
    }
  }, [loadPatient, patientId])

  // --- ACTIONS ---

  const handleToggleStatus = async () => {
    if (!patient) return
    try {
      setStatusLoading(true)
      await patientsApi.updateStatus(patient.id, !patient.active)
      // Actualizamos localmente para feedback inmediato
      setPatient(prev => prev ? { ...prev, active: !prev.active } : null)
      toast({ title: `Patient ${!patient.active ? 'activated' : 'deactivated'} successfully` })
    } catch (err) {
      toast({ title: "Error updating status", description: getErrorMessage(err), variant: "destructive" })
      // Si falla, recargamos los datos reales por si acaso
      loadPatient() 
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!patient) return
    try {
      setAssignLoading(true)
      await patientsApi.assignToMe(patient.id)
      await loadPatient() // Recargar para ver el cambio en la lista de terapeutas
      toast({ title: "Patient added to your list" })
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setAssignLoading(false)
    }
  }

  const handleUnassignFromMe = async () => {
    if (!patient) return
    try {
      setUnassignLoading(true)
      await patientsApi.unassignFromMe(patient.id)
      setIsUnassignDialogOpen(false) // Cerrar diálogo
      router.push("/patients?removed=1")
    } catch (err) {
      toast({
        title: "Error removing patient",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setUnassignLoading(false)
    }
  }

  // Helper para formatear fechas de forma segura
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return dateString.split("T")[0] // YYYY-MM-DD simple y seguro
  }

  const isAlreadyAssigned = patient?.therapists?.some(
    (therapist) => therapist.id === user?.id
  )

  if (loading) {
    return <PatientDetailSkeleton />
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto mb-6">
          <AlertDescription>{error || "Patient not found"}</AlertDescription>
        </Alert>
        <Link href="/patients">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in-50 duration-500">

      {/* HEADER CARD */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between bg-background p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {patient.fullName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={patient.active ? "default" : "secondary"}>
              {patient.active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-muted-foreground text-sm">ID #{patient.id}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {/* Action: Assign / Edit */}
          {!isAlreadyAssigned && (
            <Button variant="secondary" onClick={handleAssignToMe} disabled={assignLoading}>
              {assignLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Assign to Me
            </Button>
          )}

          <Link href={`/patients/${patient.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>

          {/* Action: Unassign (Opens Dialog) */}
          {isAlreadyAssigned && (
            <Button variant="destructive" onClick={() => setIsUnassignDialogOpen(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}

          {/* Action: Admin Deactivate */}
          {isAdmin && (
            <Button
              variant="ghost"
              onClick={handleToggleStatus}
              disabled={statusLoading}
              className={patient.active ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
            >
              {statusLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : patient.active ? (
                "Deactivate User"
              ) : (
                <span className="flex items-center text-green-600"><UserCheck className="mr-2 h-4 w-4" /> Activate</span>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT COLUMN: Contact Info */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Birth Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(patient.dateOfBirth)}</p>
                </div>
              </div>

              {patient.phone ? (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <Phone className="h-5 w-5" /> <span className="text-sm">No phone registered</span>
                </div>
              )}

              {patient.email ? (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <Mail className="h-5 w-5" /> <span className="text-sm">No email registered</span>
                </div>
              )}

              {patient.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{patient.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Clinical Data & System */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Assigned Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.therapists && patient.therapists.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.therapists.map((therapist) => (
                    <Badge key={therapist.id} variant="secondary">
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

          {patient.generalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>General Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
                  {patient.generalNotes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ALERT DIALOG: UNASSIGN CONFIRMATION */}
      <AlertDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from your patients?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{patient.fullName}</strong> from your list. 
              You can assign them back later if needed. The patient record will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassignLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault() // Evitamos cierre automático para manejar loading
                handleUnassignFromMe()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={unassignLoading}
            >
              {unassignLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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