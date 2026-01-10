import { axiosClient } from "./axios-client";

export interface TreatmentSession {
  id: number;
  patientId: number;
  sessionDate: string;
  notes: string;
  // Agrega aquí otros campos si tu backend los devuelve en TreatmentSessionResponse
}

export interface CreateSessionParams {
  patientId: number | string;
  diagnosis?: string;
  procedureApplied?: string;
  notes: string;
  date: string; // ISO String
}

export const treatmentSessionsApi = {
  
  create: async (params: CreateSessionParams) => {
    // Backend espera: { sessionDate: "...", notes: "..." }
    // Concatenamos info extra en las notas si el backend no tiene campos específicos
    const combinedNotes = `
      Diagnóstico: ${params.diagnosis || 'N/A'}
      Procedimiento: ${params.procedureApplied || 'N/A'}
      Notas: ${params.notes}
    `.trim();

    const payload = {
      sessionDate: params.date, // Asegúrate de que sea formato ISO (YYYY-MM-DDTHH:mm:ss)
      notes: combinedNotes
    };

    // Ruta correcta anidada
    const { data } = await axiosClient.post<TreatmentSession>(
      `/api/v1/patients/${params.patientId}/sessions`, 
      payload
    );
    return data;
  },

  getByPatientId: async (patientId: number | string): Promise<TreatmentSession[]> => {
    // Usamos el endpoint del backend que devuelve solo las sesiones de ESTE paciente
    const { data } = await axiosClient.get<TreatmentSession[]>(`/api/v1/patients/${patientId}/sessions`);
    return data;
  }
};