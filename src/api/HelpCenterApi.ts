import api from "@/services/api";

export interface HelpCenterQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UpdateHelpCenterStatusData {
  status: string;
  adminNote?: string;
}

export const getHelpCenterItems = async (params: HelpCenterQueryParams) => {
  const response = await api.get("/suggestions", { params });
  return response.data;
};

export const getHelpCenterById = async (id: string) => {
  const response = await api.get(`/suggestions/${id}`);
  return response.data;
};

export const updateHelpCenterStatus = async (id: string, data: UpdateHelpCenterStatusData) => {
  const response = await api.put(`/suggestions/${id}/status`, data);
  return response.data;
};

export const deleteHelpCenterItem = async (id: string) => {
  const response = await api.delete(`/suggestions/${id}`);
  return response.data;
};
