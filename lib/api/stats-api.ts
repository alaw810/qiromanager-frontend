import { axiosClient } from "./axios-client";

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  myAssignedPatients: number;
  sessionsThisMonth: number;
}

export const statsApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await axiosClient.get<DashboardStats>("/api/v1/stats");
    return data;
  }
};