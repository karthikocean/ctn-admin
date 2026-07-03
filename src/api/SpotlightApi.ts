import api from "@/services/api";

export interface SpotlightQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface CreateSpotlightData {
  members: string[];
  scheduleDate: Date | string;
  status?: string;
}

export const getSpotlights = async (params: SpotlightQueryParams) => {
  const response = await api.get("/spotlights", { params });
  return response.data;
};

export const getSpotlightDetails = async (id: string) => {
  const response = await api.get(`/spotlights/${id}`);
  return response.data;
};

export const createSpotlight = async (data: CreateSpotlightData) => {
  const response = await api.post("/spotlights", data);
  return response.data;
};

export const updateSpotlight = async (id: string, data: Partial<CreateSpotlightData>) => {
  const response = await api.put(`/spotlights/${id}`, data);
  return response.data;
};

export const deleteSpotlight = async (id: string) => {
  const response = await api.delete(`/spotlights/${id}`);
  return response.data;
};

export const getSpotlightRequests = async (params: SpotlightQueryParams) => {
  const response = await api.get("/spotlights/requests", { params });
  return response.data;
};

export const approveSpotlightRequest = async (id: string, data: { scheduleDate: string; status?: string }) => {
  const response = await api.put(`/spotlights/requests/${id}/approve`, data);
  return response.data;
};

export const getBookedDates = async () => {
  const response = await api.get("/spotlights/booked-dates");
  return response.data;
};

export const rejectSpotlightRequest = async (id: string, reason: string) => {
  const response = await api.put(`/spotlights/requests/${id}/reject`, { reason });
  return response.data;
};

export const deleteSpotlightRequest = async (id: string) => {
  const response = await api.delete(`/spotlights/requests/${id}`);
  return response.data;
};

export interface SpotlightHistoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
}

export const getSpotlightHistory = async (params: SpotlightHistoryQueryParams) => {
  const response = await api.get("/spotlights/history", { params });
  return response.data;
};


