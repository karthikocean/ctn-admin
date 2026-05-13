import api from "@/services/api";

export const getRegions = async (params: any) => {
  const response = await api.get("/business-regions", { params });
  return response.data;
};

export const getRegionDetails = async (id: string) => {
  const response = await api.get(`/business-regions/${id}`);
  return response.data;
};

export const createRegion = async (data: any) => {
  const response = await api.post("/business-regions", data);
  return response.data;
};

export const updateRegion = async (id: string, data: any) => {
  const response = await api.put(`/business-regions/${id}`, data);
  return response.data;
};

export const deleteRegion = async (id: string) => {
  const response = await api.delete(`/business-regions/${id}`);
  return response.data;
};
