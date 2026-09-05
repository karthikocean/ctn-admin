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
  const contentDisposition = response.headers?.["content-disposition"] || response.headers?.["Content-Disposition"];
  const xInvoiceNumber = response.headers?.["x-invoice-number"] || response.headers?.["X-Invoice-Number"];
  let filename = "";
  if (xInvoiceNumber) {
    filename = `${xInvoiceNumber}.pdf`;
  } else if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, "").trim();
    }
  }
  const blob = response.data;
  if (blob && typeof blob === "object") {
    (blob as any).filename = filename;
  }
  return blob;
};
