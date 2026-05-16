import api from "@/services/api";

export const getPlans = async (params: any) => {
  const response = await api.get("/plans", { params });
  return response.data;
};

export const createPlan = async (data: any) => {
  const response = await api.post("/plans", data);
  return response.data;
};

export const updatePlan = async (id: string, data: any) => {
  const response = await api.put(`/plans/${id}`, data);
  return response.data;
};

export const deletePlan = async (id: string) => {
  const response = await api.delete(`/plans/${id}`);
  return response.data;
};
