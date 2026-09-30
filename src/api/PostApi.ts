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

export const createPost = async (data: any) => {
  const response = await api.post("/posts", data);
  return response.data;
};

export const getCommonStates = async () => {
  try {
    const response = await api.get("/common/states");
    return response.data;
  } catch {
    const response = await api.get("/mobile-api/common/states", {
      baseURL: api.defaults.baseURL?.replace("/api/admin", "")
    });
    return response.data;
  }
};

export const getCommonBusinessRegions = async (stateIds?: string[]) => {
  const params: any = { limit: 1000 };
  if (stateIds && stateIds.length > 0) {
    params.stateIds = stateIds.join(",");
  }
  try {
    const response = await api.get("/mobile-api/common/business-regions", {
      params,
      baseURL: api.defaults.baseURL?.replace("/api/admin", "")
    });
    return response.data;
  } catch {
    const response = await api.get("/business-regions/areas", { params: { limit: 1000 } });
    return response.data;
  }
};


