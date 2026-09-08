import api from "../services/api";

export interface ActivityGapReminderPayload {
  activityType: "notPosted" | "notAsked" | "notGiven" | "notRequirements";
  title: string;
  message: string;
  regionId?: string;
  categoryId?: string;
}

export interface AdminNotification {
  _id: string;
  sub: string;
  msg: string;
  moduleName: "ENQUIRY" | "SUPPORT" | "SUGGESTION" | "FRANCHISE_APPLICATION" | string;
  moduleId?: string;
  senderId?: string;
  name?: string;
  phone?: string;
  email?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  sender?: {
    fullName?: string;
    mobileNumber?: string;
    profilePhoto?: string;
  } | null;
}

export interface GetAdminNotificationsParams {
  page?: number;
  limit?: number;
  moduleName?: string;
  isRead?: boolean;
  search?: string;
}

export const getAdminNotifications = async (params?: GetAdminNotificationsParams) => {
  const response = await api.get("/push-notification/details", { params });
  return response.data;
};

export const getAdminUnreadCount = async (): Promise<number> => {
  const response = await api.get("/push-notification/unread-count");
  return response.data?.data?.unreadCount ?? 0;
};

export const markNotificationsAsRead = async (notificationIds?: string[], moduleName?: string) => {
  const response = await api.put("/push-notification/read", { notificationIds, moduleName });
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put("/push-notification/read-all");
  return response.data;
};

export const sendActivityGapReminder = async (payload: ActivityGapReminderPayload) => {
  const response = await api.post("/push-notification/remind-activity-gap", payload);
  return response.data;
};

