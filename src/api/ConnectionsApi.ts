import api from "@/services/api";

export const getConnections = async (params: { page?: number; limit?: number; search?: string; status?: string }) => {
  const response = await api.get("/connections", { params });
  return response.data;
};
