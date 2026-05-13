import api from "@/services/api";

export interface SpotlightQueryParams {
  page?: number;
  limit?: number;
  status?: string;
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
