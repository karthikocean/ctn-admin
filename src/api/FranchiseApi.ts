import api from "@/services/api";

export const getFranchises = async (params: any) => {
  const response = await api.get("/franchises", { params });
  return response.data;
};

export const getFranchiseDetails = async (id: string) => {
  const response = await api.get(`/franchises/${id}`);
  return response.data;
};

export const createFranchise = async (data: any) => {
  const response = await api.post("/franchises", data);
  return response.data;
};

export const updateFranchise = async (id: string, data: any) => {
  const response = await api.put(`/franchises/${id}`, data);
  return response.data;
};

export const deleteFranchise = async (id: string) => {
  const response = await api.delete(`/franchises/${id}`);
  return response.data;
};

export const getFranchiseUsers = async () => {
  const response = await api.get("/admin-users/getfranchies-user");
  return response.data;
};
