import api from "@/services/api";

export interface IncompleteRegistrationItem {
  _id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  step?: string;
  deviceInfo?: string;
  fcmToken?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getIncompleteRegistrations = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  step?: string;
}) => {
  const response = await api.get("/incomplete-registrations", { params });
  return response.data;
};

export const getIncompleteRegistrationById = async (id: string) => {
  const response = await api.get(`/incomplete-registrations/${id}`);
  return response.data;
};

export const deleteIncompleteRegistration = async (id: string) => {
  const response = await api.delete(`/incomplete-registrations/${id}`);
  return response.data;
};
