import api from "@/services/api";

export const getAnnouncements = async (params: any) => {
  const response = await api.get(`/announcements`, { params });
  return response.data;
};

export const getAnnouncementDetails = async (id: string) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};

export const createAnnouncement = async (data: any) => {
  const response = await api.post(`/announcements`, data);
  return response.data;
};

export const updateAnnouncement = async (id: string, data: any) => {
  const response = await api.put(`/announcements/${id}`, data);
  return response.data;
};

export const deleteAnnouncement = async (id: string) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};
