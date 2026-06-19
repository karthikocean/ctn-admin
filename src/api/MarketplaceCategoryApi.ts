import api from "@/services/api";

export const getMarketplaceCategories = async (params?: any) => {
  const response = await api.get("/marketplace-category", { params });
  return response.data;
};

export const getMarketplaceCategoryDetails = async (id: string) => {
  const response = await api.get(`/marketplace-category/${id}`);
  return response.data;
};

export const createMarketplaceCategory = async (data: any) => {
  const response = await api.post("/marketplace-category", data);
  return response.data;
};

export const updateMarketplaceCategory = async (id: string, data: any) => {
  const response = await api.put(`/marketplace-category/${id}`, data);
  return response.data;
};

export const updateMarketplaceCategoryStatus = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/marketplace-category/${id}/status`, { isActive });
  return response.data;
};

export const deleteMarketplaceCategory = async (id: string) => {
  const response = await api.delete(`/marketplace-category/${id}`);
  return response.data;
};
