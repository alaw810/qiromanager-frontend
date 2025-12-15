"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Users, Loader2, UserPlus, Check } from "lucide-react"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface PatientCardProps {
  patient: Patient
  onPatientUpdated?: (updatedPatient: Patient) => void
}

export function PatientCard({ patient, onPatientUpdated }: PatientCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isAssigning, setIsAssigning] = useState(false)

  const isAlreadyAssigned = patient.therapists?.some((therapist) => therapist.id === user?.id)

  const handleAssignToMe = async () => {
    try {
      setIsAssigning(true)
      const updatedPatient = await patientsApi.assignToMe(patient.id)
      toast({
        title: "Patient added to your list",
        description: `${patient.fullName} has been assigned to you.`,
      })
      // Notify parent component to update state
      onPatientUpdated?.(updatedPatient)
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{patient.fullName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Born: {new Date(patient.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={patient.active ? "default" : "secondary"}>{patient.active ? "Active" : "Inactive"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{patient.email}</span>
          </div>
        )}
        {patient.therapists && patient.therapists.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {patient.therapists.map((therapist) => (
                <Badge key={therapist.id} variant="outline" className="text-xs">
                  {therapist.fullName}
                  {therapist.id === user?.id && " (You)"}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          {isAlreadyAssigned ? (
            <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
              <Check className="mr-2 h-4 w-4" />
              One of your patients
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="w-full" onClick={handleAssignToMe} disabled={isAssigning}>
              {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add to my patients
            </Button>
          )}
          <Link href={`/patients/${patient.id}`}>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
