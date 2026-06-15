import api from "@/services/api";

export const getBlogs = async (params: any) => {
  const response = await api.get(`/blogs`, { params });
  return response.data;
};

export const getBlogDetails = async (id: string) => {
  const response = await api.get(`/blogs/${id}`);
  return response.data;
};

export const createBlog = async (data: any) => {
  const response = await api.post(`/blogs`, data);
  return response.data;
};

export const updateBlog = async (id: string, data: any) => {
  const response = await api.put(`/blogs/${id}`, data);
  return response.data;
};

export const deleteBlog = async (id: string) => {
  const response = await api.delete(`/blogs/${id}`);
  return response.data;
};
