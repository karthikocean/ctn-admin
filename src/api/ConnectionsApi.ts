import api from "@/services/api";

export interface ConnectionsSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  regionId?: string;
}

export interface ConnectionDrilldownParams {
  memberId: string;
  type: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const getConnectionsSummary = async (params: ConnectionsSummaryParams) => {
  const response = await api.get("/connections/summary", { params });
  return response.data;
};

export const getConnectionDrilldown = async (params: ConnectionDrilldownParams) => {
  const response = await api.get("/connections/drilldown", { params });
  return response.data;
};

export const getConnections = async (params: any) => {
  const response = await api.get("/connections", { params });
  return response.data;
};
