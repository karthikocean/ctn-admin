import api from "@/services/api";

export interface GetPostsParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export const getPosts = async (params: GetPostsParams) => {
  const response = await api.get("/posts", { params });
  return response.data;
};

export const deletePost = async (id: string) => {
  const response = await api.delete(`/posts/${id}`);
  return response.data;
};

export const getReportedPosts = async (params: { page?: number; limit?: number }) => {
  const response = await api.get("/post-reports", { params });
  return response.data;
};

export const getReportedActivities = async (params: GetPostsParams) => {
  const response = await api.get("/posts/reported", { params });
  return response.data;
};

export const updatePostStatus = async (id: string, data: { status: string; reason?: string }) => {
  const response = await api.put(`/posts/${id}/status`, data);
  return response.data;
};
