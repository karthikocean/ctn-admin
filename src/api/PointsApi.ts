import api from "@/services/api";

export const getPointsHistory = async () => {
  const response = await api.get("/points/history");
  return response.data;
};
