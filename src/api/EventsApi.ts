import api from "@/services/api";

export const getEvents = async (params: any) => {
  const response = await api.get(`/events`, { params });
  return response.data;
};

export const getEventDetails = async (id: string) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (data: any) => {
  const response = await api.post(`/events`, data);
  return response.data;
};

export const updateEvent = async (id: string, data: any) => {
  const response = await api.put(`/events/${id}`, data);
  return response.data;
};

export const deleteEvent = async (id: string) => {
  const response = await api.delete(`/events/${id}`);
  return response.data;
};
