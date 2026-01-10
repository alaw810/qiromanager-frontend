// types/index.ts

// Si quieres mover aquí la interfaz Patient que tienes en patients-api.ts también puedes, 
// pero de momento añadimos las nuevas:

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  fileType: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: number;
  therapistName: string; 
  recordType: 'INITIAL_EVALUATION' | 'PROGRESS_NOTE' | 'SESSION_NOTE' | 'MEDICAL_REPORT';
  content: string;
  createdAt: string; 
  attachments: Attachment[];
}

export interface TreatmentSession {
  id: string;
  patientId: number;
  therapistId: number;
  therapistName: string;
  date: string;
  diagnosis: string;
  procedureApplied: string;
  notes: string;
}