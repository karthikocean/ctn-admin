import api from "@/services/api";

export interface ReferralQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  referralFilter?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const getReferrals = async (params?: ReferralQueryParams) => {
  const response = await api.get("/referrals", { params });
  return response.data;
};

export const getReferralStats = async () => {
  const response = await api.get("/referrals/stats");
  return response.data;
};

export const getReferredMembers = async (memberId: string) => {
  const response = await api.get(`/referrals/${memberId}/referred-members`);
  return response.data;
};
