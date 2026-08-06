import api from "../services/api";

export interface DashboardQueryParams {
  preset?: string;
  startDate?: string;
  endDate?: string;
  regionId?: string;
  categoryId?: string;
}

export const getDashboardStats = async (params?: DashboardQueryParams) => {
  const response = await api.get("/dashboard/stats", { params });
  return response.data;
};
