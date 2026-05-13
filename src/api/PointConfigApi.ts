import api from "@/services/api";

export const getPointConfigs = async () => {
  const response = await api.get("/point-configs");
  return response.data;
};

export const createPointConfig = async (data: { moduleName: string; type: string; points: number }) => {
  const response = await api.post("/point-configs", data);
  return response.data;
};

export const updatePointConfig = async (id: string, data: { moduleName?: string; type?: string; points?: number }) => {
  const response = await api.put(`/point-configs/${id}`, data);
  return response.data;
};

export const deletePointConfig = async (id: string) => {
  const response = await api.delete(`/point-configs/${id}`);
  return response.data;
};

export const getPointConfigDetails = async (id: string) => {
  const response = await api.get(`/point-configs/${id}`);
  return response.data;
};
