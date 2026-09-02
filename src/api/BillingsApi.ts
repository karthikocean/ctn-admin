import api from "@/services/api";

export const getBillings = async (params: any) => {
  const response = await api.get("/billings", { params });
  return response.data;
};

export const createBilling = async (data: any) => {
  const response = await api.post("/billings", data);
  return response.data;
};

export const updateBilling = async (id: string, data: any) => {
  const response = await api.put(`/billings/${id}`, data);
  return response.data;
};

export const deleteBilling = async (id: string) => {
  const response = await api.delete(`/billings/${id}`);
  return response.data;
};

export const getBillingDetails = async (id: string) => {
  const response = await api.get(`/billings/${id}`);
  return response.data;
};

export const downloadInvoice = async (id: string) => {
  const response = await api.get(`/billings/${id}/invoice`, {
    responseType: "blob",
  });
  return response.data;
};
