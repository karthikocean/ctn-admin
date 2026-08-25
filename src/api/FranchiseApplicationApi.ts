import api from "@/services/api";

export interface FranchiseApplicationItem {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  state: string;
  city: string;
  companyName: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  adminNote?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FranchiseApplicationStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export const getFranchiseApplications = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  city?: string;
  status?: string;
}) => {
  const response = await api.get("/franchise-applications", { params });
  return response.data;
};

export const getFranchiseApplicationStats = async (): Promise<FranchiseApplicationStats> => {
  const response = await api.get("/franchise-applications/stats");
  return response.data;
};

export const getFranchiseApplicationById = async (id: string) => {
  const response = await api.get(`/franchise-applications/${id}`);
  return response.data;
};

export const updateFranchiseApplicationStatus = async (
  id: string,
  data: { status: string; adminNote?: string }
) => {
  const response = await api.patch(`/franchise-applications/${id}/status`, data);
  return response.data;
};

export const deleteFranchiseApplication = async (id: string) => {
  const response = await api.delete(`/franchise-applications/${id}`);
  return response.data;
};
