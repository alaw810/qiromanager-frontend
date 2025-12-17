"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2 } from "lucide-react"

import { patientsApi, type CreatePatientRequest, type Patient } from "@/lib/api/patients-api"
import { getErrorMessage } from "@/lib/api/axios-client"

// 1. Validation Schema (English messages)
const patientSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters long"),
  dateOfBirth: z.string().refine((val) => val !== "", "Date of birth is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")), 
  address: z.string().optional(),
  generalNotes: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

interface PatientFormProps {
  patient?: Patient
  mode: "create" | "edit"
}

export function PatientForm({ patient, mode }: PatientFormProps) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: patient?.fullName || "",
      // Ensure YYYY-MM-DD format for date inputs
      dateOfBirth: patient?.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
      phone: patient?.phone || "",
      email: patient?.email || "",
      address: patient?.address || "",
      generalNotes: patient?.generalNotes || "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: PatientFormValues) => {
    setGlobalError(null)
    
    // Adapt data for API
    const requestData: CreatePatientRequest = {
      ...data,
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      generalNotes: data.generalNotes || "",
    }

    try {
      if (mode === "create") {
        const newPatient = await patientsApi.create(requestData)
        router.push(`/patients/${newPatient.id}`)
      } else if (patient) {
        await patientsApi.update(patient.id, requestData)
        router.push(`/patients/${patient.id}`)
      }
      router.refresh()
    } catch (err) {
      setGlobalError(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Patient" : "Edit Patient"}</CardTitle>
      </CardHeader>
      <CardContent>
        {globalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Field: Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field: Date of Birth */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field: Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+34 600 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field: Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="patient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field: Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle Principal 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field: Notes */}
            <FormField
              control={form.control}
              name="generalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Medical history, allergies, etc..." 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Patient" : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}