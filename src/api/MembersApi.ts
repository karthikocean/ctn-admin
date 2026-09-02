import api from "@/services/api";

export const registerMember = async (data: any) => {
  const response = await api.post("/members/register", data);
  return response.data;
};

export const verifyGST = async (gstin: string) => {
  const response = await api.get(`/common/verify-gst?gstin=${gstin}`);
  return response.data;
};

export const getMembers = async (params: any) => {
  const response = await api.get("/members", { params });
  return response.data;
};

export const getMemberDetails = async (id: string) => {
  const response = await api.get(`/members/${id}`);
  return response.data;
};

export const updateMember = async (id: string, data: any) => {
  const response = await api.put(`/members/${id}`, data);
  return response.data;
};

export const deleteMember = async (id: string) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};

export const updateMemberStatus = async (id: string, status: string) => {
  const response = await api.put(`/members/${id}/status`, { status });
  return response.data;
};

export const getBusinessRegion = async (state: string, city: string) => {
  const response = await api.get(`/common/business-region`, { params: { state, city } })
  return response.data;
}

export const getStates = async () => {
  try {
    const response = await api.get("/common/states");
    return response.data;
  } catch (error) {
    try {
      const response = await api.get("/mobile-api/common/states", {
        baseURL: api.defaults.baseURL?.replace("/api/admin", "")
      });
      return response.data;
    } catch {
      return { success: false, data: [] };
    }
  }
};

export const getCities = async (params?: { stateIds?: string; search?: string }) => {
  try {
    const response = await api.get("/common/cities", { params });
    return response.data;
  } catch (error) {
    try {
      const response = await api.get("/mobile-api/common/cities", {
        params,
        baseURL: api.defaults.baseURL?.replace("/api/admin", "")
      });
      return response.data;
    } catch {
      return { success: false, data: [] };
    }
  }
};
