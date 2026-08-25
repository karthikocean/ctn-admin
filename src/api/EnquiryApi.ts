import api from "@/services/api";

export interface EnquiryItem {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  enquiryType?: string;
  city?: string;
  companyName?: string;
  comment?: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  adminNote?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export const getEnquiries = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  enquiryType?: string;
  status?: string;
}) => {
  const response = await api.get("/enquiries", { params });
  return response.data;
};

export const getEnquiryStats = async (): Promise<EnquiryStats> => {
  const response = await api.get("/enquiries/stats");
  return response.data;
};

export const getEnquiryById = async (id: string) => {
  const response = await api.get(`/enquiries/${id}`);
  return response.data;
};

export const updateEnquiryStatus = async (
  id: string,
  data: { status: string; adminNote?: string }
) => {
  const response = await api.patch(`/enquiries/${id}/status`, data);
  return response.data;
};

export const deleteEnquiry = async (id: string) => {
  const response = await api.delete(`/enquiries/${id}`);
  return response.data;
};
