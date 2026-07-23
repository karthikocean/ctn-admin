import api from "@/services/api";

export const getContributions = async (params: any) => {
  const response = await api.get("/contributions", { params });
  return response.data;
};

export const getRoles = async () => {
  const response = await api.get("/roles");
  return response.data;
};

export const getContributionDetails = async (id: string) => {
  const response = await api.get(`/contributions/${id}`);
  return response.data;
};

