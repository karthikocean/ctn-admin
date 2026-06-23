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

export const getFranchiseUsers = async (excludeFranchiseId?: string) => {
  const response = await api.get("/admin-users/getfranchies-user", {
    params: excludeFranchiseId ? { excludeFranchiseId } : {}
  });
  return response.data;
};

export const getCommissionReport = async (params: any) => {
  const response = await api.get("/franchises/commission-report", { params });
  return response.data;
};

export const settleCommission = async (data: any) => {
  const response = await api.post("/franchises/commission-report/settle", data);
  return response.data;
};

export const uploadReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append("files", file);
  const response = await api.post("/media/upload?folder=receipts", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const getCommissionReportDetails = async (params: { franchiseId: string; month: string }) => {
  const response = await api.get("/franchises/commission-report/details", { params });
  return response.data;
};

