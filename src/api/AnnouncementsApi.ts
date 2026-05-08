import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getAnnouncements = async (params: any) => {
  const response = await axios.get(`${API_URL}/announcements`, { params });
  return response.data;
};

export const getAnnouncementDetails = async (id: string) => {
  const response = await axios.get(`${API_URL}/announcements/${id}`);
  return response.data;
};

export const createAnnouncement = async (data: any) => {
  const response = await axios.post(`${API_URL}/announcements`, data);
  return response.data;
};

export const updateAnnouncement = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/announcements/${id}`, data);
  return response.data;
};

export const deleteAnnouncement = async (id: string) => {
  const response = await axios.delete(`${API_URL}/announcements/${id}`);
  return response.data;
};
