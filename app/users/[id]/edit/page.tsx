"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminRoute } from "@/components/auth/admin-route"
import { usersApi, type User, type UpdateUserRequest } from "@/lib/api/users-api"
import { getErrorMessage } from "@/lib/api/axios-client"
import { useToast } from "@/hooks/use-toast"

// Schema de validación en inglés
const userSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  role: z.enum(["USER", "ADMIN"]),
  active: z.boolean(),
})

type UserFormValues = z.infer<typeof userSchema>

export default function EditUserPage() {
  return (
    <AdminRoute>
      <EditUserContent />
    </AdminRoute>
  )
}

function EditUserContent() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      role: "USER",
      active: true,
    },
  })

  // Carga inicial de datos
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = Number(params.id)
        if (isNaN(userId)) {
          setError("Invalid User ID")
          return
        }
        
        const data = await usersApi.getById(userId)
        setCurrentUser(data) // Guardamos el usuario original para comparar cambios
        
        // Rellenamos el formulario
        form.reset({
          fullName: data.fullName || "",
          email: data.email || "",
          username: data.username,
          role: data.role,
          active: data.active,
        })
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [params.id, form])

  const onSubmit = async (data: UserFormValues) => {
    setError(null)
    const userId = Number(params.id)

    try {
      // 1. Preparamos datos para el PUT (Actualización de info)
      // Aseguramos que se envía el username, solucionando el error del backend
      const updateData: UpdateUserRequest = {
        fullName: data.fullName,
        email: data.email,
        username: data.username, 
        role: data.role,
      }
      
      await usersApi.update(userId, updateData)

      // 2. Si cambió el estado 'active', hacemos la llamada PATCH adicional
      if (currentUser && data.active !== currentUser.active) {
        await usersApi.updateStatus(userId, data.active)
      }

      toast({ title: "User updated successfully" })
      router.push("/users")
      router.refresh() // Actualiza la lista anterior
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit User Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Username (Deshabilitado visualmente, pero se envía) */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted text-muted-foreground" />
                    </FormControl>
                    <FormDescription>Username cannot be modified.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Selector */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USER">Therapist (User)</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status Switch */}
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm mt-auto">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Account</FormLabel>
                        <FormDescription className="text-xs">
                          Enable or disable access
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}