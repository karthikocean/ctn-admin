import api from "@/services/api";

export const getModules = async (params: any) => {
  const response = await api.get("/modules", { params });
  return response.data;
};

export const createModule = async (data: any) => {
  const response = await api.post("/modules", data);
  return response.data;
};

export const updateModule = async (id: string, data: any) => {
  const response = await api.put(`/modules/${id}`, data);
  return response.data;
};

export const deleteModule = async (id: string) => {
  const response = await api.delete(`/modules/${id}`);
  return response.data;
};

export const getModuleDetails = async (id: string) => {
  const response = await api.get(`/modules/${id}`);
  return response.data;
};

export const getModulesList = async () => {
  const response = await api.get("/roles/modules");
  return response.data;
};
