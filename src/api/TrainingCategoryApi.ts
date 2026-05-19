import api from "@/services/api";

export const getTrainingCategories = async (params?: any) => {
  const response = await api.get("/training-categories", { params });
  return response.data;
};

export const getTrainingCategoryDetails = async (id: string) => {
  const response = await api.get(`/training-categories/${id}`);
  return response.data;
};

export const createTrainingCategory = async (data: any) => {
  const response = await api.post("/training-categories", data);
  return response.data;
};

export const updateTrainingCategory = async (id: string, data: any) => {
  const response = await api.put(`/training-categories/${id}`, data);
  return response.data;
};

export const deleteTrainingCategory = async (id: string) => {
  const response = await api.delete(`/training-categories/${id}`);
  return response.data;
};
