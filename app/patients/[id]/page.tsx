"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
import { useToast } from "@/hooks/use-toast" // Asegúrate que la ruta sea correcta según tu proyecto
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
  ArrowLeft,
  FileText,
  Activity,
  User
} from "lucide-react"
import { PatientDetailSkeleton } from "@/components/patients/patient-detail-skeleton"

// Importamos los componentes de las nuevas pestañas
import ClinicalHistoryTab from "@/components/patients/tabs/clinical-history-tab"
import TreatmentSessionsTab from "@/components/patients/tabs/treatment-sessions-tab"

function PatientDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false)
  const [unassignLoading, setUnassignLoading] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

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
      setPatient(prev => prev ? { ...prev, active: !prev.active } : null)
      toast({ title: `Patient ${!patient.active ? 'activated' : 'deactivated'} successfully` })
    } catch (err) {
      toast({ title: "Error updating status", description: getErrorMessage(err), variant: "destructive" })
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
      await loadPatient()
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
      setIsUnassignDialogOpen(false)
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString() 
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
            Volver al listado
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in-50 duration-500">

      {/* HEADER CARD - Siempre visible */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {patient.fullName}
            </h1>
            <Badge variant={patient.active ? "default" : "secondary"}>
              {patient.active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm flex gap-4">
             <span className="flex items-center gap-1"><User className="w-3 h-3"/> ID #{patient.id}</span>
             {patient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {patient.email}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {/* Actions */}
          {!isAlreadyAssigned && (
            <Button variant="secondary" onClick={handleAssignToMe} disabled={assignLoading}>
              {assignLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Asignarme
            </Button>
          )}

          <Link href={`/patients/${patient.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>

          {isAlreadyAssigned && (
            <Button variant="destructive" onClick={() => setIsUnassignDialogOpen(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Dejar de tratar
            </Button>
          )}

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
                "Desactivar"
              ) : (
                <span className="flex items-center text-green-600"><UserCheck className="mr-2 h-4 w-4" /> Activar</span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* TABS PRINCIPALES */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-100">
          <TabsTrigger value="details">General</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="treatments">Sesiones</TabsTrigger>
        </TabsList>
        
        <Separator />

        {/* TAB 1: DETALLES GENERALES (Lo que ya tenías) */}
        <TabsContent value="details" className="space-y-4 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" /> Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-[30px_1fr] items-start">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Fecha Nacimiento</p>
                      <p className="text-sm text-muted-foreground">{formatDate(patient.dateOfBirth)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[30px_1fr] items-start">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">{patient.phone || "No registrado"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[30px_1fr] items-start">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{patient.email || "No registrado"}</p>
                    </div>
                  </div>

                  {patient.address && (
                    <div className="grid grid-cols-[30px_1fr] items-start">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Dirección</p>
                        <p className="text-sm text-muted-foreground">{patient.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team & Notes */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" /> Equipo Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.therapists && patient.therapists.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.therapists.map((therapist) => (
                        <Badge key={therapist.id} variant="secondary" className="px-3 py-1">
                          {therapist.fullName}
                          {therapist.id === user?.id && " (Tú)"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin terapeutas asignados.</p>
                  )}
                </CardContent>
              </Card>

              {patient.generalNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notas Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-md text-sm text-foreground/80 whitespace-pre-wrap border">
                      {patient.generalNotes}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: HISTORIAL CLÍNICO (Nuevo) */}
        <TabsContent value="history" className="pt-4">
           <div className="flex flex-col gap-4">
              <div className="flex items-center text-muted-foreground mb-2">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm">Registro de notas evolutivas e informes médicos.</span>
              </div>
              <ClinicalHistoryTab patientId={patient.id} />
           </div>
        </TabsContent>

        {/* TAB 3: SESIONES DE TRATAMIENTO (Nuevo) */}
        <TabsContent value="treatments" className="pt-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center text-muted-foreground mb-2">
                <Activity className="w-4 h-4 mr-2" />
                <span className="text-sm">Listado cronológico de intervenciones realizadas.</span>
              </div>
              <TreatmentSessionsTab patientId={patient.id} />
            </div>
        </TabsContent>
      </Tabs>

      {/* ALERT DIALOG: UNASSIGN CONFIRMATION */}
      <AlertDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dejar de tratar al paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará a <strong>{patient.fullName}</strong> de tu lista de pacientes activos.
              No se borrarán sus datos ni su historial, simplemente dejarás de estar asignado como su terapeuta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassignLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleUnassignFromMe()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={unassignLoading}
            >
              {unassignLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
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