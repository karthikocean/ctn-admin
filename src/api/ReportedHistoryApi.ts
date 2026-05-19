import api from "@/services/api";

export const getReportedHistory = async (params: { page?: number; limit?: number }) => {
  const response = await api.get("/reported-history", { params });
  return response.data;
};
