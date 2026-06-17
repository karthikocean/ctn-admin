import api from "@/services/api";

export const getContributions = async (params: any) => {
  const response = await api.get("/contributions", { params });
  return response.data;
};

export const getRoles = async () => {
  const response = await api.get("/roles");
  return response.data;
};

