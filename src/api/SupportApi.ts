import api from "@/services/api";

export interface SupportItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  category?: string;
  description?: string;
  descrip?: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetSupportsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
}

export const getSupports = async (params?: GetSupportsParams) => {
  const response = await api.get("/supports", { params });
  return response.data;
};

export const getSupportStats = async () => {
  const response = await api.get("/supports/stats");
  return response.data;
};

export const getSupportById = async (id: string) => {
  const response = await api.get(`/supports/${id}`);
  return response.data;
};

export const updateSupportStatus = async (
  id: string,
  data: { status: string; isActive?: boolean }
) => {
  const response = await api.put(`/supports/${id}/status`, data);
  return response.data;
};

export const updateSupport = async (id: string, data: Partial<SupportItem>) => {
  const response = await api.put(`/supports/${id}`, data);
  return response.data;
};

export const deleteSupport = async (id: string) => {
  const response = await api.delete(`/supports/${id}`);
  return response.data;
};
