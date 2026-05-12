import api from "@/services/api";

export const getTrainings = async (params: any) => {
  const response = await api.get("/trainings", { params });
  return response.data;
};

export const getTrainingById = async (id: string) => {
  const response = await api.get(`/trainings/${id}`);
  return response.data;
};

export const createTraining = async (data: any) => {
  const response = await api.post("/trainings", data);
  return response.data;
};

export const updateTraining = async (id: string, data: any) => {
  const response = await api.put(`/trainings/${id}`, data);
  return response.data;
};

export const deleteTraining = async (id: string) => {
  const response = await api.delete(`/trainings/${id}`);
  return response.data;
};
