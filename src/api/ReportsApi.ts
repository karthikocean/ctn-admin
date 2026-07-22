import api from "../services/api";

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  regionId?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
}

export const getSubscriptionRenewalsReport = async (params: ReportQueryParams) => {
  const response = await api.get("/reports/subscription-renewals", { params });
  return response.data;
};

export const getFreeSubscriptionEndingsReport = async (params: ReportQueryParams) => {
  const response = await api.get("/reports/free-subscription-endings", { params });
  return response.data;
};
