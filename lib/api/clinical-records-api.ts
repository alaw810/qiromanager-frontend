import { axiosClient } from "./axios-client";
// IMPORTANTE: Usamos el tipo global para que coincida con tu componente
import { ClinicalRecord } from "@/types";

export const clinicalRecordsApi = {
  // GET: Obtener historial
  getByPatientId: async (patientId: number | string): Promise<ClinicalRecord[]> => {
    // 1. Pedimos los datos al backend (que pueden venir con campos estilo Java 'type')
    const { data } = await axiosClient.get<any[]>(`/api/v1/patients/${patientId}/clinical-records`);
    
    // 2. Mapeamos la respuesta del backend al tipo ClinicalRecord de tu frontend
    return data.map(record => ({
      id: record.id,
      patientId: record.patientId,
      therapistName: record.therapistName,
      // Truco: Si el backend manda 'type', lo asignamos a 'recordType'
      // Si manda 'recordType', lo usamos directo.
      recordType: record.recordType || record.type, 
      content: record.content,
      createdAt: record.createdAt,
      attachments: record.attachments || [] // Aseguramos array vacío si es null
    }));
  },

  // POST: Crear registro con FormData
  create: async (patientId: number | string, content: string, type: string, file?: File | null): Promise<ClinicalRecord> => {
    const formData = new FormData();

    // El backend Spring Boot espera un JSON String dentro de la parte 'request'
    // Y espera el campo 'type' (según CreateClinicalRecordRequest.java)
    const requestBody = { 
      type: type, 
      content: content 
    };
    
    // Conversión a Blob JSON obligatoria para Spring Boot
    formData.append(
      "request", 
      new Blob([JSON.stringify(requestBody)], { type: "application/json" })
    );

    if (file) {
      formData.append("file", file);
    }

    // Enviamos
    const { data } = await axiosClient.post<any>(
      `/api/v1/patients/${patientId}/clinical-records`, 
      formData
    );

    // Devolvemos el objeto mapeado correctamente para que React no se queje
    return {
      id: data.id,
      patientId: data.patientId,
      therapistName: data.therapistName,
      recordType: data.recordType || data.type,
      content: data.content,
      createdAt: data.createdAt,
      attachments: data.attachments || []
    };
  }
};