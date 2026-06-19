import api from "@/services/api";

export const getCoupons = async (params: any) => {
  const response = await api.get("/coupons", { params });
  return response.data;
};

export const createCoupon = async (data: any) => {
  const response = await api.post("/coupons", data);
  return response.data;
};

export const updateCoupon = async (id: string, data: any) => {
  const response = await api.put(`/coupons/${id}`, data);
  return response.data;
};

export const deleteCoupon = async (id: string) => {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
};

export const getCouponDetails = async (id: string) => {
  const response = await api.get(`/coupons/${id}`);
  return response.data;
};
