import { axiosClient } from "./axios-client"

// Estructura EXACTA según tu PatientResponse.java
export interface Patient {
  id: number
  fullName: string
  dateOfBirth: string
  phone: string | null
  email: string | null
  address: string | null
  generalNotes: string | null // Correcto: coincide con tu backend
  active: boolean
  // Correcto: coincide con List<TherapistSummary>
  therapists: Array<{
    id: number
    fullName: string
  }>
  createdAt: string
  updatedAt: string
}

export interface CreatePatientRequest {
  fullName: string
  dateOfBirth: string // Importante: enviar YYYY-MM-DD
  phone?: string
  email?: string
  address?: string
  generalNotes?: string
}

export interface UpdatePatientRequest {
  fullName?: string
  dateOfBirth?: string
  phone?: string
  email?: string
  address?: string
  generalNotes?: string
}

// Función auxiliar para que Java no rechace la fecha
const formatDateForJava = (dateString: string | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toISOString().split('T')[0]; // "2024-01-01"
}

export const patientsApi = {
  async getAll(params?: { assignedToMe?: boolean; query?: string }): Promise<Patient[]> {
    const response = await axiosClient.get<Patient[]>("/api/v1/patients", {
      params: { 
        query: params?.query, // Correcto: tu controller usa @RequestParam String query
        assignedToMe: params?.assignedToMe 
      }
    })
    return response.data
  },

  async getById(id: number): Promise<Patient> {
    const response = await axiosClient.get<Patient>(`/api/v1/patients/${id}`)
    return response.data
  },

  async create(data: CreatePatientRequest): Promise<Patient> {
    // Aplicamos el formateo de fecha aquí
    const payload = {
        ...data,
        dateOfBirth: formatDateForJava(data.dateOfBirth)
    };
    const response = await axiosClient.post<Patient>("/api/v1/patients", payload)
    return response.data
  },

  async update(id: number, data: UpdatePatientRequest): Promise<Patient> {
    const payload = { ...data };
    if (payload.dateOfBirth) {
        payload.dateOfBirth = formatDateForJava(payload.dateOfBirth);
    }
    const response = await axiosClient.put<Patient>(`/api/v1/patients/${id}`, payload)
    return response.data
  },

  async updateStatus(id: number, active: boolean): Promise<void> {
    await axiosClient.patch(`/api/v1/patients/${id}/status`, { active })
  },

  async search(query: string): Promise<Patient[]> {
    const response = await axiosClient.get<Patient[]>("/api/v1/patients/search", {
      params: { query },
    })
    return response.data
  },

  async assignToMe(patientId: number): Promise<Patient> {
    const response = await axiosClient.post<Patient>(`/api/v1/patients/${patientId}/assign`)
    return response.data
  },

  async unassignFromMe(patientId: number): Promise<void> {
    await axiosClient.delete(`/api/v1/patients/${patientId}/assign`)
  },
}