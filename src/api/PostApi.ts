import api from "@/services/api";

export interface GetPostsParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}

export const getPosts = async (params: GetPostsParams) => {
  const response = await api.get("/posts", { params });
  return response.data;
};

export const deletePost = async (id: string) => {
  const response = await api.delete(`/posts/${id}`);
  return response.data;
};
