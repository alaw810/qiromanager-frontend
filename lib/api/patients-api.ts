import { axiosClient } from "./axios-client"

export interface Patient {
  id: number
  fullName: string
  dateOfBirth: string
  phone: string | null
  email: string | null
  address: string | null
  generalNotes: string | null
  active: boolean
  therapists: Array<{
    id: number
    fullName: string
  }>
  createdAt: string
  updatedAt: string
}

export interface CreatePatientRequest {
  fullName: string
  dateOfBirth: string
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

export const patientsApi = {
  async getAll(): Promise<Patient[]> {
    const response = await axiosClient.get<Patient[]>("/api/v1/patients")
    return response.data
  },

  async getById(id: number): Promise<Patient> {
    const response = await axiosClient.get<Patient>(`/api/v1/patients/${id}`)
    return response.data
  },

  async create(data: CreatePatientRequest): Promise<Patient> {
    const response = await axiosClient.post<Patient>("/api/v1/patients", data)
    return response.data
  },

  async update(id: number, data: UpdatePatientRequest): Promise<Patient> {
    const response = await axiosClient.put<Patient>(`/api/v1/patients/${id}`, data)
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
